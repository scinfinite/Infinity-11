export type TestKind = 'unit' | 'integration' | 'e2e' | 'security' | 'regression';
export type PolicyDecision = 'allow' | 'ask' | 'deny';
export type TestStatus = 'passed' | 'failed' | 'skipped' | 'timed-out';

export interface TestCase {
  id: string;
  kind: TestKind;
  command: string;
  args?: string[];
  cwd?: string;
  timeoutMs?: number;
  retries?: number;
  expectedExitCode?: number;
  stdoutIncludes?: string[];
  stderrExcludes?: string[];
  tags?: string[];
}

export interface TestSuite {
  id: string;
  projectId: string;
  revision: number;
  cases: TestCase[];
}

export interface TestIssue {
  code: string;
  path: string;
  message: string;
}

export interface PlannedTest {
  test: TestCase;
  timeoutMs: number;
  retries: number;
}

export interface TestPlan {
  suiteId: string;
  projectId: string;
  revision: number;
  suiteChecksum: string;
  tests: PlannedTest[];
  checksum: string;
  policy: PolicyDecision;
}

export interface TestExecutionRequest {
  command: string;
  args: string[];
  cwd?: string;
  timeoutMs: number;
}

export interface TestExecutionResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut?: boolean;
}

export interface TestRunner {
  run(request: TestExecutionRequest): Promise<TestExecutionResult>;
}

export interface TestPolicy {
  evaluate(input: {
    projectId: string;
    test: TestCase;
  }): Promise<PolicyDecision> | PolicyDecision;
}

export interface TestCaseResult {
  id: string;
  kind: TestKind;
  status: TestStatus;
  attempts: number;
  durationMs: number;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  failure?: string;
}

export interface TestRunResult {
  suiteId: string;
  projectId: string;
  revision: number;
  planChecksum: string;
  passed: boolean;
  results: TestCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    timedOut: number;
  };
}

const idPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const commandPattern = /^[a-zA-Z0-9_./:-]+$/;
const cwdPattern = /^(?!\/)(?!.*\\)(?!.*(?:^|\/)\.\.\/?)(?!.*(?:^|\/)\.git(?:\/|$))[\x20-\x7e]+$/;
const defaultTimeoutMs = 120_000;
const maxTimeoutMs = 15 * 60_000;
const maxRetries = 3;

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16).padStart(8, '0');
}

function compareCases(a: TestCase, b: TestCase): number {
  return a.id.localeCompare(b.id) || JSON.stringify(a).localeCompare(JSON.stringify(b));
}

function canonicalSuite(suite: TestSuite): string {
  return JSON.stringify({
    id: suite.id,
    projectId: suite.projectId,
    revision: suite.revision,
    cases: suite.cases.slice().sort(compareCases),
  });
}

function canonicalPlan(suite: TestSuite, tests: PlannedTest[]): string {
  return JSON.stringify({ suite: canonicalSuite(suite), tests });
}

function checksum(value: string): string {
  return hash(value);
}

function normalizeTimeout(value: number | undefined): number {
  return value === undefined ? defaultTimeoutMs : value;
}

function normalizeRetries(value: number | undefined): number {
  return value === undefined ? 0 : value;
}

export function validateTestSuite(suite: TestSuite): TestIssue[] {
  const issues: TestIssue[] = [];
  if (!idPattern.test(suite.id)) {
    issues.push({ code: 'INVALID_SUITE_ID', path: 'id', message: 'Suite id is invalid.' });
  }
  if (!idPattern.test(suite.projectId)) {
    issues.push({ code: 'INVALID_PROJECT_ID', path: 'projectId', message: 'Project id is invalid.' });
  }
  if (!Number.isInteger(suite.revision) || suite.revision < 0) {
    issues.push({ code: 'INVALID_REVISION', path: 'revision', message: 'Revision must be a non-negative integer.' });
  }
  if (!suite.cases.length) {
    issues.push({ code: 'TESTS_REQUIRED', path: 'cases', message: 'At least one test case is required.' });
  }

  const ids = new Set<string>();
  suite.cases.forEach((test, index) => {
    const prefix = `cases.${index}`;
    if (!idPattern.test(test.id)) {
      issues.push({ code: 'INVALID_TEST_ID', path: `${prefix}.id`, message: 'Test id is invalid.' });
    }
    if (ids.has(test.id)) {
      issues.push({ code: 'DUPLICATE_TEST_ID', path: `${prefix}.id`, message: 'Test ids must be unique.' });
    }
    ids.add(test.id);
    if (!commandPattern.test(test.command)) {
      issues.push({ code: 'UNSAFE_COMMAND', path: `${prefix}.command`, message: 'Command must be a simple executable token; shell syntax is not accepted.' });
    }
    if (test.cwd !== undefined && !cwdPattern.test(test.cwd)) {
      issues.push({ code: 'UNSAFE_CWD', path: `${prefix}.cwd`, message: 'Working directory must be a safe project-relative path outside .git.' });
    }
    const timeoutMs = normalizeTimeout(test.timeoutMs);
    if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > maxTimeoutMs) {
      issues.push({ code: 'INVALID_TIMEOUT', path: `${prefix}.timeoutMs`, message: `Timeout must be an integer between 100 and ${maxTimeoutMs} ms.` });
    }
    const retries = normalizeRetries(test.retries);
    if (!Number.isInteger(retries) || retries < 0 || retries > maxRetries) {
      issues.push({ code: 'INVALID_RETRIES', path: `${prefix}.retries`, message: `Retries must be an integer between 0 and ${maxRetries}.` });
    }
    if (test.expectedExitCode !== undefined && (!Number.isInteger(test.expectedExitCode) || test.expectedExitCode < 0 || test.expectedExitCode > 255)) {
      issues.push({ code: 'INVALID_EXIT_CODE', path: `${prefix}.expectedExitCode`, message: 'Expected exit code must be an integer from 0 through 255.' });
    }
    if (test.args?.some((argument) => argument.includes('\u0000'))) {
      issues.push({ code: 'INVALID_ARGUMENT', path: `${prefix}.args`, message: 'Arguments must not contain NUL bytes.' });
    }
  });
  return issues;
}

