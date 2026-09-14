import { randomUUID } from 'node:crypto';

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type NodeKind =
  | 'action'
  | 'agent'
  | 'condition'
  | 'parallel'
  | 'wait'
  | 'approval'
  | 'verify';
export type RetryPolicy = { maxAttempts: number; backoffMs: number };
export type WorkflowContext = Readonly<Record<string, unknown>>;

export interface WorkflowNode {
  id: string;
  kind: NodeKind;
  next?: string;
  onFalse?: string;
  action?: (ctx: WorkflowContext) => Promise<unknown> | unknown;
  agent?: (ctx: WorkflowContext) => Promise<unknown>;
  condition?: (ctx: WorkflowContext) => boolean | Promise<boolean>;
  branches?: readonly string[];
  waitMs?: number;
  approval?: (ctx: WorkflowContext) => Promise<boolean>;
  verify?: (ctx: WorkflowContext) => Promise<boolean> | boolean;
  retry?: RetryPolicy;
  idempotencyKey?: (ctx: WorkflowContext) => string;
}

export interface WorkflowDefinition {
  id: string;
  version: number;
  name: string;
  startNodeId: string;
  nodes: readonly WorkflowNode[];
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: WorkflowStatus;
  currentNodeId?: string;
  completedNodes: readonly string[];
  outputs: Readonly<Record<string, unknown>>;
  attempts: Readonly<Record<string, number>>;
  idempotencyKeys: readonly string[];
  checkpoint: number;
  waitingUntil?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowEvent {
  type:
    | 'run.started'
    | 'node.started'
    | 'node.completed'
    | 'run.waiting'
    | 'run.completed'
    | 'run.failed'
    | 'run.cancelled'
    | 'run.resumed';
  runId: string;
  workflowId: string;
  nodeId?: string;
  occurredAt: string;
  metadata: Readonly<Record<string, unknown>>;
}

export interface RunStore {
  create(run: WorkflowRun): void;
  get(runId: string): WorkflowRun | undefined;
  update(runId: string, patch: Partial<WorkflowRun>): WorkflowRun;
}

export interface EventSink {
  publish(event: WorkflowEvent): Promise<void> | void;
}

export interface Trigger {
  readonly id: string;
  start(input: WorkflowContext): Promise<string>;
}

const now = () => new Date().toISOString();
const copy = <T>(value: T): T => structuredClone(value);

const copyNode = (node: WorkflowNode): WorkflowNode => ({ ...node });
const copyDefinition = (definition: WorkflowDefinition): WorkflowDefinition => ({
  ...definition,
  nodes: definition.nodes.map(copyNode),
});

export class InMemoryRunStore implements RunStore {
  private readonly runs = new Map<string, WorkflowRun>();

  create(run: WorkflowRun): void {
    if (this.runs.has(run.id)) throw new Error(`RUN_ALREADY_EXISTS:${run.id}`);
    this.runs.set(run.id, copy(run));
  }

  get(runId: string): WorkflowRun | undefined {
    const run = this.runs.get(runId);
    return run ? copy(run) : undefined;
  }

  update(runId: string, patch: Partial<WorkflowRun>): WorkflowRun {
    const current = this.runs.get(runId);
    if (!current) throw new Error(`RUN_NOT_FOUND:${runId}`);
    const next = { ...current, ...copy(patch), updatedAt: now() };
    this.runs.set(runId, next);
    return copy(next);
  }
}

export class InMemoryEventSink implements EventSink {
  readonly events: WorkflowEvent[] = [];

  publish(event: WorkflowEvent): void {
    this.events.push(copy(event));
  }
}

export class WorkflowRegistry {
  private readonly definitions = new Map<string, Map<number, WorkflowDefinition>>();

