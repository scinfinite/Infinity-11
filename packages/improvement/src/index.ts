export type ImprovementKind = 'bug' | 'performance' | 'reliability' | 'accessibility' | 'security' | 'ux';
export type ImprovementPriority = 'low' | 'medium' | 'high' | 'critical';
export type PolicyDecision = 'allow' | 'ask' | 'deny';

export interface ImprovementEvidence {
  id: string;
  kind: string;
  source: string;
  summary: string;
  confidence: number;
  fingerprint?: string;
}

export interface ImprovementCandidate {
  id: string;
  projectId: string;
  revision: number;
  kind: ImprovementKind;
  priority: ImprovementPriority;
  title: string;
  rationale: string;
  evidenceIds: string[];
  affectedPaths: string[];
  expectedBenefit: string;
  risk: number;
  effort: number;
}

export interface ImprovementPolicy {
  evaluate(input: {
    projectId: string;
    candidate: ImprovementCandidate;
  }): Promise<PolicyDecision> | PolicyDecision;
}

export interface ImprovementPlan {
  id: string;
  projectId: string;
  baseRevision: number;
  candidates: ImprovementCandidate[];
  evidenceChecksum: string;
  checksum: string;
  policy: PolicyDecision;
}

export interface ImprovementResult {
  planId: string;
  applied: boolean;
  revision: number;
  selectedCandidateIds: string[];
  checksum: string;
}

const idPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const pathPattern = /^(?!\/)(?!.*\\)(?!.*(?:^|\/)\.\.\/?)(?!.*(?:^|\/)[.]?(?:$|\/))[\x20-\x7e]+$/;
const priorities: ImprovementPriority[] = ['low', 'medium', 'high', 'critical'];
const kinds: ImprovementKind[] = ['bug', 'performance', 'reliability', 'accessibility', 'security', 'ux'];

function hash(input: string): string {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, '0');
}

function canonicalEvidence(evidence: ImprovementEvidence[]): string {
  return JSON.stringify(evidence.slice().sort((a, b) => a.id.localeCompare(b.id)));
}

function canonicalCandidate(candidate: ImprovementCandidate): string {
  return JSON.stringify({
    ...candidate,
    evidenceIds: candidate.evidenceIds.slice().sort(),
    affectedPaths: candidate.affectedPaths.slice().sort(),
  });
}

function score(candidate: ImprovementCandidate): number {
  const priority = priorities.indexOf(candidate.priority) + 1;
  const confidence = Math.max(0, Math.min(1, candidate.risk <= 0 ? 1 : 1 - candidate.risk));
  return priority * 100 + confidence * 50 - candidate.effort * 10;
}

function canonicalPlan(planId: string, projectId: string, revision: number, candidates: ImprovementCandidate[], evidenceChecksum: string): string {
  return JSON.stringify({
    planId,
    projectId,
    revision,
    candidates: candidates.map(canonicalCandidate),
    evidenceChecksum,
  });
}

export function validateEvidence(evidence: ImprovementEvidence[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const [index, item] of evidence.entries()) {
    if (!idPattern.test(item.id)) issues.push(`INVALID_EVIDENCE_ID:${index}`);
    if (ids.has(item.id)) issues.push(`DUPLICATE_EVIDENCE_ID:${item.id}`);
    ids.add(item.id);
    if (!item.source.trim() || item.source.length > 512) issues.push(`INVALID_EVIDENCE_SOURCE:${item.id}`);
    if (!item.summary.trim() || item.summary.length > 4096) issues.push(`INVALID_EVIDENCE_SUMMARY:${item.id}`);
    if (!Number.isFinite(item.confidence) || item.confidence < 0 || item.confidence > 1) {
      issues.push(`INVALID_EVIDENCE_CONFIDENCE:${item.id}`);
    }
  }
  return issues;
}

