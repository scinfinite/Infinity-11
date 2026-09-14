export type VerificationState =
  | 'pending'
  | 'running'
  | 'verified'
  | 'partially_verified'
  | 'unverified'
  | 'blocked';
export type CheckKind =
  | 'static'
  | 'security'
  | 'performance'
  | 'accessibility'
  | 'browser'
  | 'visual'
  | 'regression';
export interface VerificationEvidence {
  id: string;
  kind: CheckKind;
  passed: boolean;
  summary: string;
  details: readonly string[];
  startedAt: string;
  finishedAt: string;
}
export interface VerificationIssue {
  kind: CheckKind;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  evidenceId?: string;
}
export interface VerificationRecord {
  id: string;
  target: string;
  revision: string;
  state: VerificationState;
  iteration: number;
  qualityScore: number;
  evidence: readonly VerificationEvidence[];
  issues: readonly VerificationIssue[];
  startedAt: string;
  finishedAt?: string;
}
export interface BrowserPageSnapshot {
  url: string;
  title: string;
  domText: string;
  screenshotFingerprint: string;
  consoleErrors: readonly string[];
  networkFailures: readonly string[];
  accessibilityViolations: readonly string[];
}
export type BrowserStep =
  | { type: 'navigate'; url: string }
  | { type: 'click'; selector: string }
  | { type: 'fill'; selector: string; value: string }
  | { type: 'inspect' };
