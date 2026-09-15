import { describe, expect, it, vi } from 'vitest';
import { analyzeCiRun, validateCiRun, type CiAdapter, type CiRunRef } from '../packages/ci-intelligence/src/index.js';

const run: CiRunRef = {
  provider: 'github-actions',
  repository: { owner: 'scinfinite', name: 'Infinity-11' },
  workflow: 'CI',
  runId: '524',
  commitSha: 'abcdef1234567',
  status: 'failure',
};

function adapter(logs: Record<string, string> = {}): CiAdapter {
  return {
    getRun: vi.fn(async (value) => value),
    getJobs: vi.fn(async () =>
      Object.entries(logs).map(([jobId, log]) => ({
        jobId,
        name: jobId,
        status: 'failure' as const,
        conclusion: 'failure' as const,
        log,
      })),
    ),
  };
}

describe('Phase 21 CI intelligence', () => {
  it('validates CI identity and commit binding', () => {
    expect(validateCiRun(run)).toEqual([]);
    expect(validateCiRun({ ...run, commitSha: 'bad' })).toContain('INVALID_COMMIT_SHA');
  });

  it('classifies security, test, and dependency failures deterministically', async () => {
    const result = await analyzeCiRun(run, {
      adapter: adapter({
        security: 'gitleaks secret detected',
        tests: 'vitest assertion failed',
        deps: 'pnpm install lockfile resolution failed',
      }),
    });
    expect(result.passed).toBe(false);
    expect(result.failures.map((failure) => failure.kind)).toEqual([
      'security',
      'test',
      'dependency',
    ]);
    expect(result.failures[0].severity).toBe('critical');
  });

  it('normalizes volatile log data so fingerprints are stable', async () => {
    const first = await analyzeCiRun(run, {
      adapter: adapter({ failure: 'failed at 2026-09-15T12:00:00Z commit abcdef1234567' }),
    });
    const second = await analyzeCiRun(run, {
      adapter: adapter({ failure: 'failed at 2026-09-16T12:00:00Z commit 1234567890abc' }),
    });
    expect(first.failures[0].fingerprint).toBe(second.failures[0].fingerprint);
    expect(first.fingerprint).toBe(second.fingerprint);
  });

  it('rejects stale run identity before analyzing jobs', async () => {
    const stale = adapter();
    vi.mocked(stale.getRun).mockResolvedValue({ ...run, runId: '525' });
    await expect(analyzeCiRun(run, { adapter: stale })).rejects.toThrow('STALE_RUN');
    expect(stale.getJobs).not.toHaveBeenCalled();
  });

  it('treats skipped jobs as non-failures and rejects unsafe log bounds', async () => {
    const clean: CiAdapter = {
      getRun: vi.fn(async (value) => value),
      getJobs: vi.fn(async () => [
        { jobId: 'skip', name: 'optional', status: 'skipped' },
        { jobId: 'ok', name: 'build', status: 'success' },
      ]),
    };
    const result = await analyzeCiRun(run, { adapter: clean });
    expect(result.passed).toBe(true);
    await expect(analyzeCiRun(run, { adapter: clean, maxLogBytes: 10 })).rejects.toThrow(
      'INVALID_MAX_LOG_BYTES',
    );
  });
});
