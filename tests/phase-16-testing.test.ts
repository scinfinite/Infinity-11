import { describe, expect, it } from 'vitest';
import { buildTestPlan, runTestPlan, validateTestSuite } from '../packages/testing/src/index.js';
import type { TestCase, TestExecutionResult, TestRunner, TestSuite } from '../packages/testing/src/index.js';

const baseCase: TestCase = { id: 'unit-core', kind: 'unit', command: 'node', args: ['-e', 'console.log("ok")'] };
const suite = (cases: TestCase[] = [baseCase]): TestSuite => ({ id: 'app-tests', projectId: 'demo', revision: 4, cases });
const allow = { evaluate: () => 'allow' as const };

class FakeRunner implements TestRunner {
  constructor(private readonly results: TestExecutionResult[]) {}
  private index = 0;
  async run(): Promise<TestExecutionResult> { return this.results[Math.min(this.index++, this.results.length - 1)]!; }
}
const passed = (): TestExecutionResult => ({ exitCode: 0, stdout: 'ok', stderr: '', durationMs: 2 });

 describe('Phase 16 application testing engine', () => {
  it('rejects unsafe shell syntax and invalid working directories', () => {
    const issues = validateTestSuite(suite([{ ...baseCase, command: 'node;rm', cwd: '../secret' }]));
    expect(issues.map((issue) => issue.code)).toEqual(['UNSAFE_COMMAND', 'UNSAFE_CWD']);
  });

  it('rejects invalid timeout and retry bounds', () => {
    const issues = validateTestSuite(suite([{ ...baseCase, timeoutMs: 99, retries: 4 }]));
    expect(issues.map((issue) => issue.code)).toEqual(['INVALID_TIMEOUT', 'INVALID_RETRIES']);
  });

  it('produces the same checksum when test declaration order changes', async () => {
    const a = await buildTestPlan(suite([baseCase, { ...baseCase, id: 'integration-api', kind: 'integration' }]), allow);
    const b = await buildTestPlan(suite([{ ...baseCase, id: 'integration-api', kind: 'integration' }, baseCase]), allow);
    expect(a.checksum).toBe(b.checksum);
    expect(a.suiteChecksum).toBe(b.suiteChecksum);
  });

  it('denies policy before a runner can execute', async () => {
    await expect(buildTestPlan(suite(), { evaluate: () => 'deny' })).rejects.toThrow('POLICY_DENIED');
  });

  it('requires approval for ASK plans', async () => {
    const plan = await buildTestPlan(suite(), { evaluate: () => 'ask' });
    await expect(runTestPlan(suite(), plan, new FakeRunner([passed()]))).rejects.toThrow('APPROVAL_REQUIRED');
    const result = await runTestPlan(suite(), plan, new FakeRunner([passed()]), () => true);
    expect(result.passed).toBe(true);
  });

  it('binds execution to the unchanged suite definition', async () => {
    const original = suite();
    const plan = await buildTestPlan(original, allow);
    const altered = suite([{ ...baseCase, args: ['-e', 'console.log("tampered")'] }]);
    await expect(runTestPlan(altered, plan, new FakeRunner([passed()]))).rejects.toThrow('PLAN_MISMATCH');
  });

  it('passes stdout and exit-code assertions', async () => {
    const test = { ...baseCase, stdoutIncludes: ['ok'], stderrExcludes: ['fatal'], expectedExitCode: 0 };
    const result = await runTestPlan(suite([test]), await buildTestPlan(suite([test]), allow), new FakeRunner([passed()]));
    expect(result.passed).toBe(true);
    expect(result.summary).toEqual({ total: 1, passed: 1, failed: 0, skipped: 0, timedOut: 0 });
  });

  it('retries failures within the explicit bound', async () => {
    const test = { ...baseCase, retries: 1 };
    const failed: TestExecutionResult = { exitCode: 1, stdout: '', stderr: 'failure', durationMs: 1 };
    const result = await runTestPlan(suite([test]), await buildTestPlan(suite([test]), allow), new FakeRunner([failed, passed()]));
    expect(result.passed).toBe(true);
    expect(result.results[0]?.attempts).toBe(2);
  });

  it('fails on timeout and preserves diagnostics', async () => {
    const timedOut: TestExecutionResult = { exitCode: null, stdout: 'partial', stderr: 'timeout', durationMs: 7, timedOut: true };
    const result = await runTestPlan(suite(), await buildTestPlan(suite(), allow), new FakeRunner([timedOut]));
    expect(result.passed).toBe(false);
    expect(result.results[0]?.status).toBe('timed-out');
    expect(result.results[0]?.stdout).toBe('partial');
    expect(result.results[0]?.failure).toBe('TEST_TIMED_OUT');
  });

  it('fails assertion mismatches without converting them into success', async () => {
    const test = { ...baseCase, stdoutIncludes: ['required'] };
    const result = await runTestPlan(suite([test]), await buildTestPlan(suite([test]), allow), new FakeRunner([passed()]));
    expect(result.passed).toBe(false);
    expect(result.results[0]?.failure).toContain('STDOUT_ASSERTION_FAILED');
  });
});
