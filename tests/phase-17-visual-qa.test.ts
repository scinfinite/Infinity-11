import { describe, expect, it } from 'vitest';
import { buildQaPlan, runQaPlan, validateQaTargets } from '../packages/visual-qa/src/index.js';
import type { BrowserAdapter, BrowserObservation } from '../packages/visual-qa/src/index.js';

const target = {
  id: 'home',
  url: 'https://example.com',
  viewport: { width: 1280, height: 720 },
  expectedTitle: 'Example',
  requiredText: ['Example Domain'],
};
const observation: BrowserObservation = {
  title: 'Example',
  url: 'https://example.com',
  bodyText: 'Example Domain',
  screenshotHash: 'screen-a',
  consoleErrors: [],
  failedRequests: [],
  accessibilityViolations: [],
};
const browser: BrowserAdapter = { open: async () => observation };
const policy = { evaluate: () => 'allow' as const };
const diff = { compare: async () => ({ match: true, difference: 0 }) };

function baseline(imageHash = 'old') {
  return { id: 'base', targetId: target.id, imageHash };
}

describe('Phase 17 browser and visual QA engine', () => {
  it('rejects unsafe, credential-bearing, or invalid browser targets', () => {
    expect(validateQaTargets([{ ...target, url: 'javascript:alert(1)' }])).toContain('INVALID_URL:0');
    expect(validateQaTargets([{ ...target, url: 'https://user:pass@example.com' }])).toContain('INVALID_URL:0');
    expect(validateQaTargets([{ ...target, viewport: { width: 0, height: 720 } }])).toContain(
      'INVALID_VIEWPORT_WIDTH:0',
    );
    expect(validateQaTargets([{ ...target, viewport: { width: 1280, height: 720, deviceScaleFactor: 5 } }])).toContain(
      'INVALID_DEVICE_SCALE_FACTOR:0',
    );
  });

  it('builds deterministic plans independent of target order', async () => {
    const second = { ...target, id: 'docs', url: 'https://example.org' };
    const a = await buildQaPlan('demo', 2, 'qa-plan', [target, second], policy);
    const b = await buildQaPlan('demo', 2, 'qa-plan', [second, target], policy);
    expect(a.checksum).toBe(b.checksum);
    expect(a.targets.map((item) => item.id)).toEqual(['docs', 'home']);
  });

  it('denies policy before browser execution', async () => {
    await expect(
      buildQaPlan('demo', 1, 'qa-plan', [target], { evaluate: () => 'deny' }),
    ).rejects.toThrow('POLICY_DENIED');
  });

  it('requires explicit approval for ASK plans', async () => {
    const plan = await buildQaPlan('demo', 1, 'qa-plan', [target], { evaluate: () => 'ask' });
    await expect(runQaPlan(plan, browser, new Map(), diff)).rejects.toThrow('APPROVAL_REQUIRED');
    expect((await runQaPlan(plan, browser, new Map(), diff, () => true)).passed).toBe(true);
  });

  it('checks actual page body text and detects forbidden content', async () => {
    const required = await buildQaPlan('demo', 1, 'qa-plan', [target], policy);
    const missing = await runQaPlan(
      required,
      { open: async () => ({ ...observation, bodyText: 'Other page' }) },
      new Map(),
      diff,
    );
    expect(missing.results[0]?.failure).toContain('REQUIRED_TEXT_MISSING');

    const forbiddenTarget = { ...target, forbiddenText: ['Secret'] };
    const forbiddenPlan = await buildQaPlan('demo', 1, 'qa-plan', [forbiddenTarget], policy);
    const forbidden = await runQaPlan(
      forbiddenPlan,
      { open: async () => ({ ...observation, bodyText: 'Secret content' }) },
      new Map(),
      diff,
    );
    expect(forbidden.results[0]?.failure).toContain('FORBIDDEN_TEXT_FOUND');
  });

  it('fails on console, network, accessibility, and visual regressions', async () => {
    const bad: BrowserAdapter = {
      open: async () => ({
        ...observation,
        consoleErrors: ['boom'],
        failedRequests: ['/api'],
        accessibilityViolations: ['button-name'],
      }),
    };
    const plan = await buildQaPlan('demo', 1, 'qa-plan', [target], policy);
    const result = await runQaPlan(
      plan,
      bad,
      new Map([[target.id, baseline()]]),
      { compare: async () => ({ match: false, difference: 0.42 }) },
    );
    expect(result.passed).toBe(false);
    expect(result.results[0]?.failure).toContain('CONSOLE_ERRORS');
    expect(result.results[0]?.failure).toContain('FAILED_REQUESTS');
    expect(result.results[0]?.failure).toContain('ACCESSIBILITY_VIOLATIONS');
    expect(result.results[0]?.failure).toContain('VISUAL_DIFF');
  });

  it('rejects a baseline bound to a different target', async () => {
    const plan = await buildQaPlan('demo', 1, 'qa-plan', [target], policy);
    await expect(
      runQaPlan(plan, browser, new Map([[target.id, { ...baseline(), targetId: 'other' }]]), diff),
    ).rejects.toThrow('BASELINE_TARGET_MISMATCH');
  });

  it('rejects invalid visual-diff evidence', async () => {
    const plan = await buildQaPlan('demo', 1, 'qa-plan', [target], policy);
    await expect(
      runQaPlan(plan, browser, new Map([[target.id, baseline()]]), {
        compare: async () => ({ match: true, difference: Number.NaN }),
      }),
    ).rejects.toThrow('INVALID_VISUAL_DIFF');
  });
});
