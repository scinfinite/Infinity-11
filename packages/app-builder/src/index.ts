export type AppTarget = 'web' | 'mobile' | 'desktop' | 'backend' | 'full-stack';
export type AppLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'csharp'
  | 'kotlin'
  | 'swift';
export type AppFramework =
  | 'react'
  | 'nextjs'
  | 'vue'
  | 'svelte'
  | 'express'
  | 'fastapi'
  | 'spring-boot'
  | 'gin'
  | 'unknown';

export interface ApplicationRequirement {
  id: string;
  description: string;
  acceptanceCriteria: string[];
  priority: 'must' | 'should' | 'could';
}

export interface ApplicationSpec {
  id: string;
  name: string;
  description: string;
  targets: AppTarget[];
  language: AppLanguage;
  framework: AppFramework;
  requirements: ApplicationRequirement[];
  constraints: string[];
  revision: number;
}

export interface ProjectFilePlan {
  path: string;
  purpose: string;
  language: AppLanguage | 'text' | 'json' | 'markdown';
  generated: boolean;
}

export interface ProjectTraceability {
  requirementId: string;
  filePaths: string[];
}

export interface ProjectPlan {
  specId: string;
  revision: number;
  directories: string[];
  files: ProjectFilePlan[];
  traceability: ProjectTraceability[];
  commands: Array<'install' | 'dev' | 'build' | 'test' | 'lint'>;
  verification: string[];
}

export interface ValidationIssue {
  code: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

const APP_LANGUAGES: AppLanguage[] = [
  'typescript',
  'javascript',
  'python',
  'java',
  'go',
  'rust',
  'csharp',
  'kotlin',
  'swift',
];

const APP_TARGETS: AppTarget[] = ['web', 'mobile', 'desktop', 'backend', 'full-stack'];

const APP_FRAMEWORKS: AppFramework[] = [
  'react',
  'nextjs',
  'vue',
  'svelte',
  'express',
  'fastapi',
  'spring-boot',
  'gin',
  'unknown',
];

const FRAMEWORK_LANGUAGES: Record<AppFramework, AppLanguage[]> = {
  react: ['typescript', 'javascript'],
  nextjs: ['typescript', 'javascript'],
  vue: ['typescript', 'javascript'],
  svelte: ['typescript', 'javascript'],
  express: ['typescript', 'javascript'],
  fastapi: ['python'],
  'spring-boot': ['java'],
  gin: ['go'],
  unknown: APP_LANGUAGES,
};

const LANGUAGE_EXTENSIONS: Record<AppLanguage, string> = {
  typescript: 'ts',
  javascript: 'js',
  python: 'py',
  java: 'java',
  go: 'go',
  rust: 'rs',
  csharp: 'cs',
  kotlin: 'kt',
  swift: 'swift',
};

const isKnownValue = <T extends string>(value: string, values: readonly T[]): value is T =>
  values.includes(value as T);

export function validateApplicationSpec(spec: ApplicationSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!spec.id.trim()) {
    issues.push({
      code: 'APP_ID_REQUIRED',
      field: 'id',
      message: 'Application id is required.',
      severity: 'error',
    });
  } else if (!/^[a-z][a-z0-9-]{1,62}$/.test(spec.id)) {
    issues.push({
      code: 'APP_ID_INVALID',
      field: 'id',
      message:
        'Application id must be 2–63 lowercase characters, digits, or hyphens and start with a letter.',
      severity: 'error',
    });
  }

  if (!spec.name.trim()) {
    issues.push({
      code: 'APP_NAME_REQUIRED',
      field: 'name',
      message: 'Application name is required.',
      severity: 'error',
    });
  }

  if (!spec.description.trim()) {
    issues.push({
      code: 'APP_DESCRIPTION_REQUIRED',
      field: 'description',
      message: 'Application description is required.',
      severity: 'error',
    });
  }

  if (!spec.targets.length) {
    issues.push({
      code: 'APP_TARGET_REQUIRED',
      field: 'targets',
      message: 'At least one application target is required.',
      severity: 'error',
    });
  }

  if (!spec.requirements.length) {
    issues.push({
      code: 'APP_REQUIREMENTS_REQUIRED',
      field: 'requirements',
      message: 'At least one requirement is required.',
      severity: 'error',
    });
  }

  if (!isKnownValue(spec.language, APP_LANGUAGES)) {
    issues.push({
      code: 'APP_LANGUAGE_UNSUPPORTED',
      field: 'language',
      message: `Unsupported application language: ${String(spec.language)}.`,
      severity: 'error',
    });
  }

  if (!isKnownValue(spec.framework, APP_FRAMEWORKS)) {
    issues.push({
      code: 'APP_FRAMEWORK_UNSUPPORTED',
      field: 'framework',
      message: `Unsupported application framework: ${String(spec.framework)}.`,
      severity: 'error',
    });
  } else if (!FRAMEWORK_LANGUAGES[spec.framework].includes(spec.language)) {
    issues.push({
      code: 'FRAMEWORK_LANGUAGE_MISMATCH',
      field: 'framework',
      message: `${spec.framework} does not support ${spec.language} in the Phase 11 foundation contract.`,
      severity: 'error',
    });
  }

