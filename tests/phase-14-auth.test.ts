import { describe, expect, it } from 'vitest';
import {
  authorize,
  buildAuthPlan,
  validateAuthSpec,
  type AuthSpec,
} from '../packages/auth/src/index.js';

const base: AuthSpec = {
  id: 'app_auth',
  revision: 1,
  providers: [{ id: 'local', strategy: 'password' }],
  passwordPolicy: { minLength: 12, requireNumber: true, requireSymbol: true },
  roles: [
    { name: 'admin', permissions: ['project.read', 'project.write'] },
    { name: 'viewer', permissions: ['project.read'] },
  ],
  policies: [
    {
      resource: 'project',
      action: 'read',
      effect: 'allow',
      roles: ['viewer', 'admin'],
    },
    {
      resource: 'project',
      action: 'write',
      effect: 'allow',
      roles: ['admin'],
    },
    {
      resource: 'project',
      action: 'write',
      effect: 'deny',
      roles: ['viewer'],
    },
  ],
  session: {
    transport: 'secure-cookie',
    ttlSeconds: 3600,
    idleTimeoutSeconds: 1800,
    rotateOnLogin: true,
    sameSite: 'lax',
  },
  csrfProtection: true,
};

describe('phase 14 authentication and authorization builder', () => {
  it('builds deterministic plans independent of declaration ordering', () => {
    const a = buildAuthPlan(base);
    const b = buildAuthPlan({
      ...base,
      providers: [...base.providers].reverse(),
      roles: [...base.roles].reverse(),
      policies: [...base.policies].reverse(),
    });
    expect(a.checksum).toBe(b.checksum);
    expect(a.config).toContain('secure-cookie');
    expect(a.contracts).toContain('AuthorizationRuntime');
  });

  it('fails closed for password auth without an explicit password policy', () => {
    const issues = validateAuthSpec({ ...base, passwordPolicy: undefined });
    expect(
      issues.some((issue) => issue.code === 'PASSWORD_POLICY_REQUIRED'),
    ).toBe(true);
    expect(() =>
      buildAuthPlan({ ...base, passwordPolicy: undefined }),
    ).toThrow();
  });

  it('rejects unsafe session and OAuth configurations', () => {
    const issues = validateAuthSpec({
      ...base,
      session: {
        transport: 'authorization-header',
        ttlSeconds: 30,
        sameSite: 'none',
      },
      providers: [
        { id: 'oidc', strategy: 'oauth2', issuer: 'JaVaScRiPt:alert(1)' },
      ],
    });
    expect(issues.map((i) => i.code)).toEqual(
      expect.arrayContaining([
        'INVALID_SESSION_TTL',
        'SAMESITE_NONE_REQUIRES_COOKIE',
        'OAUTH_CONFIG_REQUIRED',
        'UNSAFE_ISSUER',
      ]),
    );
  });

  it('rejects allow rules that exceed a role permission grant', () => {
    const issues = validateAuthSpec({
      ...base,
      policies: [
        {
          resource: 'project',
          action: 'delete',
          effect: 'allow',
          roles: ['viewer'],
        },
      ],
    });
    expect(issues.map((i) => i.code)).toContain('POLICY_PERMISSION_MISMATCH');
  });

  it('uses explicit deny precedence in authorization decisions', () => {
    expect(
      authorize(
        { subject: 'u1', roles: ['viewer'] },
        'project',
        'read',
        base.policies,
      ),
    ).toBe(true);
    expect(
      authorize(
        { subject: 'u1', roles: ['viewer'] },
        'project',
        'write',
        base.policies,
      ),
    ).toBe(false);
    expect(
      authorize(
        { subject: 'u2', roles: ['admin'] },
        'project',
        'write',
        base.policies,
      ),
    ).toBe(true);
    expect(
      authorize({ subject: 'u3', roles: [] }, 'project', 'read', base.policies),
    ).toBe(false);
  });

  it('rejects unknown roles and malformed permissions', () => {
    const issues = validateAuthSpec({
      ...base,
      roles: [{ name: 'viewer', permissions: ['bad permission'] }],
      policies: [
        {
          resource: 'project',
          action: 'read',
          effect: 'allow',
          roles: ['missing'],
        },
      ],
    });
    expect(issues.map((i) => i.code)).toEqual(
      expect.arrayContaining(['INVALID_PERMISSION', 'UNKNOWN_POLICY_ROLE']),
    );
  });
});
