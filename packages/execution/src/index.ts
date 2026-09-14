import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { isAbsolute, relative, resolve } from 'node:path';

export type PermissionDecision = 'ALLOW' | 'ASK' | 'DENY';
export type NetworkPolicy = 'deny' | 'allow';

export interface CorrelationContext {
  correlationId: string;
  causationId?: string;
  actorId?: string;
  workspaceId?: string;
  projectId?: string;
}

export interface ExecutionLimits {
  timeoutMs: number;
  maxOutputBytes: number;
}

export interface ExecutionRequest {
  workspaceId: string;
  projectId?: string;
  workingDirectory: string;
  command: readonly string[];
  environment?: Readonly<Record<string, string>>;
  network: NetworkPolicy;
  limits?: Partial<ExecutionLimits>;
  correlation: CorrelationContext;
  reason: string;
}

export interface ExecutionArtifact {
  path: string;
  size: number;
  sha256: string;
}

export interface ExecutionResult {
  executionId: string;
  exitCode: number | null;
  signal?: string;
  stdout: string;
  stderr: string;
  outputTruncated: boolean;
  timedOut: boolean;
  durationMs: number;
  artifacts: readonly ExecutionArtifact[];
  provider: string;
  network: NetworkPolicy;
  permission: PermissionDecision;
  correlation: CorrelationContext;
}

export interface PermissionPolicy {
  decide(request: { capability: string; resource?: string; reason: string }): PermissionDecision;
}

export interface ExecutionPolicy {
  permission: PermissionPolicy;
  allowedRootForWorkspace(workspaceId: string): string;
  capability?: string;
}

export interface ExecutionProvider {
  readonly id: string;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
  cleanup(executionId: string): Promise<void>;
}

const DEFAULT_LIMITS: ExecutionLimits = { timeoutMs: 30_000, maxOutputBytes: 1_048_576 };
const ENV_ALLOWLIST = new Set([
  'PATH',
  'HOME',
  'LANG',
  'LC_ALL',
  'TMPDIR',
  'TERM',
  'CI',
  'NODE_ENV',
]);

function validateRequest(request: ExecutionRequest): void {
  if (!request.workspaceId || !request.workingDirectory) throw new Error('INVALID_EXECUTION_SCOPE');
  if (!request.command.length || request.command.some((part) => part.length === 0))
    throw new Error('INVALID_COMMAND');
  const timeout = request.limits?.timeoutMs;
  if (timeout != null && (!Number.isInteger(timeout) || timeout < 1 || timeout > 300_000))
    throw new Error('INVALID_TIMEOUT');
  const maxOutput = request.limits?.maxOutputBytes;
  if (
    maxOutput != null &&
    (!Number.isInteger(maxOutput) || maxOutput < 1 || maxOutput > 16 * 1024 * 1024)
  )
    throw new Error('INVALID_OUTPUT_LIMIT');
  if (
    request.environment &&
    Object.keys(request.environment).some((key) => !ENV_ALLOWLIST.has(key))
  )
    throw new Error('ENVIRONMENT_KEY_NOT_ALLOWED');
}

function assertInside(root: string, target: string): string {
  const rootAbs = resolve(root);
  const targetAbs = resolve(target);
  const rel = relative(rootAbs, targetAbs);
  if (
    rel === '' ||
    (!isAbsolute(rel) &&
      rel !== '..' &&
      !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`))
  )
    return targetAbs;
  throw new Error('WORKSPACE_PATH_ESCAPE');
}

function appendBounded(
  state: { text: string; bytes: number; truncated: boolean },
  chunk: Buffer,
  max: number,
): void {
  if (state.bytes >= max) {
    state.truncated = true;
    return;
  }
  const slice = chunk.subarray(0, max - state.bytes);
  state.text += slice.toString('utf8');
  state.bytes += slice.byteLength;
  if (slice.byteLength < chunk.byteLength) state.truncated = true;
}

export class LocalExecutionProvider implements ExecutionProvider {
  readonly id = 'local';
  private readonly running = new Map<string, ReturnType<typeof spawn>>();

  constructor(private readonly policy: ExecutionPolicy) {}

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    validateRequest(request);
    const permission = this.policy.permission.decide({
      capability: this.policy.capability ?? 'execution.execute',
      resource: request.workingDirectory,
      reason: request.reason,
    });
    if (permission !== 'ALLOW') throw new Error(`EXECUTION_PERMISSION_${permission}`);
    const cwd = assertInside(
      this.policy.allowedRootForWorkspace(request.workspaceId),
      request.workingDirectory,
    );
    if (request.network === 'deny') throw new Error('NETWORK_ISOLATION_UNAVAILABLE_LOCAL_PROVIDER');

    const limits = { ...DEFAULT_LIMITS, ...request.limits };
    const executionId = randomUUID();
    const started = Date.now();
    const stdout = { text: '', bytes: 0, truncated: false };
    const stderr = { text: '', bytes: 0, truncated: false };
    const env: Record<string, string> = {};
    for (const key of ENV_ALLOWLIST) {
      const value = request.environment?.[key] ?? process.env[key];
      if (value != null) env[key] = value;
    }

    await mkdir(cwd, { recursive: true });
    const executable = request.command[0];
    if (!executable) throw new Error('INVALID_COMMAND');
    const child = spawn(executable, request.command.slice(1), {
      cwd,
      env,
      shell: false,
      windowsHide: true,
    });
    this.running.set(executionId, child);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, limits.timeoutMs);

    try {
      child.stdout.on('data', (chunk: Buffer) =>
        appendBounded(stdout, chunk, limits.maxOutputBytes),
      );
      child.stderr.on('data', (chunk: Buffer) =>
        appendBounded(stderr, chunk, limits.maxOutputBytes),
      );
      const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
        (resolveExit, reject) => {
          child.once('error', reject);
          child.once('close', (code, signal) => resolveExit({ code, signal }));
        },
      );
      return {
        executionId,
        exitCode: exit.code,
        ...(exit.signal ? { signal: exit.signal } : {}),
        stdout: stdout.text,
        stderr: stderr.text,
        outputTruncated: stdout.truncated || stderr.truncated,
        timedOut,
        durationMs: Date.now() - started,
        artifacts: [],
        provider: this.id,
        network: request.network,
        permission,
        correlation: structuredClone(request.correlation),
      };
    } finally {
      clearTimeout(timer);
      this.running.delete(executionId);
    }
  }

  async cleanup(executionId: string): Promise<void> {
    const child = this.running.get(executionId);
    if (child) child.kill('SIGKILL');
    this.running.delete(executionId);
  }
}

export class ExecutionFabric {
  constructor(private readonly providers: readonly ExecutionProvider[]) {}

  provider(id: string): ExecutionProvider {
    const provider = this.providers.find((candidate) => candidate.id === id);
    if (!provider) throw new Error(`EXECUTION_PROVIDER_NOT_FOUND:${id}`);
    return provider;
  }

  execute(providerId: string, request: ExecutionRequest): Promise<ExecutionResult> {
    return this.provider(providerId).execute(request);
  }

  cleanup(providerId: string, executionId: string): Promise<void> {
    return this.provider(providerId).cleanup(executionId);
  }
}

export async function collectArtifact(root: string, path: string): Promise<ExecutionArtifact> {
  const safe = assertInside(root, resolve(root, path));
  const data = await readFile(safe);
  return {
    path: relative(resolve(root), safe),
    size: data.byteLength,
    sha256: createHash('sha256').update(data).digest('hex'),
  };
}

export async function removeWorkspace(root: string): Promise<void> {
  await rm(resolve(root), { recursive: true, force: true });
}
