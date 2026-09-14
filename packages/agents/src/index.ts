import { randomUUID } from 'node:crypto';

export type AgentRunStatus =
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type PermissionDecision = 'ALLOW' | 'ASK' | 'DENY';

export interface AgentContext {
  workspaceId: string;
  projectId?: string;
  correlationId: string;
  actorId?: string;
  values: Readonly<Record<string, unknown>>;
}
export interface AgentBudget {
  maxIterations: number;
  maxChildren: number;
  maxParallelWorkers: number;
  maxDepth: number;
  timeoutMs: number;
  maxToolCalls: number;
  maxInputTokens: number;
  maxOutputTokens: number;
}
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: readonly string[];
  skills: readonly string[];
  modelPolicy: ModelPolicy;
  permissionPolicy: PermissionPolicy;
  memoryPolicy?: MemoryPolicy;
  contextPolicy?: ContextPolicy;
  budget: AgentBudget;
}
export interface AgentTask {
  id: string;
  description: string;
  requirements: readonly string[];
  parentTaskId?: string;
  depth: number;
}
export interface TaskGraph {
  root: AgentTask;
  tasks: readonly AgentTask[];
}
export interface ToolDefinition {
  id: string;
  description: string;
  capabilities: readonly string[];
}
export interface ToolCall {
  toolId: string;
  input: unknown;
  reason: string;
}
export interface ToolResult {
  toolId: string;
  ok: boolean;
  output?: unknown;
  error?: string;
}
export interface SkillDefinition {
  id: string;
  description: string;
  capabilities: readonly string[];
}
export interface ContextPolicy {
  select(
    context: AgentContext,
    task: AgentTask,
  ): Promise<Readonly<Record<string, unknown>>> | Readonly<Record<string, unknown>>;
}
export interface MemoryPolicy {
  recall(
    context: AgentContext,
    task: AgentTask,
    agentId: string,
  ): Promise<readonly unknown[]> | readonly unknown[];
  remember(entry: MemoryEntry): Promise<void> | void;
}
export interface ModelPolicy {
  select(task: AgentTask, candidates: readonly string[]): string;
}
export interface PermissionPolicy {
  decide(request: {
    capability: string;
    resource?: string | undefined;
    reason: string;
  }): PermissionDecision;
}
export interface AgentModelRequest {
  agent: AgentDefinition;
  task: AgentTask;
  context: Readonly<Record<string, unknown>>;
  memories: readonly unknown[];
  toolResults: readonly ToolResult[];
  iteration: number;
  usage: { inputTokens: number; outputTokens: number };
}
export type AgentAction =
  | { type: 'final'; output: unknown; usage?: { inputTokens?: number; outputTokens?: number } }
  | { type: 'tool'; call: ToolCall; usage?: { inputTokens?: number; outputTokens?: number } }
  | {
      type: 'approve';
      capability: string;
      resource?: string;
      reason: string;
      usage?: { inputTokens?: number; outputTokens?: number };
    }
  | {
      type: 'delegate';
      requirements: readonly string[];
      description: string;
      usage?: { inputTokens?: number; outputTokens?: number };
    };
export interface AgentModel {
  readonly id: string;
  run(request: AgentModelRequest): Promise<AgentAction>;
}
export interface ToolExecutor {
  execute(call: ToolCall, context: AgentContext): Promise<ToolResult>;
}
export interface ApprovalGate {
  request(input: {
    runId: string;
    taskId: string;
    capability: string;
    resource?: string | undefined;
    reason: string;
  }): Promise<boolean>;
}
export interface AgentRun {
  id: string;
  agentId: string;
  taskId: string;
  status: AgentRunStatus;
  startedAt?: string;
  completedAt?: string;
  iterations: number;
  toolCalls: number;
  inputTokens: number;
  outputTokens: number;
  children: readonly string[];
  output?: unknown;
  error?: string;
  correlationId: string;
}
export interface RunStore {
  create(run: AgentRun): void;
  get(id: string): AgentRun | undefined;
  update(id: string, patch: Partial<AgentRun>): AgentRun;
}
export interface AgentEvent {
  type:
    | 'run.started'
    | 'run.waiting_approval'
    | 'run.completed'
    | 'run.failed'
    | 'run.cancelled'
    | 'tool.executed'
    | 'task.delegated';
  runId: string;
  workspaceId: string;
  correlationId: string;
  occurredAt: string;
  metadata: Readonly<Record<string, unknown>>;
}
export interface AgentEventSink {
  publish(event: AgentEvent): Promise<void> | void;
}
export interface MemoryEntry {
  id: string;
  workspaceId: string;
  projectId?: string;
  agentId: string;
  taskId: string;
  kind: 'success' | 'failure' | 'decision' | 'fact';
  content: unknown;
  createdAt: string;
}
export interface PerformanceRecord {
  runId: string;
  agentId: string;
  durationMs: number;
  iterations: number;
  toolCalls: number;
  inputTokens: number;
  outputTokens: number;
  outcome: 'completed' | 'failed' | 'cancelled';
}
export interface PerformanceSink {
  record(record: PerformanceRecord): Promise<void> | void;
}

