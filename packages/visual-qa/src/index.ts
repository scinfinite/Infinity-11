export type QaPolicyDecision = 'allow' | 'ask' | 'deny';
export type VisualStatus = 'passed' | 'failed' | 'skipped';

export interface BrowserTarget {
  url: string;
  viewport: { width: number; height: number; deviceScaleFactor?: number };
  waitForMs?: number;
  expectedTitle?: string;
  expectedUrl?: string;
  requiredText?: string[];
  forbiddenText?: string[];
}

export interface VisualBaseline {
  id: string;
  targetId: string;
  imageHash: string;
}

export interface QaPlan {
  id: string;
  projectId: string;
  revision: number;
  targets: BrowserTarget[];
  checksum: string;
  policy: QaPolicyDecision;
}

export interface BrowserObservation {
  title: string;
  url: string;
  screenshotHash: string;
  consoleErrors: string[];
  failedRequests: string[];
  accessibilityViolations: string[];
}

export interface BrowserAdapter {
  open(target: BrowserTarget): Promise<BrowserObservation>;
}

export interface VisualDiffAdapter {
  compare(actualHash: string, baseline: VisualBaseline): Promise<{ match: boolean; difference: number }>;
}

export interface QaPolicy {
  evaluate(target: BrowserTarget): Promise<QaPolicyDecision> | QaPolicyDecision;
}

export interface QaTargetResult {
  url: string;
  status: VisualStatus;
  visualMatch?: boolean;
  visualDifference?: number;
  consoleErrors: string[];
  failedRequests: string[];
  accessibilityViolations: string[];
  failure?: string;
}

export interface QaRunResult {
  projectId: string;
  revision: number;
  planChecksum: string;
  passed: boolean;
  results: QaTargetResult[];
}

const idPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const httpUrlPattern = /^https?:\/\/[^\s]+$/i;
const maxViewport = 8_000;

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16).padStart(8, '0');
}

function canonicalTargets(targets: BrowserTarget[]): string {
  return JSON.stringify(targets.slice().sort((a, b) => a.url.localeCompare(b.url)));
}

export function validateQaTargets(targets: BrowserTarget[]): string[] {
  const issues: string[] = [];
  if (!targets.length) issues.push('TARGETS_REQUIRED');
  const seen = new Set<string>();
  targets.forEach((target, index) => {
    if (!httpUrlPattern.test(target.url)) issues.push(`INVALID_URL:${index}`);
    if (seen.has(target.url)) issues.push(`DUPLICATE_URL:${index}`);
    seen.add(target.url);
    if (!Number.isInteger(target.viewport.width) || target.viewport.width < 1 || target.viewport.width > maxViewport) {
      issues.push(`INVALID_VIEWPORT_WIDTH:${index}`);
    }
    if (!Number.isInteger(target.viewport.height) || target.viewport.height < 1 || target.viewport.height > maxViewport) {
      issues.push(`INVALID_VIEWPORT_HEIGHT:${index}`);
    }
    if (target.waitForMs !== undefined && (!Number.isInteger(target.waitForMs) || target.waitForMs < 0 || target.waitForMs > 60_000)) {
      issues.push(`INVALID_WAIT:${index}`);
    }
  });
  return issues;
}

export async function buildQaPlan(
  projectId: string,
  revision: number,
  id: string,
  targets: BrowserTarget[],
  policy: QaPolicy,
): Promise<QaPlan> {
  if (!idPattern.test(id) || !idPattern.test(projectId) || !Number.isInteger(revision) || revision < 0) {
    throw new Error('INVALID_PLAN_IDENTITY');
  }
  const issues = validateQaTargets(targets);
  if (issues.length) throw new Error(`INVALID_QA_TARGETS: ${issues.join(', ')}`);
  let decision: QaPolicyDecision = 'allow';
  for (const target of targets.slice().sort((a, b) => a.url.localeCompare(b.url))) {
    const targetDecision = await policy.evaluate(target);
    if (targetDecision === 'deny') throw new Error(`POLICY_DENIED: ${target.url}`);
    if (targetDecision === 'ask') decision = 'ask';
  }
  return {
    id,
    projectId,
    revision,
    targets: targets.slice().sort((a, b) => a.url.localeCompare(b.url)),
    checksum: hash(JSON.stringify({ projectId, revision, id, targets: canonicalTargets(targets) })),
    policy: decision,
  };
}

export async function runQaPlan(
  plan: QaPlan,
  browser: BrowserAdapter,
  baselines: Map<string, VisualBaseline>,
  visualDiff: VisualDiffAdapter,
  approveAsk: () => Promise<boolean> | boolean = () => false,
): Promise<QaRunResult> {
  if (plan.policy === 'ask' && !(await approveAsk())) throw new Error('APPROVAL_REQUIRED');
  const results: QaTargetResult[] = [];
  for (const target of plan.targets) {
    const observation = await browser.open(target);
    const baseline = baselines.get(target.url);
    let visualMatch: boolean | undefined;
    let visualDifference: number | undefined;
    if (baseline) {
      const diff = await visualDiff.compare(observation.screenshotHash, baseline);
      visualMatch = diff.match;
      visualDifference = diff.difference;
    }
    const failures: string[] = [];
    if (target.expectedTitle !== undefined && observation.title !== target.expectedTitle) failures.push('TITLE_MISMATCH');
    if (target.expectedUrl !== undefined && observation.url !== target.expectedUrl) failures.push('URL_MISMATCH');
    if (target.requiredText?.some((text) => !observation.title.includes(text) && !observation.url.includes(text))) failures.push('REQUIRED_TEXT_MISSING');
    if (target.forbiddenText?.some((text) => observation.title.includes(text) || observation.url.includes(text))) failures.push('FORBIDDEN_TEXT_FOUND');
    if (observation.consoleErrors.length) failures.push('CONSOLE_ERRORS');
    if (observation.failedRequests.length) failures.push('FAILED_REQUESTS');
    if (observation.accessibilityViolations.length) failures.push('ACCESSIBILITY_VIOLATIONS');
    if (visualMatch === false) failures.push('VISUAL_DIFF');
    results.push({
      url: target.url,
      status: failures.length ? 'failed' : 'passed',
      visualMatch,
      visualDifference,
      consoleErrors: observation.consoleErrors,
      failedRequests: observation.failedRequests,
      accessibilityViolations: observation.accessibilityViolations,
      ...(failures.length ? { failure: failures.join(',') } : {}),
    });
  }
  return { projectId: plan.projectId, revision: plan.revision, planChecksum: plan.checksum, passed: results.every((result) => result.status === 'passed'), results };
}
