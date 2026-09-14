import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ExecutionFabric,
  LocalExecutionProvider,
  collectArtifact,
  type ExecutionPolicy,
} from '../../packages/execution/src/index.js';

const policy = (root: string, decision: 'ALLOW' | 'ASK' | 'DENY' = 'ALLOW'): ExecutionPolicy => ({
  permission: { decide: () => decision },
  allowedRootForWorkspace: () => root,
});

describe('stage 5 execution fabric', () => {
  it('executes without a shell and preserves correlation context', async () => {
    const root = await mkdtemp(join(tmpdir(), 'infinity11-stage5-'));
    try {
      const provider = new LocalExecutionProvider(policy(root));
      const result = await provider.execute({
        workspaceId: 'workspace-1',
        workingDirectory: root,
        command: [process.execPath, '-e', 'process.stdout.write("hello")'],
        network: 'allow',
        correlation: { correlationId: 'corr-1', workspaceId: 'workspace-1' },
        reason: 'integration test',
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('hello');
      expect(result.correlation.correlationId).toBe('corr-1');
      expect(result.permission).toBe('ALLOW');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('enforces workspace path isolation', async () => {
    const root = await mkdtemp(join(tmpdir(), 'infinity11-stage5-'));
    try {
      const provider = new LocalExecutionProvider(policy(root));
      await expect(
        provider.execute({
          workspaceId: 'workspace-1',
          workingDirectory: join(root, '..'),
          command: [process.execPath, '-e', 'process.stdout.write("bad")'],
          network: 'allow',
          correlation: { correlationId: 'corr-2' },
          reason: 'security test',
        }),
      ).rejects.toThrow('WORKSPACE_PATH_ESCAPE');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('requires explicit permission and rejects ASK or DENY', async () => {
    const root = await mkdtemp(join(tmpdir(), 'infinity11-stage5-'));
    try {
      const provider = new LocalExecutionProvider(policy(root, 'ASK'));
      await expect(
        provider.execute({
          workspaceId: 'workspace-1',
          workingDirectory: root,
          command: [process.execPath, '-e', ''],
          network: 'allow',
          correlation: { correlationId: 'corr-3' },
          reason: 'approval test',
        }),
      ).rejects.toThrow('EXECUTION_PERMISSION_ASK');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('enforces timeout and bounds captured output', async () => {
    const root = await mkdtemp(join(tmpdir(), 'infinity11-stage5-'));
    try {
      const provider = new LocalExecutionProvider(policy(root));
      const result = await provider.execute({
        workspaceId: 'workspace-1',
        workingDirectory: root,
        command: [
          process.execPath,
          '-e',
          'setInterval(() => process.stdout.write("1234567890"), 1)',
        ],
        network: 'allow',
        limits: { timeoutMs: 50, maxOutputBytes: 32 },
        correlation: { correlationId: 'corr-4' },
        reason: 'limit test',
      });
      expect(result.timedOut).toBe(true);
      expect(result.outputTruncated).toBe(true);
      expect(Buffer.byteLength(result.stdout)).toBeLessThanOrEqual(32);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('provides deterministic artifact metadata and provider selection', async () => {
    const root = await mkdtemp(join(tmpdir(), 'infinity11-stage5-'));
    try {
      const file = join(root, 'artifact.txt');
      await mkdir(root, { recursive: true });
      await (await import('node:fs/promises')).writeFile(file, 'artifact');
      const artifact = await collectArtifact(root, 'artifact.txt');
      expect(artifact).toMatchObject({ path: 'artifact.txt', size: 8 });
      expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
      const fabric = new ExecutionFabric([new LocalExecutionProvider(policy(root))]);
      expect(fabric.provider('local').id).toBe('local');
      await expect(fabric.provider('missing')).toThrow('EXECUTION_PROVIDER_NOT_FOUND:missing');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects network deny locally instead of pretending to isolate it', async () => {
    const root = await mkdtemp(join(tmpdir(), 'infinity11-stage5-'));
    try {
      const provider = new LocalExecutionProvider(policy(root));
      await expect(
        provider.execute({
          workspaceId: 'workspace-1',
          workingDirectory: root,
          command: [process.execPath, '-e', ''],
          network: 'deny',
          correlation: { correlationId: 'corr-5' },
          reason: 'network isolation test',
        }),
      ).rejects.toThrow('NETWORK_ISOLATION_UNAVAILABLE_LOCAL_PROVIDER');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