  register(definition: WorkflowDefinition): void {
    if (!definition.id || definition.version < 1 || !definition.name) {
      throw new Error('INVALID_WORKFLOW');
    }
    if (!definition.nodes.some((node) => node.id === definition.startNodeId)) {
      throw new Error('START_NODE_NOT_FOUND');
    }
    if (new Set(definition.nodes.map((node) => node.id)).size !== definition.nodes.length) {
      throw new Error('DUPLICATE_NODE');
    }
    const ids = new Set(definition.nodes.map((node) => node.id));
    for (const node of definition.nodes) {
      if (node.next && !ids.has(node.next)) throw new Error(`NEXT_NODE_NOT_FOUND:${node.id}`);
      if (node.onFalse && !ids.has(node.onFalse)) {
        throw new Error(`FALSE_NODE_NOT_FOUND:${node.id}`);
      }
      if (node.retry && (node.retry.maxAttempts < 1 || node.retry.backoffMs < 0)) {
        throw new Error(`INVALID_RETRY:${node.id}`);
      }
      if (node.kind === 'parallel' && (!node.branches || node.branches.length === 0)) {
        throw new Error(`PARALLEL_WITHOUT_BRANCHES:${node.id}`);
      }
      if (node.kind === 'parallel' && node.branches?.some((id) => !ids.has(id))) {
        throw new Error(`PARALLEL_NODE_NOT_FOUND:${node.id}`);
      }
    }
    const versions =
      this.definitions.get(definition.id) ?? new Map<number, WorkflowDefinition>();
    if (versions.has(definition.version)) {
      throw new Error(`WORKFLOW_VERSION_EXISTS:${definition.id}:${definition.version}`);
    }
    versions.set(definition.version, copyDefinition(definition));
    this.definitions.set(definition.id, versions);
  }

  get(id: string, version?: number): WorkflowDefinition {
    const versions = this.definitions.get(id);
    if (!versions) throw new Error(`WORKFLOW_NOT_FOUND:${id}:${version ?? 'latest'}`);
    const selectedVersion = version ?? Math.max(...versions.keys());
    const definition = versions.get(selectedVersion);
    if (!definition) throw new Error(`WORKFLOW_NOT_FOUND:${id}:${selectedVersion}`);
    return copyDefinition(definition);
  }
}

export class IdempotencyLedger {
  private readonly completed = new Set<string>();

  has(key: string): boolean {
    return this.completed.has(key);
  }

  mark(key: string): void {
    this.completed.add(key);
  }
}

export class WorkflowEngine {
  private readonly definitions: WorkflowRegistry;
  private readonly runs: RunStore;
  private readonly events: EventSink;
  private readonly idempotency: IdempotencyLedger;
  private readonly contexts = new Map<string, WorkflowContext>();
  private readonly cancelled = new Set<string>();

  constructor(
    options: {
      registry?: WorkflowRegistry;
      runs?: RunStore;
      events?: EventSink;
      idempotency?: IdempotencyLedger;
    } = {},
  ) {
    this.definitions = options.registry ?? new WorkflowRegistry();
    this.runs = options.runs ?? new InMemoryRunStore();
    this.events = options.events ?? new InMemoryEventSink();
    this.idempotency = options.idempotency ?? new IdempotencyLedger();
  }

  get registry(): WorkflowRegistry {
    return this.definitions;
  }

  get runStore(): RunStore {
    return this.runs;
  }

