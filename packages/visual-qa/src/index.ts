export type QaPolicyDecision = 'allow' | 'ask' | 'deny';
export type VisualStatus = 'passed' | 'failed' | 'skipped';

export interface BrowserTarget {
  id: string;
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
  bodyText: string;
  screenshotHash: string;
  consoleErrors: string[];
  failedRequests: string[];
  accessibilityViolations: string[];
}

export interface BrowserAdapter {
  open(target: BrowserTarget): Promise<BrowserObservation>;
}

export interface VisualDiffAdapter {
  compare(
    actualHash: string,
    baseline: VisualBaseline,
  ): Promise<{ match: boolean; difference: number }>;
}

export interface QaPolicy {
  evaluate(target: BrowserTarget): Promise<QaPolicyDecision> | QaPolicyDecision;
}

export interface QaTargetResult {
  targetId: string;
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
const maxViewport = 8_000;
const maxDeviceScaleFactor = 4;
const maxWaitMs = 60_000;

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16).padStart(8, '0');
}

function canonicalTargets(targets: BrowserTarget[]): string {
  return JSON.stringify(targets.slice().sort((a, b) => a.id.localeCompare(b.id)));
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password
    );
  } catch {
    return false;
  }
}

export function validateQaTargets(targets: BrowserTarget[]): string[] {
  const issues: string[] = [];
  if (!targets.length) issues.push('TARGETS_REQUIRED');
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  targets.forEach((target, index) => {
    if (!idPattern.test(target.id)) issues.push(`INVALID_TARGET_ID:${index}`);
    if (seenIds.has(target.id)) issues.push(`DUPLICATE_TARGET_ID:${index}`);
    seenIds.add(target.id);
    if (!isHttpUrl(target.url)) issues.push(`INVALID_URL:${index}`);
    if (seenUrls.has(target.url)) issues.push(`DUPLICATE_URL:${index}`);
    seenUrls.add(target.url);
    if (
      !Number.isInteger(target.viewport.width) ||
      target.viewport.width < 1 ||
      target.viewport.width > maxViewport
    ) {
      issues.push(`INVALID_VIEWPORT_WIDTH:${index}`);
    }
    if (
      !Number.isInteger(target.viewport.height) ||
      target.viewport.height < 1 ||
      target.viewport.height > maxViewport
    ) {
      issues.push(`INVALID_VIEWPORT_HEIGHT:${index}`);
    }
    if (
      target.viewport.deviceScaleFactor !== undefined &&
      (!Number.isFinite(target.viewport.deviceScaleFactor) ||
        target.viewport.deviceScaleFactor <= 0 ||
        target.viewport.deviceScaleFactor > maxDeviceScaleFactor)
    ) {
      issues.push(`INVALID_DEVICE_SCALE_FACTOR:${index}`);
    }
    if (
      target.waitForMs !== undefined &&
      (!Number.isInteger(target.waitForMs) || target.waitForMs < 0 || target.waitForMs > maxWaitMs)
    ) {
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
  if (
    !idPattern.test(id) ||
    !idPattern.test(projectId) ||
    !Number.isInteger(revision) ||
    revision < 0
  ) {
    throw new Error('INVALID_PLAN_IDENTITY');
  }
  const issues = validateQaTargets(targets);
  if (issues.length) throw new Error(`INVALID_QA_TARGETS: ${issues.join(', ')}`);
  const orderedTargets = targets.slice().sort((a, b) => a.id.localeCompare(b.id));
  let decision: QaPolicyDecision = 'allow';
  for (const target of orderedTargets) {
    const targetDecision = await policy.evaluate(target);
    if (targetDecision === 'deny') throw new Error(`POLICY_DENIED: ${target.url}`);
    if (targetDecision === 'ask') decision = 'ask';
  }
  return {
    id,
    projectId,
    revision,
    targets: orderedTargets,
    checksum: hash(
      JSON.stringify({
        projectId,
        revision,
        id,
        targets: canonicalTargets(targets),
      }),
    ),
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
    const baseline = baselines.get(target.id);
    let visualMatch: boolean | undefined;
    let visualDifference: number | undefined;
    if (baseline) {
      if (baseline.targetId !== target.id) {
        throw new Error(`BASELINE_TARGET_MISMATCH:${target.id}`);
      }
      const diff = await visualDiff.compare(observation.screenshotHash, baseline);
      if (!Number.isFinite(diff.difference) || diff.difference < 0) {
        throw new Error(`INVALID_VISUAL_DIFF:${target.id}`);
      }
      visualMatch = diff.match;
      visualDifference = diff.difference;
    }
    const failures: string[] = [];
    if (target.expectedTitle !== undefined && observation.title !== target.expectedTitle) {
      failures.push('TITLE_MISMATCH');
    }
    if (target.expectedUrl !== undefined && observation.url !== target.expectedUrl) {
      failures.push('URL_MISMATCH');
    }
    if (target.requiredText?.some((text) => !observation.bodyText.includes(text))) {
      failures.push('REQUIRED_TEXT_MISSING');
    }
    if (target.forbiddenText?.some((text) => observation.bodyText.includes(text))) {
      failures.push('FORBIDDEN_TEXT_FOUND');
    }
    if (observation.consoleErrors.length) failures.push('CONSOLE_ERRORS');
    if (observation.failedRequests.length) failures.push('FAILED_REQUESTS');
    if (observation.accessibilityViolations.length) failures.push('ACCESSIBILITY_VIOLATIONS');
    if (visualMatch === false) failures.push('VISUAL_DIFF');
    results.push({
      targetId: target.id,
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
  return {
    projectId: plan.projectId,
    revision: plan.revision,
    planChecksum: plan.checksum,
    passed: results.every((result) => result.status === 'passed'),
    results,
  };
}
