import { describe, expect, it, vi } from 'vitest';
import {
  applyImprovementPlan,
  buildImprovementPlan,
  validateCandidate,
  validateEvidence,
  type ImprovementCandidate,
  type ImprovementEvidence,
} from '../packages/improvement/src/index.js';

const evidence: ImprovementEvidence[] = [
  { id: 'e1', kind: 'test-failure', source: 'ci', summary: 'Login test fails', confidence: 0.98 },
  { id: 'e2', kind: 'visual', source: 'visual-qa', summary: 'Button is clipped', confidence: 0.9 },
];

const candidate = (id: string, priority: ImprovementCandidate['priority'] = 'high'): ImprovementCandidate => ({
  id,
  projectId: 'project-1',
  revision: 4,
  kind: 'bug',
  priority,
  title: `Fix ${id}`,
  rationale: 'Evidence identifies a reproducible defect.',
  evidenceIds: ['e1'],
  affectedPaths: ['src/login.ts'],
  expectedBenefit: 'Restore the failing behavior.',
  risk: 0.1,
  effort: 2,
});

describe('phase 18 improvement engine', () => {
  it('rejects invalid evidence and unsafe candidates', () => {
    expect(validateEvidence([{ ...evidence[0], confidence: Number.NaN }])).toContain('INVALID_EVIDENCE_CONFIDENCE:e1');
    expect(validateCandidate({ ...candidate('bad'), affectedPaths: ['../secret'] })).toContain('UNSAFE_PATH:../secret');
  });

  it('builds a deterministic evidence-bound plan', async () => {
    const policy = { evaluate: vi.fn().mockReturnValue('allow' as const) };
    const first = await buildImprovementPlan('plan-1', 'project-1', 4, evidence, [candidate('b'), candidate('a')], policy);
    const second = await buildImprovementPlan('plan-1', 'project-1', 4, evidence.slice().reverse(), [candidate('a'), candidate('b')], policy);
    expect(first.checksum).toBe(second.checksum);
    expect(first.candidates.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('fails closed on denied policy and requires approval for ask', async () => {
    await expect(buildImprovementPlan('plan-1', 'project-1', 4, evidence, [candidate('a')], { evaluate: () => 'deny' })).rejects.toThrow('POLICY_DENIED:a');
    const askPlan = await buildImprovementPlan('plan-1', 'project-1', 4, evidence, [candidate('a')], { evaluate: () => 'ask' });
    await expect(applyImprovementPlan(askPlan, 4, evidence, () => false, vi.fn())).rejects.toThrow('APPROVAL_REQUIRED');
  });

  it('rejects stale or changed evidence before side effects', async () => {
    const plan = await buildImprovementPlan('plan-1', 'project-1', 4, evidence, [candidate('a')], { evaluate: () => 'allow' });
    const apply = vi.fn();
    await expect(applyImprovementPlan(plan, 5, evidence, undefined, apply)).rejects.toThrow('STALE_PLAN');
    await expect(applyImprovementPlan(plan, 4, [evidence[0]], undefined, apply)).rejects.toThrow('EVIDENCE_CHANGED');
    expect(apply).not.toHaveBeenCalled();
  });

  it('applies every approved candidate and preserves deterministic result evidence', async () => {
    const plan = await buildImprovementPlan('plan-1', 'project-1', 4, evidence, [candidate('a', 'critical')], { evaluate: () => 'ask' });
    const apply = vi.fn();
    const result = await applyImprovementPlan(plan, 4, evidence, () => true, apply);
    expect(result.applied).toBe(true);
    expect(result.selectedCandidateIds).toEqual(['a']);
    expect(result.checksum).toBe(plan.checksum);
    expect(apply).toHaveBeenCalledTimes(1);
  });
});