  async start(workflowId: string, context: WorkflowContext, version?: number): Promise<string> {
    const definition = this.definitions.get(workflowId, version);
    const id = randomUUID();
    const timestamp = now();
    this.contexts.set(id, copy(context));
    this.runs.create({
      id,
      workflowId,
      workflowVersion: definition.version,
      status: 'pending',
      currentNodeId: definition.startNodeId,
      completedNodes: [],
      outputs: {},
      attempts: {},
      idempotencyKeys: [],
      checkpoint: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await this.events.publish({
      type: 'run.started',
      runId: id,
      workflowId,
      occurredAt: timestamp,
      metadata: {},
    });
    await this.execute(id);
    return id;
  }

  async resume(runId: string): Promise<WorkflowRun> {
    const run = this.requireRun(runId);
    if (run.status !== 'waiting' && run.status !== 'failed') {
      throw new Error(`RUN_NOT_RESUMABLE:${run.status}`);
    }
    if (run.status === 'waiting' && run.waitingUntil && Date.now() < Date.parse(run.waitingUntil)) {
      return run;
    }
    if (run.status === 'failed' && !run.currentNodeId) {
      throw new Error('RUN_MISSING_CHECKPOINT');
    }
    this.runs.update(runId, { status: 'running', waitingUntil: undefined, error: undefined });
    await this.events.publish({
      type: 'run.resumed',
      runId,
      workflowId: run.workflowId,
      nodeId: run.currentNodeId,
      occurredAt: now(),
      metadata: { checkpoint: run.checkpoint },
    });
    await this.execute(runId);
    return this.requireRun(runId);
  }

  cancel(runId: string): WorkflowRun {
    const run = this.requireRun(runId);
    this.cancelled.add(runId);
    const cancelled = this.runs.update(runId, { status: 'cancelled' });
    void this.events.publish({
      type: 'run.cancelled',
      runId,
      workflowId: run.workflowId,
      nodeId: run.currentNodeId,
      occurredAt: now(),
      metadata: {},
    });
    return cancelled;
  }

  private requireRun(id: string): WorkflowRun {
    const run = this.runs.get(id);
    if (!run) throw new Error(`RUN_NOT_FOUND:${id}`);
    return run;
  }

  private async execute(runId: string): Promise<void> {
    let run = this.requireRun(runId);
    const definition = this.definitions.get(run.workflowId, run.workflowVersion);
    const nodes = new Map(definition.nodes.map((node) => [node.id, node]));

    while (run.currentNodeId && run.status !== 'completed' && run.status !== 'cancelled') {
      if (this.cancelled.has(runId)) return;
      const node = nodes.get(run.currentNodeId);
      if (!node) {
        await this.fail(runId, `NODE_NOT_FOUND:${run.currentNodeId}`);
        return;
      }
      if (run.completedNodes.includes(node.id)) {
        run = this.runs.update(runId, { currentNodeId: node.next });
        continue;
      }
      await this.events.publish({
        type: 'node.started',
        runId,
        workflowId: run.workflowId,
        nodeId: node.id,
        occurredAt: now(),
        metadata: { kind: node.kind },
      });
      const outcome = await this.runNode(run, node, nodes);
      if (outcome === 'waiting' || outcome === 'failed') return;
      run = this.requireRun(runId);
      const completed = [...run.completedNodes, node.id];
      run = this.runs.update(runId, {
        status: 'running',
        completedNodes: completed,
        checkpoint: completed.length,
        currentNodeId: outcome === 'skip-next' ? node.onFalse : node.next,
        waitingUntil: undefined,
      });
      await this.events.publish({
        type: 'node.completed',
        runId,
        workflowId: run.workflowId,
        nodeId: node.id,
        occurredAt: now(),
        metadata: {},
      });
    }
    if (run.status !== 'cancelled') {
      run = this.runs.update(runId, { status: 'completed', currentNodeId: undefined });
      await this.events.publish({
        type: 'run.completed',
        runId,
        workflowId: run.workflowId,
        occurredAt: now(),
        metadata: { completedNodes: run.completedNodes.length },
      });
    }
  }

  private async runNode(
    run: WorkflowRun,
    node: WorkflowNode,
    nodes: ReadonlyMap<string, WorkflowNode>,
  ): Promise<'ok' | 'waiting' | 'failed' | 'skip-next'> {
    const context = this.contexts.get(run.id) ?? {};
    if (node.kind === 'wait') {
      if (!node.waitMs || node.waitMs < 0) return 'ok';
      if (!run.waitingUntil) {
        const waitingUntil = new Date(Date.now() + node.waitMs).toISOString();
        this.runs.update(run.id, { status: 'waiting', waitingUntil });
        await this.events.publish({
          type: 'run.waiting',
          runId: run.id,
          workflowId: run.workflowId,
          nodeId: node.id,
          occurredAt: now(),
          metadata: { waitingUntil },
        });
        return 'waiting';
      }
      if (Date.now() < Date.parse(run.waitingUntil)) return 'waiting';
      return 'ok';
    }
    if (node.kind === 'approval') {
      if (!node.approval) return 'waiting';
      return (await node.approval(context)) ? 'ok' : 'waiting';
    }
    if (node.kind === 'condition') {
      return node.condition && (await node.condition(context)) ? 'ok' : 'skip-next';
    }
    if (node.kind === 'parallel') {
      const branches = node.branches ?? [];
      await Promise.all(branches.map((branchId) => this.executeBranch(run, nodes, branchId)));
      return 'ok';
    }
    if (node.kind === 'verify') {
      if (node.verify && (await node.verify(context))) return 'ok';
      await this.fail(run.id, `${node.id}:VERIFICATION_FAILED`);
      return 'failed';
    }
    const execute = node.kind === 'agent' ? node.agent : node.action;
    if (!execute) {
      await this.fail(run.id, `NODE_HANDLER_MISSING:${node.id}`);
      return 'failed';
    }
    const key = node.idempotencyKey?.(context);
    if (key && this.idempotency.has(key)) return 'ok';
    const policy = node.retry ?? { maxAttempts: 1, backoffMs: 0 };
    let lastError = 'NODE_FAILED';
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
      this.runs.update(run.id, {
        attempts: { ...this.requireRun(run.id).attempts, [node.id]: attempt },
      });
      try {
        const output = await execute(context);
        const current = this.requireRun(run.id);
        this.runs.update(run.id, { outputs: { ...current.outputs, [node.id]: output } });
        if (key) {
          this.idempotency.mark(key);
          this.runs.update(run.id, {
            idempotencyKeys: [...this.requireRun(run.id).idempotencyKeys, key],
          });
        }
        return 'ok';
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (attempt < policy.maxAttempts && policy.backoffMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, policy.backoffMs * attempt));
        }
      }
    }
    await this.fail(run.id, `${node.id}:${lastError}`);
    return 'failed';
  }

