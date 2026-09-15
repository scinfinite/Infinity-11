import { describe, expect, it } from 'vitest';
import { buildQaPlan, runQaPlan, validateQaTargets } from '../packages/visual-qa/src/index.js';
import type { BrowserAdapter, BrowserObservation } from '../packages/visual-qa/src/index.js';

const target = { url: 'https://example.com', viewport: { width: 1280, height: 720 }, expectedTitle: 'Example' };
const observation: BrowserObservation = {
  title: 'Example',
  url: 'https://example.com',
  screenshotHash: 'screen-a',
  consoleErrors: [],
  failedRequests: [],
  accessibilityViolations: [],
};
const browser: BrowserAdapter = { open: async () => observation };
const policy = { evaluate: () => 'allow' as const };
const diff = { compare: async () => ({ match: true, difference: 0 }) };

describe('Phase 17 browser and visual QA engine', () => {
  it('rejects unsafe or invalid browser targets', () => {
    expect(validateQaTargets([{ ...target, url: 'javascript:alert(1)' }])).toContain('INVALID_URL:0');
    expect(validateQaTargets([{ ...target, viewport: { width: 0, height: 720 } }])).toContain('INVALID_VIEWPORT_WIDTH:0');
  });

  it('builds deterministic plans independent of target order', async () => {
    const second = { ...target, url: 'https://example.org' };
    const a = await buildQaPlan('demo', 2, 'qa-plan', [target, second], policy);
    const b = await buildQaPlan('demo', 2, 'qa-plan', [second, target], policy);
    expect(a.checksum).toBe(b.checksum);
    expect(a.targets.map((item) => item.url)).toEqual(['https://example.com', 'https://example.org']);
  });

  it('denies policy before browser execution', async () => {
    await expect(buildQaPlan('demo', 1, 'qa-plan', [target], { evaluate: () => 'deny' })).rejects.toThrow('POLICY_DENIED');
  });

  it('requires explicit approval for ASK plans', async () => {
    const plan = await buildQaPlan('demo', 1, 'qa-plan', [target], { evaluate: () => 'ask' });
    await expect(runQaPlan(plan, browser, new Map(), diff)).rejects.toThrow('APPROVAL_REQUIRED');
    expect((await runQaPlan(plan, browser, new Map(), diff, () => true)).passed).toBe(true);
  });

  it('fails on console, network, accessibility, and visual regressions', async () => {
    const bad: BrowserAdapter = {
      open: async () => ({ ...observation, consoleErrors: ['boom'], failedRequests: ['/api'], accessibilityViolations: ['button-name'] }),
    };
    const plan = await buildQaPlan('demo', 1, 'qa-plan', [target], policy);
    const result = await runQaPlan(plan, bad, new Map([['https://example.com', { id: 'base', targetId: target.url, imageHash: 'old' }]]), { compare: async () => ({ match: false, difference: 0.42 }) });
    expect(result.passed).toBe(false);
    expect(result.results[0]?.failure).toContain('CONSOLE_ERRORS');
    expect(result.results[0]?.failure).toContain('VISUAL_DIFF');
  });
});