export interface BrowserSession {
  navigate(url: string): Promise<void>;
  click(selector: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  inspect(): Promise<BrowserPageSnapshot>;
}
export interface BrowserRunResult {
  passed: boolean;
  steps: number;
  snapshot: BrowserPageSnapshot;
  failures: readonly string[];
}
export interface CheckOutcome {
  passed: boolean;
  summary: string;
  details?: readonly string[];
  issues?: readonly Omit<VerificationIssue, 'evidenceId'>[];
}
export interface VerificationCheck {
  kind: CheckKind;
  run(): Promise<CheckOutcome> | CheckOutcome;
}
export interface VerificationOptions {
  id: string;
  target: string;
  revision: string;
  checks: readonly VerificationCheck[];
  maxIterations?: number;
  improve?: (record: VerificationRecord) => Promise<boolean> | boolean;
}
export interface VisualComparison {
  passed: boolean;
  baseline: string;
  actual: string;
  changed: boolean;
  summary: string;
}
const now = () => new Date().toISOString();
let evidenceSequence = 0;
const evidenceId = (kind: CheckKind) => `${kind}-${++evidenceSequence}`;
const score = (items: readonly VerificationEvidence[]) =>
  items.length ? Math.round((items.filter((item) => item.passed).length / items.length) * 100) : 0;
function state(
  items: readonly VerificationEvidence[],
  issues: readonly VerificationIssue[],
  exhausted: boolean,
): VerificationState {
  if (issues.some((issue) => issue.severity === 'critical')) return 'blocked';
  if (items.length > 0 && items.every((item) => item.passed)) return 'verified';
  return exhausted
    ? items.some((item) => item.passed)
      ? 'partially_verified'
      : 'unverified'
    : 'running';
}
export class VerificationOrchestrator {
  async run(options: VerificationOptions): Promise<VerificationRecord> {
    const max = Math.max(1, options.maxIterations ?? 2),
      startedAt = now();
    for (let iteration = 1; iteration <= max; iteration++) {
      const evidence: VerificationEvidence[] = [],
        issues: VerificationIssue[] = [];
      for (const check of options.checks) {
        const started = now();
        let outcome: CheckOutcome;
        try {
          outcome = await check.run();
        } catch (error) {
          outcome = {
            passed: false,
            summary: `Check threw: ${error instanceof Error ? error.message : String(error)}`,
            details: ['Verification adapter raised an exception.'],
            issues: [
              {
                kind: check.kind,
                severity: 'high',
                message: 'Verification check failed unexpectedly.',
              },
            ],
          };
        }
        const item = {
          id: evidenceId(check.kind),
          kind: check.kind,
          passed: outcome.passed,
          summary: outcome.summary,
          details: outcome.details ?? [],
          startedAt: started,
          finishedAt: now(),
        };
        evidence.push(item);
        for (const issue of outcome.issues ?? []) issues.push({ ...issue, evidenceId: item.id });
      }
      const record: VerificationRecord = {
        id: options.id,
        target: options.target,
        revision: options.revision,
        state: state(evidence, issues, iteration >= max),
        iteration,
        qualityScore: score(evidence),
        evidence,
        issues,
        startedAt,
      };
      if (record.state === 'verified' || record.state === 'blocked' || iteration === max)
        return { ...record, finishedAt: now() };
      if (!options.improve || !(await options.improve(record)))
        return { ...record, state: 'unverified', finishedAt: now() };
    }
    throw new Error('VERIFICATION_LOOP_EXHAUSTED');
  }
}
export async function runBrowserFlow(
  session: BrowserSession,
  steps: readonly BrowserStep[],
): Promise<BrowserRunResult> {
  const failures: string[] = [];
  for (const step of steps) {
    try {
      if (step.type === 'navigate') await session.navigate(step.url);
      else if (step.type === 'click') await session.click(step.selector);
      else if (step.type === 'fill') await session.fill(step.selector, step.value);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
  const snapshot = await session.inspect();
  failures.push(
    ...snapshot.consoleErrors.map((x) => `console:${x}`),
    ...snapshot.networkFailures.map((x) => `network:${x}`),
    ...snapshot.accessibilityViolations.map((x) => `a11y:${x}`),
  );
  return { passed: failures.length === 0, steps: steps.length, snapshot, failures };
}
export function compareVisual(baseline: string, actual: string): VisualComparison {
  const changed = baseline !== actual;
  return {
    passed: !changed,
    baseline,
    actual,
    changed,
    summary: changed
      ? 'Visual fingerprint differs from the approved baseline.'
      : 'Visual fingerprint matches the approved baseline.',
  };
}
export function checkStatic(errors: readonly string[]): VerificationCheck {
  return {
    kind: 'static',
    run: () => ({
      passed: errors.length === 0,
      summary: errors.length
        ? `${errors.length} static-analysis issue(s) found.`
        : 'Static analysis passed.',
      details: errors,
      issues: errors.map((message) => ({ kind: 'static', severity: 'high' as const, message })),
    }),
  };
}
export function checkSecurity(
  findings: readonly { severity: 'low' | 'medium' | 'high' | 'critical'; message: string }[],
): VerificationCheck {
  return {
    kind: 'security',
    run: () => ({
      passed: findings.every((x) => x.severity !== 'high' && x.severity !== 'critical'),
      summary: findings.length
        ? `${findings.length} security finding(s) found.`
        : 'Security checks passed.',
      details: findings.map((x) => `${x.severity}: ${x.message}`),
      issues: findings.map((x) => ({ kind: 'security', severity: x.severity, message: x.message })),
    }),
  };
}
export function checkPerformance(actualMs: number, budgetMs: number): VerificationCheck {
  return {
    kind: 'performance',
    run: () => ({
      passed: actualMs <= budgetMs,
      summary:
        actualMs <= budgetMs
          ? `Performance ${actualMs}ms is within ${budgetMs}ms budget.`
          : `Performance ${actualMs}ms exceeds ${budgetMs}ms budget.`,
      details: [`actual=${actualMs}ms`, `budget=${budgetMs}ms`],
      issues:
        actualMs <= budgetMs
          ? []
          : [
              {
                kind: 'performance',
                severity: 'medium' as const,
                message: `Performance budget exceeded by ${actualMs - budgetMs}ms.`,
              },
            ],
    }),
  };
}
export function checkAccessibility(violations: readonly string[]): VerificationCheck {
  return {
    kind: 'accessibility',
    run: () => ({
      passed: violations.length === 0,
      summary: violations.length
        ? `${violations.length} accessibility violation(s) found.`
        : 'Accessibility checks passed.',
      details: violations,
      issues: violations.map((message) => ({
        kind: 'accessibility',
        severity: 'high' as const,
        message,
      })),
    }),
  };
}
export function checkBrowser(result: BrowserRunResult): VerificationCheck {
  return {
    kind: 'browser',
    run: () => ({
      passed: result.passed,
      summary: result.passed
        ? `Browser flow passed (${result.steps} steps).`
        : `Browser flow failed with ${result.failures.length} issue(s).`,
      details: result.failures,
      issues: result.failures.map((message) => ({
        kind: 'browser',
        severity: 'high' as const,
        message,
      })),
    }),
  };
}
export function checkVisual(comparison: VisualComparison): VerificationCheck {
  return {
    kind: 'visual',
    run: () => ({
      passed: comparison.passed,
      summary: comparison.summary,
      details: comparison.changed
        ? [`baseline=${comparison.baseline}`, `actual=${comparison.actual}`]
        : [],
      issues: comparison.changed
        ? [{ kind: 'visual', severity: 'medium' as const, message: comparison.summary }]
        : [],
    }),
  };
}
export function checkRegression(
  previous: VerificationRecord | undefined,
  current: VerificationRecord,
): VerificationCheck {
  return {
    kind: 'regression',
    run: () => {
      if (!previous)
        return {
          passed: true,
          summary: 'No previous verification record; regression comparison is not applicable.',
        };
      const passed =
        current.qualityScore >= previous.qualityScore &&
        !current.issues.some((x) => x.severity === 'critical');
      return {
        passed,
        summary: passed
          ? 'Regression score is stable or improved.'
          : 'Regression detected: quality score decreased or a critical issue appeared.',
        details: [`previous=${previous.qualityScore}`, `current=${current.qualityScore}`],
        issues: passed
          ? []
          : [
              {
                kind: 'regression',
                severity: 'high' as const,
                message: 'Verification quality regressed.',
              },
            ],
      };
    },
  };
}
export class ScriptedBrowser implements BrowserSession {
  private snapshot: BrowserPageSnapshot;
  private readonly selectors = new Set<string>();
  constructor(initial: BrowserPageSnapshot, selectors: readonly string[] = []) {
    this.snapshot = {
      ...initial,
      consoleErrors: [...initial.consoleErrors],
      networkFailures: [...initial.networkFailures],
      accessibilityViolations: [...initial.accessibilityViolations],
    };
    for (const selector of selectors) this.selectors.add(selector);
  }
  async navigate(url: string) {
    this.snapshot = { ...this.snapshot, url };
  }
  async click(selector: string) {
    if (!this.selectors.has(selector)) throw new Error(`SELECTOR_NOT_FOUND:${selector}`);
  }
  async fill(selector: string, value: string) {
    if (!this.selectors.has(selector)) throw new Error(`SELECTOR_NOT_FOUND:${selector}`);
    void value;
  }
  async inspect() {
    return {
      ...this.snapshot,
      consoleErrors: [...this.snapshot.consoleErrors],
      networkFailures: [...this.snapshot.networkFailures],
      accessibilityViolations: [...this.snapshot.accessibilityViolations],
    };
  }
}