export function validateCandidate(candidate: ImprovementCandidate): string[] {
  const issues: string[] = [];
  if (!idPattern.test(candidate.id)) issues.push('INVALID_CANDIDATE_ID');
  if (!idPattern.test(candidate.projectId)) issues.push('INVALID_PROJECT_ID');
  if (!Number.isInteger(candidate.revision) || candidate.revision < 0) issues.push('INVALID_REVISION');
  if (!kinds.includes(candidate.kind)) issues.push('INVALID_KIND');
  if (!priorities.includes(candidate.priority)) issues.push('INVALID_PRIORITY');
  if (!candidate.title.trim() || candidate.title.length > 512) issues.push('INVALID_TITLE');
  if (!candidate.rationale.trim() || candidate.rationale.length > 4096) issues.push('INVALID_RATIONALE');
  if (!candidate.expectedBenefit.trim() || candidate.expectedBenefit.length > 2048) issues.push('INVALID_BENEFIT');
  if (!candidate.evidenceIds.length) issues.push('EVIDENCE_REQUIRED');
  if (!candidate.affectedPaths.length) issues.push('AFFECTED_PATHS_REQUIRED');
  for (const path of candidate.affectedPaths) {
    if (!pathPattern.test(path) || path === '.git' || path.startsWith('.git/')) issues.push(`UNSAFE_PATH:${path}`);
  }
  if (!Number.isFinite(candidate.risk) || candidate.risk < 0 || candidate.risk > 1) issues.push('INVALID_RISK');
  if (!Number.isFinite(candidate.effort) || candidate.effort < 0 || candidate.effort > 100) issues.push('INVALID_EFFORT');
  return issues;
}

export async function buildImprovementPlan(
  planId: string,
  projectId: string,
  baseRevision: number,
  evidence: ImprovementEvidence[],
  candidates: ImprovementCandidate[],
  policy: ImprovementPolicy,
): Promise<ImprovementPlan> {
  if (!idPattern.test(planId) || !idPattern.test(projectId) || !Number.isInteger(baseRevision) || baseRevision < 0) {
    throw new Error('INVALID_PLAN_IDENTITY');
  }
  const evidenceIssues = validateEvidence(evidence);
  if (evidenceIssues.length) throw new Error(`INVALID_EVIDENCE:${evidenceIssues.join(',')}`);
  const evidenceIds = new Set(evidence.map((item) => item.id));
  const candidateIds = new Set<string>();
  const accepted: ImprovementCandidate[] = [];
  let finalPolicy: PolicyDecision = 'allow';

  for (const candidate of candidates) {
    const issues = validateCandidate(candidate);
    if (candidate.projectId !== projectId || candidate.revision !== baseRevision) issues.push('CANDIDATE_REVISION_MISMATCH');
    if (candidateIds.has(candidate.id)) issues.push('DUPLICATE_CANDIDATE_ID');
    candidateIds.add(candidate.id);
    if (candidate.evidenceIds.some((id) => !evidenceIds.has(id))) issues.push('UNKNOWN_EVIDENCE');
    if (issues.length) throw new Error(`INVALID_CANDIDATE:${candidate.id}:${issues.join(',')}`);
    const decision = await policy.evaluate({ projectId, candidate });
    if (decision === 'deny') throw new Error(`POLICY_DENIED:${candidate.id}`);
    if (decision === 'ask') finalPolicy = 'ask';
    accepted.push(candidate);
  }

  accepted.sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
  const evidenceChecksum = hash(canonicalEvidence(evidence));
  return {
    id: planId,
    projectId,
    baseRevision,
    candidates: accepted,
    evidenceChecksum,
    checksum: hash(canonicalPlan(planId, projectId, baseRevision, accepted, evidenceChecksum)),
    policy: finalPolicy,
  };
}

export async function applyImprovementPlan(
  plan: ImprovementPlan,
  currentRevision: number,
  evidence: ImprovementEvidence[],
  approveAsk: () => Promise<boolean> | boolean = () => false,
  apply: (candidate: ImprovementCandidate) => Promise<void> | void,
): Promise<ImprovementResult> {
  if (currentRevision !== plan.baseRevision) throw new Error('STALE_PLAN');
  const evidenceChecksum = hash(canonicalEvidence(evidence));
  if (evidenceChecksum !== plan.evidenceChecksum) throw new Error('EVIDENCE_CHANGED');
  if (plan.policy === 'ask' && !(await approveAsk())) throw new Error('APPROVAL_REQUIRED');

  const applied: ImprovementCandidate[] = [];
  try {
    for (const candidate of plan.candidates) {
      await apply(candidate);
      applied.push(candidate);
    }
  } catch (error) {
    throw new Error(`IMPROVEMENT_APPLY_FAILED:${applied.length}:${error instanceof Error ? error.message : 'unknown'}`);
  }
  return {
    planId: plan.id,
    applied: true,
    revision: currentRevision,
    selectedCandidateIds: applied.map((candidate) => candidate.id),
    checksum: plan.checksum,
  };
}

export function summarizeImprovements(plan: ImprovementPlan): string {
  return plan.candidates
    .map((candidate) => `${candidate.priority.toUpperCase()} ${candidate.kind.toUpperCase()} ${candidate.id}: ${candidate.title}`)
    .join('\n');
}
