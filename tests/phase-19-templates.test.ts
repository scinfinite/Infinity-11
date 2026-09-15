import { describe, expect, it, vi } from 'vitest';
import { denyByDefault } from '../packages/security/src/index.js';
import {
  applyScaffold,
  createScaffoldPlan,
  getTemplate,
  listTemplates,
  validateScaffoldSpec,
  type ScaffoldAdapter,
  type ScaffoldPlan,
  type ScaffoldSpec,
} from '../packages/templates/src/index.js';

const baseSpec: ScaffoldSpec = {
  id: 'demo-app',
  name: 'Demo App',
  description: 'A deterministic application scaffold.',
  target: 'web',
  language: 'typescript',
  framework: 'nextjs',
  revision: 1,
  templateId: 'web-nextjs',
};

function adapter(existing: Record<string, string | undefined> = {}): ScaffoldAdapter {
  return {
    readExistingPaths: vi.fn(async (paths) =>
      Object.fromEntries(paths.map((path) => [path, existing[path]])),
    ),
    apply: vi.fn(async (plan) => ({
      status: 'APPLIED' as const,
      written: plan.files.map((file) => file.path),
      skipped: [],
      diagnostics: [],
    })),
  };
}

const allowPolicy = { decide: () => 'ALLOW' as const };
const askPolicy = { decide: () => 'ASK' as const };

describe('phase 19 template registry', () => {
  it('exposes deterministic templates including Java', () => {
    expect(listTemplates().map((template) => template.id)).toEqual([
      'web-nextjs',
      'web-react-vite',
      'backend-fastapi',
      'backend-spring-boot',
      'backend-go',
    ]);
    expect(getTemplate('backend-spring-boot')?.languages).toContain('java');
  });

  it('rejects unknown templates and incompatible capabilities', () => {
    expect(validateScaffoldSpec({ ...baseSpec, templateId: 'missing' })).toEqual([
      {
        code: 'TEMPLATE_NOT_FOUND',
        field: 'templateId',
        message: 'Unknown template: missing.',
      },
    ]);
    expect(validateScaffoldSpec({ ...baseSpec, language: 'python' })).toContainEqual({
      code: 'LANGUAGE_UNSUPPORTED',
      field: 'language',
      message: 'Template web-nextjs does not support python.',
    });
  });
});

describe('phase 19 deterministic scaffolding', () => {
  it('produces stable ordered files, directories, hashes, and plan checksum', () => {
    const first = createScaffoldPlan(baseSpec);
    const second = createScaffoldPlan({ ...baseSpec, variables: { ZED: '2', alpha: '1' } });
    const third = createScaffoldPlan(baseSpec);
    expect(first).toEqual(third);
    expect(first.checksum).not.toBe(second.checksum);
    expect(first.files.map((file) => file.path)).toEqual([
      '.env.example',
      '.gitignore',
      'package.json',
      'README.md',
      'src/app/api/health/route.ts',
      'src/app/page.tsx',
      'tests/smoke.test.ts',
    ]);
    expect(first.files.every((file) => /^[a-f0-9]{64}$/.test(file.checksum))).toBe(true);
    expect(first.directories).toEqual(['src', 'src/app', 'src/app/api', 'src/app/api/health', 'tests']);
  });

  it('binds exact template version and revision', () => {
    const plan = createScaffoldPlan(baseSpec);
    expect(plan.templateVersion).toBe(1);
    expect(plan.revision).toBe(1);
    expect(plan.specId).toBe('demo-app');
  });

  it('fails closed on unsafe ids and revisions', () => {
    expect(validateScaffoldSpec({ ...baseSpec, id: '../escape' })).toContainEqual(
      expect.objectContaining({ code: 'INVALID_ID' }),
    );
    expect(validateScaffoldSpec({ ...baseSpec, revision: 0 })).toContainEqual(
      expect.objectContaining({ code: 'INVALID_REVISION' }),
    );
    expect(() => createScaffoldPlan({ ...baseSpec, id: '../escape' })).toThrow(/INVALID_ID/);
  });
});

describe('phase 19 policy-controlled application', () => {
  it('denies filesystem mutation by default', async () => {
    const plan = createScaffoldPlan(baseSpec);
    const target = adapter();
    const result = await applyScaffold(plan, target, denyByDefault, 'all');
    expect(result).toEqual({
      status: 'BLOCKED',
      written: [],
      skipped: [],
      diagnostics: ['POLICY_DENIED'],
    });
    expect(target.apply).not.toHaveBeenCalled();
  });

  it('requires explicit ASK approval bound to the plan checksum', async () => {
    const plan = createScaffoldPlan(baseSpec);
    const target = adapter();
    expect((await applyScaffold(plan, target, askPolicy, 'all')).diagnostics).toEqual([
      'APPROVAL_REQUIRED',
    ]);
    expect(
      (
        await applyScaffold(plan, target, askPolicy, 'all', {
          approved: true,
          planChecksum: 'wrong',
        })
      ).diagnostics,
    ).toEqual(['APPROVAL_REQUIRED']);
    expect(
      (
        await applyScaffold(plan, target, askPolicy, 'all', {
          approved: true,
          planChecksum: plan.checksum,
        })
      ).status,
    ).toBe('APPLIED');
    expect(target.apply).toHaveBeenCalledOnce();
  });

  it('blocks overwrite conflicts with never policy', async () => {
    const plan = createScaffoldPlan(baseSpec);
    const target = adapter({ 'README.md': 'user content' });
    const result = await applyScaffold(plan, target, allowPolicy, 'never');
    expect(result.diagnostics).toEqual(['CONFLICTS_PRESENT']);
    expect(target.apply).not.toHaveBeenCalled();
  });

  it('applies only changed files with changed-only policy', async () => {
    const plan = createScaffoldPlan(baseSpec);
    const target = adapter({
      'README.md': plan.files.find((file) => file.path === 'README.md')?.content,
    });
    const result = await applyScaffold(plan, target, allowPolicy, 'changed-only');
    expect(result.status).toBe('APPLIED');
    expect(target.apply).toHaveBeenCalledWith(
      expect.objectContaining({
        files: expect.not.arrayContaining([expect.objectContaining({ path: 'README.md' })]),
      }),
      'changed-only',
    );
  });

  it('rejects tampered plan content before adapter access', async () => {
    const plan = createScaffoldPlan(baseSpec);
    const target = adapter();
    const tampered = {
      ...plan,
      files: plan.files.map((file, index) =>
        index === 0 ? { ...file, content: 'tampered' } : file,
      ),
    } as ScaffoldPlan;
    const result = await applyScaffold(tampered, target, allowPolicy, 'all');
    expect(result.diagnostics).toEqual(['INVALID_PLAN']);
    expect(target.readExistingPaths).not.toHaveBeenCalled();
  });
});
