import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, resolve, relative, isAbsolute } from 'node:path';
import type { CorrelationContext, PermissionDecision } from '@infinity-11/types';
import type { Capability, PermissionPolicy } from '@infinity-11/security';

export type NetworkPolicy = 'deny' | 'allow';

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
  sha256?: string;
}

export interface ExecutionResult {
  executionId: string;
  exitCode: number | null;
  signal?: string;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  durationMs: number;
  artifacts: readonly ExecutionArtifact[];
  provider: string;
  network: NetworkPolicy;
  permission: PermissionDecision;
}

export interface ExecutionProvider {
  readonly id: string;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
  cleanup(executionId: string): Promise<void>;
}

export interface ExecutionPolicy {
  permission: PermissionPolicy;
  allowedRootForWorkspace(workspaceId: string): string;
  capability: Capability;
}

const DEFAULT_LIMITS: ExecutionLimits = { timeoutMs: 30_000, maxOutputBytes: 1_048_576 };
const ENV_ALLOWLIST = new Set(['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'TERM', 'CI', 'NODE_ENV']);

function validateRequest(request: ExecutionRequest): void {
  if (!request.command.length || request.command.some((part) => !part.length)) throw new Error('INVALID_COMMAND');
  if (request.limits?.timeoutMs != null && (!Number.isInteger(request.limits.timeoutMs) || request.limits.timeoutMs < 1 || request.limits.timeoutMs > 300_000)) throw new Error('INVALID_TIMEOUT');
  if (request.limits?.maxOutputBytes != null && (!Number.isInteger(request.limits.maxOutputBytes) || request.limits.maxOutputBytes < 1 || request.limits.maxOutputBytes > 16 * 1024 * 1024)) throw new Error('INVALID_OUTPUT_LIMIT');
  if (request.environment && Object.keys(request.environment).some((key) => !ENV_ALLOWLIST.has(key))) throw new Error('ENVIRONMENT_KEY_NOT_ALLOWED');
}

function assertInside(root: string, target: string): string {
  const rootAbs = resolve(root);
  const targetAbs = resolve(target);
  const rel = relative(rootAbs, targetAbs);
  if (rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${requireSeparator()}`))) return targetAbs;
  throw new Error('WORKSPACE_PATH_ESCAPE');
}

function requireSeparator(): string { return process.platform === 'win32' ? '\\' : '/'; }

function boundedAppend(state: { text: string; bytes: number; truncated: boolean }, chunk: Buffer, max: number): void {
  if (state.bytes >= max) { state.truncated = true; return; }
  const remaining = max - state.bytes;
  const slice = chunk.subarray(0, remaining);
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
    const permission = this.policy.permission.decide({ capability: this.policy.capability, resource: request.workingDirectory, reason: request.reason });
    if (permission !== 'ALLOW') throw new Error(`EXECUTION_PERMISSION_${permission}`);
    const root = this.policy.allowedRootForWorkspace(request.workspaceId);
    const cwd = assertInside(root, request.workingDirectory);
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
    if (request.network === 'deny') {
      throw new Error('NETWORK_ISOLATION_UNAVAILABLE_LOCAL_PROVIDER');
    }
    await mkdir(cwd, { recursive: true });
    const child = spawn(request.command[0]!, request.command.slice(1), { cwd, env, shell: false, windowsHide: true });
    this.running.set(executionId, child);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, limits.timeoutMs);
    try {
      child.stdout.on('data', (chunk: Buffer) => boundedAppend(stdout, chunk, limits.maxOutputBytes));
      child.stderr.on('data', (chunk: Buffer) => boundedAppend(stderr, chunk, limits.maxOutputBytes));
      const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolveExit, reject) => {
        child.once('error', reject);
        child.once('close', (code, signal) => resolveExit({ code, signal }));
      });
      return {
        executionId,
        exitCode: exit.code,
        ...(exit.signal ? { signal: exit.signal } : {}),
        stdout: stdout.text,
        stderr: stderr.text,
        timedOut,
        durationMs: Date.now() - started,
        artifacts: [],
        provider: this.id,
        network: request.network,
        permission,
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

  async execute(providerId: string, request: ExecutionRequest): Promise<ExecutionResult> {
    return this.provider(providerId).execute(request);
  }
}

export async function collectArtifact(root: string, path: string): Promise<ExecutionArtifact> {
  const safe = assertInside(root, join(root, path));
  const stat = await readFile(safe);
  return { path: relative(resolve(root), safe), size: stat.byteLength };
}

export async function removeWorkspace(root: string): Promise<void> {
  await rm(resolve(root), { recursive: true, force: true });
}
