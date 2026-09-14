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
  ToolRegistry,
  type AgentAction,
  type AgentDefinition,
  type AgentModel,
  type PermissionPolicy,
  type ToolExecutor,
} from '../../packages/agents/src/index.js';

const allow: PermissionPolicy = { decide: () => 'ALLOW' };
const budget = { maxIterations: 5, maxChildren: 2, maxParallelWorkers: 2, timeoutMs: 5_000, maxToolCalls: 2, maxInputTokens: 10_000, maxOutputTokens: 10_000 };
const agent = (id: string, capabilities: string[]): AgentDefinition => ({ id, name: id, description: id, capabilities, skills: [], modelPolicy: new StaticModelPolicy('test-model'), permissionPolicy: allow, budget });
const context = { workspaceId: 'w1', projectId: 'p1', correlationId: 'c1', values: { requirement: 'ship' } };

function runtime(models: ReadonlyMap<string, AgentModel>, agents: AgentRegistry, tools = new ToolRegistry(), executor: ToolExecutor = { execute: async () => ({ toolId: 'unknown', ok: true }) }) {
  return { runtime: new AgentRuntime({ agents, models, tools, toolExecutor: executor, runStore: new InMemoryRunStore(), events: new InMemoryAgentEventSink(), performance: new InMemoryPerformanceSink(), availableModels: ['test-model'] }), events: undefined };
}

describe('stage 6 agent runtime', () => {
  it('runs a bounded agent, records state, performance, and memory', async () => {
    const agents = new AgentRegistry();
    const memory = new InMemoryMemoryPolicy();
    agents.register({ ...agent('builder', ['coding']), memoryPolicy: memory });
    const model: AgentModel = { id: 'test-model', run: async (): Promise<AgentAction> => ({ type: 'final', output: { ok: true } }) };
    const stores = new InMemoryRunStore();
    const performance = new InMemoryPerformanceSink();
    const events = new InMemoryAgentEventSink();
    const result = new AgentRuntime({ agents, models: new Map([['test-model', model]]), tools: new ToolRegistry(), toolExecutor: { execute: async () => ({ toolId: 'x', ok: true }) }, runStore: stores, events, performance, availableModels: ['test-model'] });
    const run = await result.run('builder', { id: 't1', description: 'build', requirements: ['coding'], depth: 0 }, context);
    expect(run.status).toBe('completed');
    expect(run.iterations).toBe(1);
    expect(memory.entries[0]?.kind).toBe('success');
    expect(performance.records[0]?.outcome).toBe('completed');
    expect(events.events.map((event) => event.type)).toEqual(['run.started', 'run.completed']);
  });

  it('enforces tool capability permissions and tool budgets', async () => {
    const agents = new AgentRegistry();
    agents.register(agent('worker', ['coding']));
    const tools = new ToolRegistry();
    tools.register({ id: 'shell', description: 'run shell', capabilities: ['shell.execute'] });
    let calls = 0;
    const model: AgentModel = { id: 'test-model', run: async (): Promise<AgentAction> => ({ type: 'tool', call: { toolId: 'shell', input: {}, reason: 'run tests' } }) };
    const result = new AgentRuntime({ agents, models: new Map([['test-model', model]]), tools, toolExecutor: { execute: async () => { calls++; return { toolId: 'shell', ok: true }; } }, runStore: new InMemoryRunStore(), events: new InMemoryAgentEventSink(), performance: new InMemoryPerformanceSink(), availableModels: ['test-model'] });
    const run = await result.run('worker', { id: 't2', description: 'test', requirements: [], depth: 0 }, context);
    expect(run.status).toBe('failed');
    expect(run.error).toBe('AGENT_TOOL_BUDGET_EXCEEDED');
    expect(calls).toBe(2);
  });

  it('never silently upgrades ASK and uses an approval gate', async () => {
    const agents = new AgentRegistry();
    agents.register({ ...agent('deployer', ['deploy']), permissionPolicy: { decide: () => 'ASK' } });
    const model: AgentModel = { id: 'test-model', run: async (): Promise<AgentAction> => ({ type: 'approve', capability: 'deploy.execute', reason: 'deploy preview' }) };
    let approvals = 0;
    const result = new AgentRuntime({ agents, models: new Map([['test-model', model]]), tools: new ToolRegistry(), toolExecutor: { execute: async () => ({ toolId: 'x', ok: true }) }, runStore: new InMemoryRunStore(), events: new InMemoryAgentEventSink(), performance: new InMemoryPerformanceSink(), approvalGate: { request: async () => { approvals++; return true; } }, availableModels: ['test-model'] });
    const run = await result.run('deployer', { id: 't3', description: 'deploy', requirements: [], depth: 0 }, context);
    expect(run.status).toBe('failed');
    expect(run.error).toBe('AGENT_ITERATION_BUDGET_EXCEEDED');
    expect(approvals).toBe(5);
  });

  it('selects specialists deterministically and bounds parallel workers', async () => {
    const agents = new AgentRegistry();
    agents.register(agent('backend', ['backend']));
    agents.register(agent('frontend', ['frontend']));
    agents.register(agent('generalist', ['backend', 'frontend']));
    const selected = new (await import('../../packages/agents/src/index.js')).TeamLead(agents).selectSpecialists(['backend'], 2);
    expect(selected.map((a) => a.id)).toEqual(['generalist', 'backend']);
  });

  it('isolates duplicate run IDs in the run store', () => {
    const store = new InMemoryRunStore();
    const run = { id: 'r1', agentId: 'a', taskId: 't', status: 'pending' as const, iterations: 0, toolCalls: 0, children: [], correlationId: 'c' };
    store.create(run);
    expect(() => store.create(run)).toThrow('RUN_ALREADY_EXISTS:r1');
  });

  it('provides a skill registry without duplicate IDs', () => {
    const skills = new SkillRegistry();
    skills.register({ id: 'test', description: 'test', capabilities: ['testing'] });
    expect(skills.get('test')?.capabilities).toContain('testing');
    expect(() => skills.register({ id: 'test', description: 'again', capabilities: [] })).toThrow('SKILL_ALREADY_REGISTERED:test');
  });
});