  private async executeBranch(
    run: WorkflowRun,
    nodes: ReadonlyMap<string, WorkflowNode>,
    startNodeId: string,
  ): Promise<void> {
    let nodeId: string | undefined = startNodeId;
    const visited = new Set<string>();
    while (nodeId) {
      if (visited.has(nodeId)) throw new Error(`WORKFLOW_CYCLE:${nodeId}`);
      visited.add(nodeId);
      const node = nodes.get(nodeId);
      if (!node) throw new Error(`NODE_NOT_FOUND:${nodeId}`);
      const outcome = await this.runNode(this.requireRun(run.id), node, nodes);
      if (outcome === 'waiting' || outcome === 'failed') return;
      const current = this.requireRun(run.id);
      if (!current.completedNodes.includes(node.id)) {
        this.runs.update(run.id, { completedNodes: [...current.completedNodes, node.id] });
      }
      nodeId = outcome === 'skip-next' ? node.onFalse : node.next;
    }
  }

  private async fail(runId: string, error: string): Promise<void> {
    const run = this.runs.update(runId, { status: 'failed', error });
    await this.events.publish({
      type: 'run.failed',
      runId,
      workflowId: run.workflowId,
      nodeId: run.currentNodeId,
      occurredAt: now(),
      metadata: { error },
    });
  }
}

export class ManualTrigger implements Trigger {
  constructor(
    public readonly id: string,
    private readonly engine: WorkflowEngine,
    private readonly workflowId: string,
  ) {}

  start(input: WorkflowContext): Promise<string> {
    return this.engine.start(this.workflowId, input);
  }
}

export const workflowNode = (
  id: string,
  kind: NodeKind,
  next?: string,
): WorkflowNode => ({ id, kind, ...(next ? { next } : {}) });
