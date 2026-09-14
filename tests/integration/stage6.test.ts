import { describe, expect, it } from 'vitest';
import {
  AgentRegistry,
  AgentRuntime,
  InMemoryAgentEventSink,
  InMemoryMemoryPolicy,
  InMemoryPerformanceSink,
  InMemoryRunStore,
  SkillRegistry,
  StaticModelPolicy,
  TeamLead,
  ToolRegistry,
  type AgentAction,
  type AgentDefinition,
  type AgentModel,
  type PermissionPolicy,
} from '../../packages/agents/src/index.js';

const allow: PermissionPolicy = { decide: () => 'ALLOW' };
const budget = {
  maxIterations: 5,
  maxChildren: 2,
  maxParallelWorkers: 2,
  maxDepth: 1,
  timeoutMs: 5_000,
  maxToolCalls: 2,
  maxInputTokens: 10_000,
  maxOutputTokens: 10_000,
};
const agent = (id: string, capabilities: string[]): AgentDefinition => ({
  id,
  name: id,
  description: id,
  capabilities,
  skills: [],
  modelPolicy: new StaticModelPolicy('test-model'),
  permissionPolicy: allow,
  budget,
});
const context = {
  workspaceId: 'w1',
  projectId: 'p1',
  correlationId: 'c1',
  values: { requirement: 'ship' },
};
const skills = new SkillRegistry();

const options = (
  agents: AgentRegistry,
  models: ReadonlyMap<string, AgentModel>,
  tools = new ToolRegistry(),
  approvalGate?: {
    request(input: {
      runId: string;
      taskId: string;
      capability: string;
      resource?: string;
      reason: string;
    }): Promise<boolean>;
  },
) => ({
  agents,
  skills,
  models,
  tools,
  toolExecutor: { execute: async () => ({ toolId: 'x', ok: true }) },
  runStore: new InMemoryRunStore(),
  events: new InMemoryAgentEventSink(),
  performance: new InMemoryPerformanceSink(),
  approvalGate,
  availableModels: ['test-model'],
});

describe('stage 6 agent runtime', () => {
  it('runs a bounded agent, records state, performance, and memory', async () => {
    const agents = new AgentRegistry();
    const memory = new InMemoryMemoryPolicy();
    agents.register({ ...agent('builder', ['coding']), memoryPolicy: memory });
    const model: AgentModel = {
      id: 'test-model',
      run: async (): Promise<AgentAction> => ({
        type: 'final',
        output: { ok: true },
        usage: { inputTokens: 5, outputTokens: 7 },
      }),
    };
    const runtime = new AgentRuntime(options(agents, new Map([['test-model', model]])));
    const run = await runtime.run(
      'builder',
      { id: 't1', description: 'build', requirements: ['coding'], depth: 0 },
      context,
    );
    expect(run.status).toBe('completed');
    expect(run.iterations).toBe(1);
    expect(run.inputTokens).toBe(5);
    expect(run.outputTokens).toBe(7);
    expect(memory.entries[0]?.kind).toBe('success');
  });

  it('enforces tool budgets', async () => {
    const agents = new AgentRegistry();
    agents.register(agent('worker', ['coding']));
    const tools = new ToolRegistry();
    tools.register({ id: 'shell', description: 'run shell', capabilities: ['shell.execute'] });
    let calls = 0;
    const model: AgentModel = {
      id: 'test-model',
      run: async (): Promise<AgentAction> => ({
        type: 'tool',
        call: { toolId: 'shell', input: {}, reason: 'run tests' },
      }),
    };
    const runtime = new AgentRuntime({
      ...options(agents, new Map([['test-model', model]]), tools),
      toolExecutor: {
        execute: async () => {
          calls++;
          return { toolId: 'shell', ok: true };
        },
      },
    });
    const run = await runtime.run(
      'worker',
      { id: 't2', description: 'test', requirements: [], depth: 0 },
      context,
    );
    expect(run.status).toBe('failed');
    expect(run.error).toBe('AGENT_TOOL_BUDGET_EXCEEDED');
    expect(calls).toBe(2);
  });

  it('fails closed when ASK has no approval gate and supports approval when present', async () => {
    const agents = new AgentRegistry();
    agents.register({
      ...agent('deployer', ['deploy']),
      permissionPolicy: { decide: () => 'ASK' },
    });
    const model: AgentModel = {
      id: 'test-model',
      run: async (): Promise<AgentAction> => ({
        type: 'approve',
        capability: 'deploy.execute',
        reason: 'deploy preview',
      }),
    };
    const blocked = await new AgentRuntime(options(agents, new Map([['test-model', model]]))).run(
      'deployer',
      { id: 't3', description: 'deploy', requirements: [], depth: 0 },
      context,
    );
    expect(blocked.error).toBe('APPROVAL_GATE_UNAVAILABLE');
    let approvals = 0;
    const approved = await new AgentRuntime(
      options(agents, new Map([['test-model', model]]), new ToolRegistry(), {
        request: async () => {
          approvals++;
          return true;
        },
      }),
    ).run('deployer', { id: 't4', description: 'deploy', requirements: [], depth: 0 }, context);
    expect(approved.error).toBe('AGENT_ITERATION_BUDGET_EXCEEDED');
    expect(approvals).toBe(5);
  });

  it('enforces token budgets and child depth', async () => {
    const agents = new AgentRegistry();
    const constrained = { ...agent('token', ['coding']), budget: { ...budget, maxInputTokens: 1 } };
    agents.register(constrained);
    const model: AgentModel = {
      id: 'test-model',
      run: async (): Promise<AgentAction> => ({
        type: 'final',
        output: true,
        usage: { inputTokens: 2 },
      }),
    };
    const tokenRun = await new AgentRuntime(options(agents, new Map([['test-model', model]]))).run(
      'token',
      { id: 't5', description: 'token', requirements: [], depth: 0 },
      context,
    );
    expect(tokenRun.error).toBe('AGENT_INPUT_TOKEN_BUDGET_EXCEEDED');
    const depthRun = await new AgentRuntime(options(agents, new Map([['test-model', model]]))).run(
      'token',
      { id: 't6', description: 'depth', requirements: [], depth: 2 },
      context,
    );
    expect(depthRun.error).toBe('AGENT_DEPTH_LIMIT_EXCEEDED');
  });

  it('selects specialists deterministically', () => {
    const agents = new AgentRegistry();
    agents.register(agent('backend', ['backend']));
    agents.register(agent('frontend', ['frontend']));
    agents.register(agent('generalist', ['backend', 'frontend']));
    expect(
      new TeamLead(agents).selectSpecialists(['backend', 'frontend'], 2).map((a) => a.id),
    ).toEqual(['generalist', 'backend']);
  });

  it('isolates duplicate run IDs in the run store', () => {
    const store = new InMemoryRunStore();
    const run = {
      id: 'r1',
      agentId: 'a',
      taskId: 't',
      status: 'pending' as const,
      iterations: 0,
      toolCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      children: [],
      correlationId: 'c',
    };
    store.create(run);
    expect(() => store.create(run)).toThrow('RUN_ALREADY_EXISTS:r1');
  });

  it('provides a skill registry without duplicate IDs', () => {
    skills.register({ id: 'test', description: 'test', capabilities: ['testing'] });
    expect(skills.get('test')?.capabilities).toContain('testing');
    expect(() => skills.register({ id: 'test', description: 'again', capabilities: [] })).toThrow(
      'SKILL_ALREADY_REGISTERED:test',
    );
  });
});
