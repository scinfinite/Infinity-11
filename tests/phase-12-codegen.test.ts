import { describe, expect, it } from 'vitest';
import {
  auditGeneratedProject,
  generateProject,
  validateGenerationSpec,
  type GenerationSpec,
} from '../packages/codegen/src/index.js';

const baseSpec: GenerationSpec = {
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
      acceptanceCriteria: ['A task can be created.', 'A task can be completed.'],
      priority: 'must',
    },
  ],
  constraints: ['accessible', 'responsive'],
  revision: 1,
};

const variants: Array<Pick<GenerationSpec, 'id' | 'language' | 'framework' | 'targets'>> = [
  { id: 'next-app', language: 'typescript', framework: 'nextjs', targets: ['full-stack'] },
  { id: 'express-api', language: 'typescript', framework: 'express', targets: ['backend'] },
  { id: 'react-web', language: 'typescript', framework: 'react', targets: ['web'] },
  { id: 'vue-web', language: 'typescript', framework: 'vue', targets: ['web'] },
  { id: 'svelte-web', language: 'typescript', framework: 'svelte', targets: ['web'] },
  { id: 'fastapi-api', language: 'python', framework: 'fastapi', targets: ['backend'] },
  { id: 'spring-api', language: 'java', framework: 'spring-boot', targets: ['backend'] },
  { id: 'gin-api', language: 'go', framework: 'gin', targets: ['backend'] },
];

describe('Phase 12 full-stack code generation', () => {
  it('validates the Phase 11 application contract without inventing unsupported combinations', () => {
    expect(validateGenerationSpec(baseSpec)).toEqual([]);
    expect(
      validateGenerationSpec({ ...baseSpec, language: 'java', framework: 'nextjs' }),
    ).toContain('FRAMEWORK_LANGUAGE_MISMATCH');
  });

  it('generates deterministically and preserves requirement traceability', () => {
    const first = generateProject(baseSpec);
    const second = generateProject(baseSpec);
    expect(second).toEqual(first);
    expect(first.audit.passed).toBe(true);
    expect(first.manifest.requirementTraceability.tasks).toContain('docs/requirements.md');
    expect(first.files.map((file) => file.path)).toContain('infinity-11.generated.json');
  });

  it('covers every supported Phase 12 framework variant', () => {
    for (const variant of variants) {
      const project = generateProject({
        ...baseSpec,
        ...variant,
        name: variant.id,
        description: `Generated ${variant.id}.`,
      });
      expect(project.audit.passed, variant.id).toBe(true);
      expect(project.manifest.commands).toEqual([
        'install',
        'dev',
        'build',
        'test',
        'lint',
        'typecheck',
        'security',
      ]);
    }
  });

  it('rejects path traversal and secret material during generated-project audit', () => {
    const project = generateProject(baseSpec);
    const tampered = {
      ...project,
      files: [
        ...project.files,
        {
          path: '../secrets.pem',
          content: '-----BEGIN PRIVATE KEY-----',
          purpose: 'tampered fixture',
          generated: true as const,
        },
      ],
    };
    const audit = auditGeneratedProject(tampered);
    expect(audit.passed).toBe(false);
    expect(audit.errors).toEqual(
      expect.arrayContaining(['UNSAFE_PATH:../secrets.pem', 'SECRET_FILE:../secrets.pem']),
    );
  });

  it('fails closed when requirements are absent', () => {
    expect(() => generateProject({ ...baseSpec, requirements: [] })).toThrow(/REQUIREMENTS_REQUIRED/);
  });
});