  for (const target of spec.targets) {
    if (!isKnownValue(target, APP_TARGETS)) {
      issues.push({
        code: 'APP_TARGET_UNSUPPORTED',
        field: 'targets',
        message: `Unsupported application target: ${String(target)}.`,
        severity: 'error',
      });
    }
  }

  if (!Number.isInteger(spec.revision) || spec.revision < 1) {
    issues.push({
      code: 'APP_REVISION_INVALID',
      field: 'revision',
      message: 'Revision must be a positive integer.',
      severity: 'error',
    });
  }

  const ids = new Set<string>();
  for (const requirement of spec.requirements) {
    const requirementId = requirement.id.trim();
    if (!requirementId) {
      issues.push({
        code: 'REQUIREMENT_ID_REQUIRED',
        field: 'requirements',
        message: 'Requirement id is required.',
        severity: 'error',
      });
    } else if (ids.has(requirementId)) {
      issues.push({
        code: 'DUPLICATE_REQUIREMENT_ID',
        field: 'requirements',
        message: `Duplicate requirement id: ${requirementId}.`,
        severity: 'error',
      });
    }
    ids.add(requirementId);

    if (!requirement.description.trim()) {
      issues.push({
        code: 'REQUIREMENT_DESCRIPTION_REQUIRED',
        field: `requirements.${requirementId}`,
        message: 'Requirement description is required.',
        severity: 'error',
      });
    }
    if (!requirement.acceptanceCriteria.length) {
      issues.push({
        code: 'ACCEPTANCE_CRITERIA_REQUIRED',
        field: `requirements.${requirementId}`,
        message: 'At least one acceptance criterion is required.',
        severity: 'error',
      });
    }
  }

  return issues;
}

export function createProjectPlan(spec: ApplicationSpec): ProjectPlan {
  const issues = validateApplicationSpec(spec).filter((issue) => issue.severity === 'error');
  if (issues.length) {
    throw new Error(
      `Invalid application specification: ${issues.map((issue) => issue.code).join(', ')}`,
    );
  }

  const extension = LANGUAGE_EXTENSIONS[spec.language];
  const files: ProjectFilePlan[] = [
    {
      path: 'README.md',
      purpose: 'Project overview, setup, and verification contract.',
      language: 'markdown',
      generated: true,
    },
    {
      path: '.gitignore',
      purpose: 'Generated project exclusions.',
      language: 'text',
      generated: true,
    },
    {
      path: 'docs/requirements.md',
      purpose: 'Traceable requirements and acceptance criteria.',
      language: 'markdown',
      generated: true,
    },
  ];
  const directories = ['src', 'tests', 'docs'];

  if (spec.targets.includes('web') || spec.targets.includes('full-stack')) {
    directories.push('src/components', 'src/pages');
    files.push({
      path: `src/app.${extension}`,
      purpose: 'Application composition root.',
      language: spec.language,
      generated: true,
    });
  }

  if (spec.targets.includes('backend') || spec.targets.includes('full-stack')) {
    directories.push('src/api', 'src/services');
    files.push({
      path: `src/api/index.${extension}`,
      purpose: 'Backend API boundary.',
      language: spec.language,
      generated: true,
    });
  }

  files.push({
    path: `tests/smoke.test.${extension}`,
    purpose: 'Initial executable project health check.',
    language: spec.language,
    generated: true,
  });

  const requirementIds = spec.requirements.map((requirement) => requirement.id.trim());

  return {
    specId: spec.id,
    revision: spec.revision,
    directories: [...new Set(directories)].sort(),
    files,
    traceability: [
      {
        requirementId: requirementIds[0],
        filePaths: files.map((file) => file.path),
      },
    ],
    commands: ['install', 'dev', 'build', 'test', 'lint'],
    verification: [
      'Validate generated project structure against the application specification.',
      'Install dependencies without requiring a provider-specific service.',
      'Run deterministic smoke tests before claiming a generated project is usable.',
      'Build and type-check generated source before delivery.',
      'Preserve requirement-to-file traceability for subsequent modification phases.',
    ],
  };
}

export function normalizeApplicationSpec(input: ApplicationSpec): ApplicationSpec {
  return {
    ...input,
    id: input.id.trim().toLowerCase(),
    name: input.name.trim(),
    description: input.description.trim(),
    targets: [...new Set(input.targets)],
    constraints: [...new Set(input.constraints.map((value) => value.trim()).filter(Boolean))],
    requirements: input.requirements.map((requirement) => ({
      ...requirement,
      id: requirement.id.trim(),
      description: requirement.description.trim(),
      acceptanceCriteria: requirement.acceptanceCriteria.map((value) => value.trim()).filter(Boolean),
    })),
  };
}
