import { describe, expect, it } from 'vitest';
import {
  VerificationOrchestrator,
  ScriptedBrowser,
  checkAccessibility,
  checkBrowser,
  checkPerformance,
  checkRegression,
  checkSecurity,
  checkStatic,
  checkVisual,
  compareVisual,
  runBrowserFlow,
} from '../packages/verification/src/index.js';
import type {
  BrowserPageSnapshot,
  VerificationRecord,
} from '../packages/verification/src/index.js';

const healthyPage: BrowserPageSnapshot = {
  url: 'https://example.test/',
  title: 'Infinity',
  domText: 'Command Center',
  screenshotFingerprint: 'baseline-1',
  consoleErrors: [],
  networkFailures: [],
  accessibilityViolations: [],
};

describe('Stage 9 verification primitives', () => {
  it('runs browser flows and captures console, network and accessibility failures', async () => {
    const browser = new ScriptedBrowser(healthyPage, ['#run']);
    const result = await runBrowserFlow(browser, [
      { type: 'navigate', url: 'https://example.test/dashboard' },
      { type: 'click', selector: '#run' },
      { type: 'fill', selector: '#run', value: 'verify' },
      { type: 'inspect' },
    ]);
    expect(result.passed).toBe(true);
    expect(result.snapshot.url).toBe('https://example.test/dashboard');
    expect(result.steps).toBe(4);
    const failing = new ScriptedBrowser({
      ...healthyPage,
      consoleErrors: ['TypeError: broken'],
      networkFailures: ['/api/run 500'],
      accessibilityViolations: ['button-name'],
    });
    const failed = await runBrowserFlow(failing, [{ type: 'inspect' }]);
    expect(failed.passed).toBe(false);
    expect(failed.failures).toEqual(
      expect.arrayContaining([
        'console:TypeError: broken',
        'network:/api/run 500',
        'a11y:button-name',
      ]),
    );
  });

  it('compares visuals and exposes core quality checks', async () => {
    expect(compareVisual('same', 'same')).toMatchObject({ passed: true, changed: false });
    expect(compareVisual('before', 'after')).toMatchObject({ passed: false, changed: true });
    expect((await checkStatic([]).run()).passed).toBe(true);
    expect((await checkSecurity([{ severity: 'low', message: 'info' }]).run()).passed).toBe(true);
    expect((await checkSecurity([{ severity: 'high', message: 'unsafe' }]).run()).passed).toBe(
      false,
    );
    expect((await checkPerformance(90, 100).run()).passed).toBe(true);
    expect((await checkPerformance(110, 100).run()).passed).toBe(false);
    expect((await checkAccessibility([]).run()).passed).toBe(true);
    expect((await checkAccessibility(['missing-label']).run()).passed).toBe(false);
    const browser = await runBrowserFlow(new ScriptedBrowser(healthyPage, ['#run']), [
      { type: 'click', selector: '#run' },
    ]);
    expect((await checkBrowser(browser).run()).passed).toBe(true);
    expect(
      (await checkVisual(compareVisual('baseline-1', browser.snapshot.screenshotFingerprint)).run())
        .passed,
    ).toBe(true);
  });
});

describe('Stage 9 bounded quality loop', () => {
  it('routes a defect through improvement and records verified evidence', async () => {
    let repaired = false;
    const result = await new VerificationOrchestrator().run({
      id: 'verification-1',
      target: 'demo-app',
      revision: 'rev-1',
      maxIterations: 2,
      checks: [
        { kind: 'static', run: () => checkStatic(repaired ? [] : ['unused variable']).run() },
      ],
      improve: (record: VerificationRecord) => {
        expect(record.state).toBe('running');
        repaired = true;
        return true;
      },
    });
    expect(result.state).toBe('verified');
    expect(result.iteration).toBe(2);
    expect(result.qualityScore).toBe(100);
    expect(result.evidence[0]?.passed).toBe(true);
  });

  it('blocks on critical security evidence', async () => {
    const result = await new VerificationOrchestrator().run({
      id: 'critical',
      target: 'demo',
      revision: 'r1',
      checks: [checkSecurity([{ severity: 'critical', message: 'secret exposure' }])],
    });
    expect(result.state).toBe('blocked');
    expect(result.qualityScore).toBe(0);
    expect(result.issues[0]?.severity).toBe('critical');
  });

  it('detects quality regression', async () => {
    const previous: VerificationRecord = {
      id: 'previous',
      target: 'demo',
      revision: 'old',
      state: 'verified',
      iteration: 1,
      qualityScore: 100,
      evidence: [],
      issues: [],
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    };
    const current = { ...previous, revision: 'new', qualityScore: 50 };
    expect((await checkRegression(previous, current).run()).passed).toBe(false);
  });
});
