import { describe, expect, it } from 'vitest';
import {
  applyModificationPlan,
  buildModificationPlan,
  summarizeModification,
  validateModificationRequest,
  type ModificationPolicy,
  type ProjectFile,
  type ProjectStore,
} from '../packages/modification/src/index.js';

class MemoryStore implements ProjectStore {
  private readonly files = new Map<string, string>();
  private currentRevision = 1;
  failOnWrite = false;

  constructor(initial: Record<string, string> = {}) {
    for (const [path, content] of Object.entries(initial)) this.files.set(path, content);
  }

  async read(_projectId: string, path: string): Promise<ProjectFile | null> {
    const content = this.files.get(path);
    return content === undefined ? null : { path, content };
  }

  async write(_projectId: string, path: string, content: string): Promise<void> {
    if (this.failOnWrite) throw new Error('WRITE_FAILED');
    this.files.set(path, content);
    this.currentRevision += 1;
  }

  async remove(_projectId: string, path: string): Promise<void> {
    this.files.delete(path);
    this.currentRevision += 1;
  }

  async rename(_projectId: string, fromPath: string, toPath: string): Promise<void> {
    const content = this.files.get(fromPath);
    if (content === undefined) throw new Error('FILE_NOT_FOUND');
    this.files.delete(fromPath);
    this.files.set(toPath, content);
    this.currentRevision += 1;
  }

  async revision(_projectId: string): Promise<number> {
    return this.currentRevision;
  }
}

const allow: ModificationPolicy = { evaluate: () => 'allow' };
const ask: ModificationPolicy = { evaluate: () => 'ask' };
const request = {
  id: 'change_1',
  projectId: 'demo',
  baseRevision: 1,
  reason: 'Update the greeting',
  operations: [
    { kind: 'update' as const, path: 'src/app.ts', content: 'export const greeting = "hi";\n' },
    { kind: 'create' as const, path: 'README.md', content: '# Demo\n' },
  ],
};

describe('phase 15 AI project modification engine', () => {
  it('validates path traversal, duplicate paths, and operation shape', () => {
    const issues = validateModificationRequest({
      ...request,
      operations: [
        { kind: 'delete', path: '../secrets.txt' },
        { kind: 'update', path: 'src/app.ts' },
        { kind: 'rename', path: 'src/app.ts', toPath: 'src/other.ts' },
      ],
    });
    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['UNSAFE_PATH', 'CONTENT_REQUIRED', 'DUPLICATE_PATH']),
    );
  });

  it('creates a deterministic plan and rejects stale project revisions', async () => {
    const store = new MemoryStore({ 'src/app.ts': 'export const greeting = "hello";\n' });
    const plan = await buildModificationPlan(request, store, allow);
    expect(plan.policy).toBe('allow');
    expect(plan.changedFiles).toEqual(['README.md', 'src/app.ts']);
    expect(plan.checksum).toMatch(/^[0-9a-f]{8}$/);
    expect(summarizeModification(plan)).toContain('UPDATE src/app.ts');

    await expect(
      buildModificationPlan({ ...request, baseRevision: 99 }, store, allow),
    ).rejects.toThrow('STALE_PROJECT_REVISION');
  });

  it('enforces expected file hashes before planning', async () => {
    const store = new MemoryStore({ 'src/app.ts': 'original' });
    await expect(
      buildModificationPlan(
        {
          ...request,
          operations: [{ ...request.operations[0], expectedHash: 'deadbeef' }],
        },
        store,
        allow,
      ),
    ).rejects.toThrow('STALE_FILE');
  });

  it('fails closed on deny and requires explicit approval for ask', async () => {
    const store = new MemoryStore({ 'src/app.ts': 'old' });
    await expect(buildModificationPlan(request, store, { evaluate: () => 'deny' })).rejects.toThrow(
      'POLICY_DENIED',
    );

    const plan = await buildModificationPlan(request, store, ask);
    expect(plan.policy).toBe('ask');
    await expect(applyModificationPlan(request, plan, store)).rejects.toThrow('APPROVAL_REQUIRED');
  });

  it('applies approved create, update, delete, and rename operations', async () => {
    const store = new MemoryStore({ 'src/app.ts': 'old', 'obsolete.txt': 'remove me' });
    const plan = await buildModificationPlan(
      {
        ...request,
        operations: [
          { kind: 'update', path: 'src/app.ts', content: 'new' },
          { kind: 'create', path: 'README.md', content: '# Demo' },
          { kind: 'delete', path: 'obsolete.txt' },
        ],
      },
      store,
      allow,
    );
    const result = await applyModificationPlan(request, plan, store);
    expect(result.applied).toBe(true);
    expect(await store.read('demo', 'src/app.ts')).toMatchObject({ content: 'new' });
    expect(await store.read('demo', 'README.md')).toMatchObject({ content: '# Demo' });
    expect(await store.read('demo', 'obsolete.txt')).toBeNull();

    const renameRequest = {
      ...request,
      baseRevision: result.revision,
      operations: [{ kind: 'rename' as const, path: 'src/app.ts', toPath: 'src/main.ts' }],
    };
    const renamePlan = await buildModificationPlan(renameRequest, store, allow);
    await applyModificationPlan(renameRequest, renamePlan, store);
    expect(await store.read('demo', 'src/app.ts')).toBeNull();
    expect(await store.read('demo', 'src/main.ts')).toMatchObject({ content: 'new' });
  });

  it('rejects a plan when the project changes after planning', async () => {
    const store = new MemoryStore({ 'src/app.ts': 'old' });
    const plan = await buildModificationPlan(
      { ...request, operations: [{ kind: 'update', path: 'src/app.ts', content: 'new' }] },
      store,
      allow,
    );
    await store.write('demo', 'src/app.ts', 'concurrent');
    await expect(applyModificationPlan(request, plan, store)).rejects.toThrow('STALE_PLAN');
  });

  it('does not silently claim success when a store write fails', async () => {
    const store = new MemoryStore({ 'src/app.ts': 'old' });
    const plan = await buildModificationPlan(
      { ...request, operations: [{ kind: 'update', path: 'src/app.ts', content: 'new' }] },
      store,
      allow,
    );
    store.failOnWrite = true;
    await expect(applyModificationPlan(request, plan, store)).rejects.toThrow('WRITE_FAILED');
  });
});