export async function buildTestPlan(
  suite: TestSuite,
  policy: TestPolicy,
): Promise<TestPlan> {
  const issues = validateTestSuite(suite);
  if (issues.length) {
    throw new Error(`Invalid test suite: ${issues.map((issue) => issue.code).join(', ')}`);
  }

  const planned: PlannedTest[] = [];
  let finalDecision: PolicyDecision = 'allow';
  for (const test of suite.cases.slice().sort(compareCases)) {
    const decision = await policy.evaluate({ projectId: suite.projectId, test });
    if (decision === 'deny') throw new Error(`POLICY_DENIED: ${test.id}`);
    if (decision === 'ask') finalDecision = 'ask';
    planned.push({ test, timeoutMs: normalizeTimeout(test.timeoutMs), retries: normalizeRetries(test.retries) });
  }

  const suiteChecksum = checksum(canonicalSuite(suite));
  const tests = planned.slice().sort((a, b) => a.test.id.localeCompare(b.test.id));
  return {
    suiteId: suite.id,
    projectId: suite.projectId,
    revision: suite.revision,
    suiteChecksum,
    tests,
    checksum: checksum(canonicalPlan(suite, tests)),
    policy: finalDecision,
  };
}

function evaluateResult(test: TestCase, execution: TestExecutionResult): string | undefined {
  const expectedExitCode = test.expectedExitCode ?? 0;
  if (execution.timedOut) return 'TEST_TIMED_OUT';
  if (execution.exitCode !== expectedExitCode) return `UNEXPECTED_EXIT_CODE: expected ${expectedExitCode}, found ${execution.exitCode}`;
  for (const expected of test.stdoutIncludes ?? []) {
    if (!execution.stdout.includes(expected)) return `STDOUT_ASSERTION_FAILED: missing ${JSON.stringify(expected)}`;
  }
  for (const forbidden of test.stderrExcludes ?? []) {
    if (execution.stderr.includes(forbidden)) return `STDERR_ASSERTION_FAILED: found ${JSON.stringify(forbidden)}`;
  }
  return undefined;
}

export async function runTestPlan(
  suite: TestSuite,
  plan: TestPlan,
  runner: TestRunner,
  approveAsk: () => Promise<boolean> | boolean = () => false,
): Promise<TestRunResult> {
  if (plan.suiteId !== suite.id || plan.projectId !== suite.projectId || plan.revision !== suite.revision) {
    throw new Error('PLAN_MISMATCH: test plan does not belong to suite.');
  }
  if (plan.suiteChecksum !== checksum(canonicalSuite(suite))) {
    throw new Error('PLAN_MISMATCH: suite definition changed after planning.');
  }
  if (plan.policy === 'ask' && !(await approveAsk())) {
    throw new Error('APPROVAL_REQUIRED: test plan was not approved.');
  }

  const results: TestCaseResult[] = [];
  for (const planned of plan.tests) {
    let final: TestCaseResult | undefined;
    const startedAt = Date.now();
    for (let attempt = 1; attempt <= planned.retries + 1; attempt += 1) {
      const execution = await runner.run({
        command: planned.test.command,
        args: planned.test.args ?? [],
        cwd: planned.test.cwd,
        timeoutMs: planned.timeoutMs,
      });
      const failure = evaluateResult(planned.test, execution);
      const status: TestStatus = execution.timedOut ? 'timed-out' : failure ? 'failed' : 'passed';
      final = {
        id: planned.test.id,
        kind: planned.test.kind,
        status,
        attempts: attempt,
        durationMs: execution.durationMs,
        exitCode: execution.exitCode,
        stdout: execution.stdout,
        stderr: execution.stderr,
        ...(failure ? { failure } : {}),
      };
      if (!failure) break;
    }
    final!.durationMs = Date.now() - startedAt;
    results.push(final!);
  }

  const passed = results.filter((result) => result.status === 'passed').length;
  const failed = results.filter((result) => result.status === 'failed').length;
  const timedOut = results.filter((result) => result.status === 'timed-out').length;
  return {
    suiteId: suite.id,
    projectId: suite.projectId,
    revision: suite.revision,
    planChecksum: plan.checksum,
    passed: failed === 0 && timedOut === 0 && passed === results.length,
    results,
    summary: { total: results.length, passed, failed, skipped: 0, timedOut },
  };
}

export function summarizeTestRun(result: TestRunResult): string {
  return `${result.passed ? 'PASS' : 'FAIL'} ${result.summary.passed}/${result.summary.total} tests passed`;
}
