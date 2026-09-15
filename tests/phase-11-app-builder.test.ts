import { describe, expect, it } from 'vitest';
import {
  createProjectPlan,
  normalizeApplicationSpec,
  validateApplicationSpec,
  type ApplicationSpec,
} from '../packages/app-builder/src/index.js';

const validSpec: ApplicationSpec = {
  id: 'task-board',
  name: 'Task Board',
  description: 'A full-stack task management application.',
  targets: ['full-stack'],
  language: 'typescript',
  framework: 'nextjs',
  requirements: [
    {
      id: 'tasks',
      description: 'Users can create and complete tasks.',
      acceptanceCriteria: ['A task can be created.', 'A task can be marked complete.'],
      priority: 'must',
    },
  ],
  constraints: ['accessible', 'responsive'],
  revision: 1,
};

describe('Phase 11 application builder foundation', () => {
  it('accepts a valid application specification', () => {
    expect(validateApplicationSpec(validSpec)).toEqual([]);
  });

  it('rejects framework and language mismatches', () => {
    const invalid = { ...validSpec, language: 'java' as const };
    expect(validateApplicationSpec(invalid).map((issue) => issue.code)).toContain('FRAMEWORK_LANGUAGE_MISMATCH');
  });

  it('rejects duplicate requirement identifiers', () => {
    const invalid = {
      ...validSpec,
      requirements: [validSpec.requirements[0], { ...validSpec.requirements[0] }],
    };
    expect(validateApplicationSpec(invalid).map((issue) => issue.code)).toContain('DUPLICATE_REQUIREMENT_ID');
  });

  it('normalizes identifiers, lists, and text without changing semantics', () => {
    const normalized = normalizeApplicationSpec({
      ...validSpec,
      id: ' Task-Board ',
      name: ' Task Board ',
      targets: ['web', 'web'],
      constraints: [' accessible ', 'accessible', ''],
    });
    expect(normalized.id).toBe('task-board');
    expect(normalized.targets).toEqual(['web']);
    expect(normalized.constraints).toEqual(['accessible']);
  });

  it('creates a deterministic project plan with traceable requirements', () => {
    const plan = createProjectPlan(validSpec);
    expect(plan.specId).toBe('task-board');
    expect(plan.directories).toContain('src/components');
    expect(plan.directories).toContain('src/api');
    expect(plan.files.map((file) => file.path)).toContain('docs/requirements.md');
    expect(plan.commands).toEqual(['install', 'dev', 'build', 'test', 'lint']);
    expect(plan.verification.length).toBeGreaterThanOrEqual(4);
  });

  it('fails closed for an invalid specification', () => {
    expect(() => createProjectPlan({ ...validSpec, requirements: [] })).toThrow(/APP_REQUIREMENTS_REQUIRED/);
  });
});
