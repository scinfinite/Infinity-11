export type GitHubResourceKind = 'repository' | 'branch' | 'commit' | 'pull-request' | 'issue';
export type GitHubPermission = 'read' | 'write';
export type PolicyDecision = 'allow' | 'ask' | 'deny';
export type PullRequestState = 'open' | 'closed' | 'merged';

export interface GitHubRepositoryRef {
  owner: string;
  name: string;
  defaultBranch: string;
}

export interface GitHubBranchRef {
  repository: GitHubRepositoryRef;
  name: string;
  sha: string;
}

export interface GitHubCommitRef {
  repository: GitHubRepositoryRef;
  sha: string;
  message: string;
}

export interface GitHubPullRequestRef {
  repository: GitHubRepositoryRef;
  number: number;
  state: PullRequestState;
  head: string;
  base: string;
  headSha?: string;
}

export interface GitHubIssueRef {
  repository: GitHubRepositoryRef;
  number: number;
  state: 'open' | 'closed';
}

export interface GitHubChange {
  path: string;
  kind: 'create' | 'update' | 'delete';
  content?: string;
  expectedSha?: string;
}

export interface GitHubEngineeringRequest {
  id: string;
  projectId: string;
  repository: GitHubRepositoryRef;
  baseBranch: string;
  changes: GitHubChange[];
  title: string;
  description: string;
  permission: GitHubPermission;
  actor?: string;
}

export interface GitHubPlan {
  requestId: string;
  projectId: string;
  repository: GitHubRepositoryRef;
  baseBranch: string;
  baseSha: string;
  changes: GitHubChange[];
  changedPaths: string[];
  requestChecksum: string;
  checksum: string;
  policy: PolicyDecision;
}

export interface GitHubApplyResult {
  requestId: string;
  applied: boolean;
  commitSha?: string;
  pullRequest?: GitHubPullRequestRef;
  checksum: string;
}

export interface GitHubAdapter {
  getRepository(repository: GitHubRepositoryRef): Promise<GitHubRepositoryRef>;
  getBranch(repository: GitHubRepositoryRef, branch: string): Promise<GitHubBranchRef>;
  createBranch(repository: GitHubRepositoryRef, branch: string, fromSha: string): Promise<GitHubBranchRef>;
  createCommit(
    repository: GitHubRepositoryRef,
    branch: string,
    changes: readonly GitHubChange[],
    message: string,
  ): Promise<GitHubCommitRef>;
  createPullRequest(
    repository: GitHubRepositoryRef,
    head: string,
    base: string,
    title: string,
    description: string,
  ): Promise<GitHubPullRequestRef>;
}

export interface GitHubPolicy {
  evaluate(input: {
    projectId: string;
    actor?: string;
    permission: GitHubPermission;
    resource: GitHubResourceKind;
  }): Promise<PolicyDecision> | PolicyDecision;
}

export interface GitHubPlanInput {
  adapter: GitHubAdapter;
  policy: GitHubPolicy;
}

const idPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const refPattern = /^[A-Za-z0-9._/-]+$/;
const shaPattern = /^[0-9a-f]{7,64}$/i;

function safeRef(value: string): boolean {
  return value.length > 0 && value.length <= 255 && refPattern.test(value) && !value.includes('..');
}

