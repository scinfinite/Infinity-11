import { describe, expect, it, vi } from 'vitest';
import {
  applyGitHubPlan,
  buildGitHubPlan,
  validateGitHubRequest,
  type GitHubAdapter,
  type GitHubEngineeringRequest,
  type GitHubPolicy,
} from '../packages/github/src/index.js';

const repository = { owner: 'scinfinite', name: 'demo', defaultBranch: 'main' };
const request: GitHubEngineeringRequest = {
  id: 'sync-1',
  projectId: 'demo-project',
  repository,
  baseBranch: 'main',
  changes: [
    { path: 'src/b.ts', kind: 'create', content: 'b' },
    { path: 'src/a.ts', kind: 'update', content: 'a' },
  ],
  title: 'Apply generated changes',
  description: 'Open a review for generated changes.',
  permission: 'write',
};

function adapter(): GitHubAdapter {
  return {
    getRepository: vi.fn(async (repo) => repo),
    getBranch: vi.fn(async (repo, branch) => ({ repository: repo, name: branch, sha: 'abcdef1234567' })),
    createBranch: vi.fn(async (repo, branch, sha) => ({ repository: repo, name: branch, sha })),
    createCommit: vi.fn(async (repo, branch, changes, message) => ({
      repository: repo,
      sha: `commit-${changes.length}-${message.length}`,
      message,
    })),
    createPullRequest: vi.fn(async (repo, head, base) => ({
      repository: repo,
      number: 7,
      state: 'open',
      head,
      base,
    })),
  };
}

const policy: GitHubPolicy = { evaluate: () => 'allow' };

describe('Phase 20 GitHub engineering integration', () => {
  it('rejects unsafe paths and malformed identifiers', () => {
    const errors = validateGitHubRequest({ ...request, id: 'Bad', changes: [{ path: '../secret', kind: 'delete' }] });
    expect(errors).toContain('INVALID_REQUEST_ID');
    expect(errors).toContain('UNSAFE_PATH');
  });

  it('builds deterministic plans independent of input change order', async () => {
    const first = await buildGitHubPlan(request, { adapter: adapter(), policy });
    const second = await buildGitHubPlan(
      { ...request, changes: request.changes.slice().reverse() },
      { adapter: adapter(), policy },
    );
    expect(first.changedPaths).toEqual(['src/a.ts', 'src/b.ts']);
    expect(first.checksum).toBe(second.checksum);
  });

  it('fails closed when policy denies the repository operation', async () => {
    await expect(buildGitHubPlan(request, { adapter: adapter(), policy: { evaluate: () => 'deny' } })).rejects.toThrow(
      'POLICY_DENIED',
    );
  });

  it('requires explicit approval for ASK operations', async () => {
    const plan = await buildGitHubPlan(request, { adapter: adapter(), policy: { evaluate: () => 'ask' } });
    await expect(applyGitHubPlan(request, plan, { adapter: adapter(), policy }, () => false, {
      branch: 'infinity/change-1',
      commitMessage: 'test change',
    })).rejects.toThrow('APPROVAL_REQUIRED');
  });

  it('rejects stale base branches before mutation', async () => {
    const buildAdapter = adapter();
    const plan = await buildGitHubPlan(request, { adapter: buildAdapter, policy });
    const applyAdapter = adapter();
    vi.mocked(applyAdapter.getBranch).mockResolvedValue({ repository, name: 'main', sha: 'changed-sha' });
    await expect(applyGitHubPlan(request, plan, { adapter: applyAdapter, policy }, undefined, {
      branch: 'infinity/change-2',
      commitMessage: 'test change',
    })).rejects.toThrow('STALE_PLAN');
    expect(applyAdapter.createBranch).not.toHaveBeenCalled();
  });

  it('creates a branch, commit, and pull request after approved planning', async () => {
    const github = adapter();
    const plan = await buildGitHubPlan(request, { adapter: github, policy });
    const result = await applyGitHubPlan(request, plan, { adapter: github, policy }, undefined, {
      branch: 'infinity/change-3',
      commitMessage: 'apply generated changes',
    });
    expect(result.applied).toBe(true);
    expect(result.commitSha).toContain('commit-2');
    expect(result.pullRequest?.number).toBe(7);
    expect(github.createBranch).toHaveBeenCalledWith(repository, 'infinity/change-3', plan.baseSha);
  });

  it('supports commit-only mode without creating a pull request', async () => {
    const github = adapter();
    const plan = await buildGitHubPlan(request, { adapter: github, policy });
    const result = await applyGitHubPlan(request, plan, { adapter: github, policy }, undefined, {
      branch: 'infinity/change-4',
      commitMessage: 'commit only',
      createPullRequest: false,
    });
    expect(result.pullRequest).toBeUndefined();
    expect(github.createPullRequest).not.toHaveBeenCalled();
  });
});
