import { describe, expect, it } from 'vitest';
import { InMemoryEventSink, InMemoryRunStore, WorkflowEngine, type WorkflowDefinition } from '../../packages/automation-runtime/src/index';

const linear = (overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition => ({
  id: 'demo',
  version: 1,
  name: 'Demo',
  startNodeId: 'a',
  nodes: [
    { id: 'a', kind: 'action', action: () => 'A', next: 'b', idempotencyKey: () => 'a:once' },
    { id: 'b', kind: 'agent', agent: async () => 'B', next: 'c' },
    { id: 'c', kind: 'verify', verify: () => true },
  ],
  ...overrides,
});

describe('automation runtime', () => {
  it('executes deterministic and agent nodes and records an auditable run', async () => {
    const events = new InMemoryEventSink();
    const engine = new WorkflowEngine({ events });
    engine.registry.register(linear());
    const runId = await engine.start('demo', { request: 'ship' });
    const run = engine.runStore.get(runId)!;
    expect(run.status).toBe('completed');
    expect(run.completedNodes).toEqual(['a', 'b', 'c']);
    expect(run.outputs).toMatchObject({ a: 'A', b: 'B' });
    expect(events.events.map((event) => event.type)).toContain('run.completed');
  });

  it('prevents a duplicate side effect with an idempotency key', async () => {
    let calls = 0;
    const engine = new WorkflowEngine();
    engine.registry.register({ id: 'once', version: 1, name: 'Once', startNodeId: 'a', nodes: [{ id: 'a', kind: 'action', action: () => { calls += 1; }, idempotencyKey: () => 'external:42' }] });
    await engine.start('once', {});
    await engine.start('once', {});
    expect(calls).toBe(1);
  });

  it('retries transient action failures with bounded attempts', async () => {
    let calls = 0;
    const engine = new WorkflowEngine();
    engine.registry.register({ id: 'retry', version: 1, name: 'Retry', startNodeId: 'a', nodes: [{ id: 'a', kind: 'action', retry: { maxAttempts: 3, backoffMs: 0 }, action: () => { calls += 1; if (calls < 3) throw new Error('transient'); return 'ok'; } }] });
    const id = await engine.start('retry', {});
    expect(engine.runStore.get(id)?.status).toBe('completed');
    expect(calls).toBe(3);
    expect(engine.runStore.get(id)?.attempts.a).toBe(3);
  });

  it('fails closed into a durable checkpoint when approval is not granted', async () => {
    const store = new InMemoryRunStore();
    const engine = new WorkflowEngine({ runs: store });
    engine.registry.register({ id: 'approval', version: 1, name: 'Approval', startNodeId: 'a', nodes: [{ id: 'a', kind: 'approval', approval: async () => false }] });
    const id = await engine.start('approval', {});
    expect(store.get(id)?.status).toBe('waiting');
    expect(store.get(id)?.currentNodeId).toBe('a');
  });

  it('rejects non-monotonic workflow versions', () => {
    const engine = new WorkflowEngine();
    engine.registry.register(linear());
    expect(() => engine.registry.register({ ...linear(), version: 1 })).toThrow('WORKFLOW_VERSION_NOT_MONOTONIC');
  });
});