function safePath(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 512 &&
    !value.startsWith('/') &&
    !value.includes('\\') &&
    !value.split('/').some((segment) => segment === '..' || segment === '') &&
    value !== '.git' &&
    !value.startsWith('.git/')
  );
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function compareChanges(a: GitHubChange, b: GitHubChange): number {
  const path = a.path.localeCompare(b.path);
  if (path !== 0) return path;
  return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

function canonicalRequest(request: GitHubEngineeringRequest): string {
  return JSON.stringify({
    id: request.id,
    projectId: request.projectId,
    repository: request.repository,
    baseBranch: request.baseBranch,
    changes: request.changes.slice().sort(compareChanges),
    title: request.title,
    description: request.description,
    permission: request.permission,
    actor: request.actor,
  });
}

function canonicalPlan(request: GitHubEngineeringRequest, changes: GitHubChange[], baseSha: string): string {
  return JSON.stringify({ request: canonicalRequest(request), changes, baseSha });
}

export function validateGitHubRequest(request: GitHubEngineeringRequest): string[] {
  const errors: string[] = [];
  if (!idPattern.test(request.id)) errors.push('INVALID_REQUEST_ID');
  if (!idPattern.test(request.projectId)) errors.push('INVALID_PROJECT_ID');
  if (!request.repository.owner || !idPattern.test(request.repository.owner)) errors.push('INVALID_OWNER');
  if (!request.repository.name || !idPattern.test(request.repository.name)) errors.push('INVALID_REPOSITORY');
  if (!safeRef(request.baseBranch)) errors.push('INVALID_BASE_BRANCH');
  if (!request.title.trim() || request.title.length > 256) errors.push('INVALID_TITLE');
  if (!request.description.trim() || request.description.length > 10000) errors.push('INVALID_DESCRIPTION');
  if (!request.changes.length) errors.push('CHANGES_REQUIRED');

  const paths = new Set<string>();
  for (const change of request.changes) {
    if (!safePath(change.path)) errors.push('UNSAFE_PATH');
    if (paths.has(change.path)) errors.push('DUPLICATE_PATH');
    paths.add(change.path);
    if ((change.kind === 'create' || change.kind === 'update') && change.content === undefined) {
      errors.push('CONTENT_REQUIRED');
    }
    if (change.kind === 'delete' && change.content !== undefined) errors.push('UNEXPECTED_CONTENT');
    if (change.expectedSha !== undefined && !shaPattern.test(change.expectedSha)) errors.push('INVALID_EXPECTED_SHA');
  }
  return errors;
}

export async function buildGitHubPlan(
  request: GitHubEngineeringRequest,
  input: GitHubPlanInput,
): Promise<GitHubPlan> {
  const errors = validateGitHubRequest(request);
  if (errors.length) throw new Error(`INVALID_GITHUB_REQUEST: ${errors.join(', ')}`);

  const repository = await input.adapter.getRepository(request.repository);
  const branch = await input.adapter.getBranch(repository, request.baseBranch);
  const decision = await input.policy.evaluate({
    projectId: request.projectId,
    actor: request.actor,
    permission: request.permission,
    resource: 'repository',
  });
  if (decision === 'deny') throw new Error('POLICY_DENIED: repository operation');

  const changes = request.changes.slice().sort(compareChanges);
  const changedPaths = changes.map((change) => change.path).sort();
  const requestChecksum = stableHash(canonicalRequest(request));
  return {
    requestId: request.id,
    projectId: request.projectId,
    repository,
    baseBranch: request.baseBranch,
    baseSha: branch.sha,
    changes,
    changedPaths,
    requestChecksum,
    checksum: stableHash(canonicalPlan(request, changes, branch.sha)),
    policy: decision,
  };
}

export async function applyGitHubPlan(
  request: GitHubEngineeringRequest,
  plan: GitHubPlan,
  input: GitHubPlanInput,
  approveAsk: () => Promise<boolean> | boolean = () => false,
  options: { branch: string; commitMessage: string; createPullRequest?: boolean } = {
    branch: '',
    commitMessage: '',
  },
): Promise<GitHubApplyResult> {
  if (
    plan.requestId !== request.id ||
    plan.projectId !== request.projectId ||
    plan.baseBranch !== request.baseBranch ||
    plan.requestChecksum !== stableHash(canonicalRequest(request))
  ) {
    throw new Error('PLAN_MISMATCH: GitHub plan does not match request.');
  }
  if (plan.policy === 'ask' && !(await approveAsk())) throw new Error('APPROVAL_REQUIRED: GitHub operation was not approved.');
  if (!safeRef(options.branch) || options.branch === request.baseBranch) throw new Error('INVALID_TARGET_BRANCH');
  if (!options.commitMessage.trim()) throw new Error('COMMIT_MESSAGE_REQUIRED');

  const current = await input.adapter.getBranch(plan.repository, plan.baseBranch);
  if (current.sha !== plan.baseSha) throw new Error('STALE_PLAN: base branch changed after planning.');

  const branch = await input.adapter.createBranch(plan.repository, options.branch, plan.baseSha);
  const commit = await input.adapter.createCommit(
    plan.repository,
    branch.name,
    plan.changes,
    options.commitMessage.trim(),
  );
  let pullRequest: GitHubPullRequestRef | undefined;
  if (options.createPullRequest !== false) {
    pullRequest = await input.adapter.createPullRequest(
      plan.repository,
      branch.name,
      plan.baseBranch,
      request.title,
      request.description,
    );
  }
  return {
    requestId: request.id,
    applied: true,
    commitSha: commit.sha,
    pullRequest,
    checksum: plan.checksum,
  };
}