const now = () => new Date().toISOString();
const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryRunStore implements RunStore {
  private readonly runs = new Map<string, AgentRun>();
  create(run: AgentRun): void {
    if (this.runs.has(run.id)) throw new Error(`RUN_ALREADY_EXISTS:${run.id}`);
    this.runs.set(run.id, clone(run));
  }
  get(id: string): AgentRun | undefined {
    const run = this.runs.get(id);
    return run ? clone(run) : undefined;
  }
  update(id: string, patch: Partial<AgentRun>): AgentRun {
    const current = this.runs.get(id);
    if (!current) throw new Error(`RUN_NOT_FOUND:${id}`);
    const next = { ...current, ...clone(patch) };
    this.runs.set(id, next);
    return clone(next);
  }
}
export class InMemoryAgentEventSink implements AgentEventSink {
  readonly events: AgentEvent[] = [];
  publish(event: AgentEvent): void {
    this.events.push(clone(event));
  }
}
export class InMemoryPerformanceSink implements PerformanceSink {
  readonly records: PerformanceRecord[] = [];
  record(record: PerformanceRecord): void {
    this.records.push(clone(record));
  }
}
export class InMemoryMemoryPolicy implements MemoryPolicy {
  readonly entries: MemoryEntry[] = [];
  recall(context: AgentContext, task: AgentTask, agentId: string): readonly MemoryEntry[] {
    return this.entries.filter(
      (entry) =>
        entry.workspaceId === context.workspaceId &&
        entry.agentId === agentId &&
        (!context.projectId || entry.projectId === context.projectId) &&
        (entry.taskId === task.id || entry.kind === 'fact'),
    );
  }
  remember(entry: MemoryEntry): void {
    this.entries.push(clone(entry));
  }
}
export class StaticModelPolicy implements ModelPolicy {
  constructor(private readonly preferred: string) {}
  select(_task: AgentTask, candidates: readonly string[]): string {
    if (!candidates.includes(this.preferred))
      throw new Error(`MODEL_NOT_AVAILABLE:${this.preferred}`);
    return this.preferred;
  }
}
export class AgentRegistry {
  private readonly agents = new Map<string, AgentDefinition>();
  register(agent: AgentDefinition): void {
    const b = agent.budget;
    if (
      !agent.id ||
      !agent.name ||
      b.maxIterations < 1 ||
      b.maxChildren < 0 ||
      b.maxParallelWorkers < 1 ||
      b.maxDepth < 0 ||
      b.timeoutMs < 1 ||
      b.maxToolCalls < 0 ||
      b.maxInputTokens < 0 ||
      b.maxOutputTokens < 0
    )
      throw new Error('INVALID_AGENT_DEFINITION');
    if (this.agents.has(agent.id)) throw new Error(`AGENT_ALREADY_REGISTERED:${agent.id}`);
    this.agents.set(agent.id, clone(agent));
  }
  get(id: string): AgentDefinition | undefined {
    const agent = this.agents.get(id);
    return agent ? clone(agent) : undefined;
  }
  list(): readonly AgentDefinition[] {
    return [...this.agents.values()].map(clone);
  }
}
export class SkillRegistry {
  private readonly skills = new Map<string, SkillDefinition>();
  register(skill: SkillDefinition): void {
    if (this.skills.has(skill.id)) throw new Error(`SKILL_ALREADY_REGISTERED:${skill.id}`);
    this.skills.set(skill.id, clone(skill));
  }
  get(id: string): SkillDefinition | undefined {
    const skill = this.skills.get(id);
    return skill ? clone(skill) : undefined;
  }
}
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.id)) throw new Error(`TOOL_ALREADY_REGISTERED:${tool.id}`);
    this.tools.set(tool.id, clone(tool));
  }
  get(id: string): ToolDefinition | undefined {
    const tool = this.tools.get(id);
    return tool ? clone(tool) : undefined;
  }
}
export class TeamLead {
  constructor(private readonly agents: AgentRegistry) {}
  selectSpecialists(requirements: readonly string[], limit: number): readonly AgentDefinition[] {
    if (limit < 1) throw new Error('INVALID_SPECIALIST_LIMIT');
    return this.agents
      .list()
      .map((agent) => ({
        agent,
        score: requirements.filter(
          (r) => agent.capabilities.includes(r) || agent.skills.includes(r),
        ).length,
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.agent.id.localeCompare(b.agent.id))
      .slice(0, limit)
      .map((item) => item.agent);
  }
}

export interface AgentRuntimeOptions {
  agents: AgentRegistry;
  skills: SkillRegistry;
  models: ReadonlyMap<string, AgentModel>;
  tools: ToolRegistry;
  toolExecutor: ToolExecutor;
  runStore: RunStore;
  events: AgentEventSink;
  performance: PerformanceSink;
  approvalGate?: ApprovalGate;
  availableModels: readonly string[];
}

export class AgentRuntime {
  constructor(private readonly options: AgentRuntimeOptions) {}

  async run(agentId: string, task: AgentTask, context: AgentContext): Promise<AgentRun> {
    const agent = this.options.agents.get(agentId);
    if (!agent) throw new Error(`AGENT_NOT_FOUND:${agentId}`);
    if (task.depth > agent.budget.maxDepth)
      return this.createFailed(agent, task, context, 'AGENT_DEPTH_LIMIT_EXCEEDED');
    for (const skillId of agent.skills)
      if (!this.options.skills.get(skillId))
        return this.createFailed(agent, task, context, `SKILL_NOT_FOUND:${skillId}`);
    const modelId = agent.modelPolicy.select(task, this.options.availableModels);
    const model = this.options.models.get(modelId);
    if (!model) throw new Error(`MODEL_NOT_FOUND:${modelId}`);
    const run: AgentRun = {
      id: randomUUID(),
      agentId,
      taskId: task.id,
      status: 'pending',
      iterations: 0,
      toolCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      children: [],
      correlationId: context.correlationId,
    };
    this.options.runStore.create(run);
    const started = Date.now();
    this.options.runStore.update(run.id, { status: 'running', startedAt: now() });
    await this.emit('run.started', run.id, context, { agentId, taskId: task.id, modelId });
    const toolResults: ToolResult[] = [];
    try {
      for (let iteration = 1; iteration <= agent.budget.maxIterations; iteration++) {
        const current = this.options.runStore.get(run.id);
        if (!current || current.status === 'cancelled') return current ?? run;
        if (Date.now() - started >= agent.budget.timeoutMs) throw new Error('AGENT_TIMEOUT');
        this.options.runStore.update(run.id, { iterations: iteration });
        const contextValues = agent.contextPolicy
          ? await agent.contextPolicy.select(context, task)
          : context.values;
        const memories = agent.memoryPolicy
          ? await agent.memoryPolicy.recall(context, task, agent.id)
          : [];
        const usage = this.options.runStore.get(run.id)!;
        const action = await model.run({
          agent,
          task,
          context: clone(contextValues),
          memories: clone(memories),
          toolResults: clone(toolResults),
          iteration,
          usage: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
        });
        const inputTokens = action.usage?.inputTokens ?? 0;
        const outputTokens = action.usage?.outputTokens ?? 0;
        if (usage.inputTokens + inputTokens > agent.budget.maxInputTokens)
          throw new Error('AGENT_INPUT_TOKEN_BUDGET_EXCEEDED');
        if (usage.outputTokens + outputTokens > agent.budget.maxOutputTokens)
          throw new Error('AGENT_OUTPUT_TOKEN_BUDGET_EXCEEDED');
        this.options.runStore.update(run.id, {
          inputTokens: usage.inputTokens + inputTokens,
          outputTokens: usage.outputTokens + outputTokens,
        });
        if (action.type === 'final') {
          const completed = this.options.runStore.update(run.id, {
            status: 'completed',
            completedAt: now(),
            output: clone(action.output),
          });
          await this.remember(agent, task, context, 'success', action.output);
          await this.emit('run.completed', run.id, context, { iterations: iteration });
          this.recordPerformance(completed, started, 'completed');
          return completed;
        }
        if (action.type === 'tool') {
          const currentRun = this.options.runStore.get(run.id)!;
          if (currentRun.toolCalls >= agent.budget.maxToolCalls)
            throw new Error('AGENT_TOOL_BUDGET_EXCEEDED');
          const tool = this.options.tools.get(action.call.toolId);
          if (!tool) throw new Error(`TOOL_NOT_FOUND:${action.call.toolId}`);
          for (const capability of tool.capabilities)
            await this.authorize(run.id, task.id, context, agent, capability, action.call.reason);
          const result = await this.options.toolExecutor.execute(clone(action.call), context);
          toolResults.push(result);
          this.options.runStore.update(run.id, { toolCalls: currentRun.toolCalls + 1 });
          await this.emit('tool.executed', run.id, context, { toolId: tool.id, ok: result.ok });
          if (!result.ok)
            await this.remember(agent, task, context, 'failure', result.error ?? 'tool failure');
          continue;
        }
        if (action.type === 'approve') {
          await this.authorize(
            run.id,
            task.id,
            context,
            agent,
            action.capability,
            action.reason,
            action.resource,
          );
          continue;
        }
        const childCount = this.options.runStore.get(run.id)!.children.length;
        if (childCount >= agent.budget.maxChildren) throw new Error('AGENT_CHILD_BUDGET_EXCEEDED');
        if (task.depth >= agent.budget.maxDepth) throw new Error('AGENT_DEPTH_LIMIT_EXCEEDED');
        const specialists = new TeamLead(this.options.agents).selectSpecialists(
          action.requirements,
          agent.budget.maxParallelWorkers,
        );
        if (!specialists.length) throw new Error('NO_SPECIALIST_AVAILABLE');
        const childTask: AgentTask = {
          id: randomUUID(),
          description: action.description,
          requirements: action.requirements,
          parentTaskId: task.id,
          depth: task.depth + 1,
        };
        const selected = specialists.slice(
          0,
          Math.min(agent.budget.maxParallelWorkers, agent.budget.maxChildren - childCount),
        );
        const childRuns = await Promise.all(
          selected.map((specialist) => this.run(specialist.id, childTask, context)),
        );
        this.options.runStore.update(run.id, {
          children: [
            ...this.options.runStore.get(run.id)!.children,
            ...childRuns.map((child) => child.id),
          ],
        });
        await this.emit('task.delegated', run.id, context, {
          taskId: childTask.id,
          specialists: selected.map((a) => a.id),
        });
      }
      throw new Error('AGENT_ITERATION_BUDGET_EXCEEDED');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AGENT_FAILED';
      const failed = this.options.runStore.update(run.id, {
        status: 'failed',
        completedAt: now(),
        error: message,
      });
      await this.remember(agent, task, context, 'failure', message);
      await this.emit('run.failed', run.id, context, { error: message });
      this.recordPerformance(failed, started, 'failed');
      return failed;
    }
  }

  cancel(runId: string): AgentRun {
    const run = this.options.runStore.get(runId);
    if (!run) throw new Error(`RUN_NOT_FOUND:${runId}`);
    if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled')
      return run;
    const cancelled = this.options.runStore.update(runId, {
      status: 'cancelled',
      completedAt: now(),
    });
    void this.options.events.publish({
      type: 'run.cancelled',
      runId,
      workspaceId: '',
      correlationId: run.correlationId,
      occurredAt: now(),
      metadata: {},
    });
    return cancelled;
  }

  private async authorize(
    runId: string,
    taskId: string,
    context: AgentContext,
    agent: AgentDefinition,
    capability: string,
    reason: string,
    resource?: string,
  ): Promise<void> {
    const decision = agent.permissionPolicy.decide({ capability, resource, reason });
    if (decision === 'DENY') throw new Error(`PERMISSION_DENIED:${capability}`);
    if (decision === 'ALLOW') return;
    if (!this.options.approvalGate) throw new Error('APPROVAL_GATE_UNAVAILABLE');
    this.options.runStore.update(runId, { status: 'waiting_approval' });
    await this.emit('run.waiting_approval', runId, context, { capability, resource });
    if (!(await this.options.approvalGate.request({ runId, taskId, capability, resource, reason })))
      throw new Error(`APPROVAL_REJECTED:${capability}`);
    this.options.runStore.update(runId, { status: 'running' });
  }
  private async emit(
    type: AgentEvent['type'],
    runId: string,
    context: AgentContext,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.options.events.publish({
      type,
      runId,
      workspaceId: context.workspaceId,
      correlationId: context.correlationId,
      occurredAt: now(),
      metadata: clone(metadata),
    });
  }
  private async remember(
    agent: AgentDefinition,
    task: AgentTask,
    context: AgentContext,
    kind: MemoryEntry['kind'],
    content: unknown,
  ): Promise<void> {
    if (!agent.memoryPolicy) return;
    await agent.memoryPolicy.remember({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      ...(context.projectId ? { projectId: context.projectId } : {}),
      agentId: agent.id,
      taskId: task.id,
      kind,
      content: clone(content),
      createdAt: now(),
    });
  }
  private recordPerformance(
    run: AgentRun,
    started: number,
    outcome: PerformanceRecord['outcome'],
  ): void {
    this.options.performance.record({
      runId: run.id,
      agentId: run.agentId,
      durationMs: Date.now() - started,
      iterations: run.iterations,
      toolCalls: run.toolCalls,
      inputTokens: run.inputTokens,
      outputTokens: run.outputTokens,
      outcome,
    });
  }
  private createFailed(
    agent: AgentDefinition,
    task: AgentTask,
    context: AgentContext,
    error: string,
  ): AgentRun {
    const run: AgentRun = {
      id: randomUUID(),
      agentId: agent.id,
      taskId: task.id,
      status: 'failed',
      completedAt: now(),
      iterations: 0,
      toolCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      children: [],
      error,
      correlationId: context.correlationId,
    };
    this.options.runStore.create(run);
    return run;
  }
}
