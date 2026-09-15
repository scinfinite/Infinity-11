export type AuthStrategy = 'password' | 'magic-link' | 'oauth2' | 'passkey';
export type SessionTransport = 'secure-cookie' | 'authorization-header';
export type PermissionEffect = 'allow' | 'deny';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSymbol?: boolean;
  maxFailedAttempts?: number;
  lockoutMinutes?: number;
}

export interface AuthProviderSpec {
  id: string;
  strategy: AuthStrategy;
  issuer?: string;
  clientId?: string;
  scopes?: string[];
}

export interface RoleSpec {
  name: string;
  permissions: string[];
}

export interface PolicyRule {
  resource: string;
  action: string;
  effect: PermissionEffect;
  roles?: string[];
}

export interface AuthSpec {
  id: string;
  revision: number;
  providers: AuthProviderSpec[];
  roles: RoleSpec[];
  policies: PolicyRule[];
  session: {
    transport: SessionTransport;
    ttlSeconds: number;
    idleTimeoutSeconds?: number;
    rotateOnLogin?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  };
  passwordPolicy?: PasswordPolicy;
  csrfProtection?: boolean;
}

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface AuthPlan {
  specId: string;
  revision: number;
  config: string;
  policy: string;
  contracts: string;
  checksum: string;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, encodedHash: string): Promise<boolean>;
}

export interface TokenIssuer {
  issue(input: { subject: string; roles: string[] }): Promise<string>;
  verify(token: string): Promise<{
    subject: string;
    roles: string[];
  } | null>;
}

export interface AuthSession {
  id: string;
  subject: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt?: string;
  roles: string[];
}

export interface SessionStore {
  create(session: AuthSession): Promise<void>;
  get(id: string): Promise<AuthSession | null>;
  revoke(id: string): Promise<void>;
  rotate(id: string, replacement: AuthSession): Promise<void>;
}

export interface AuthorizationContext {
  subject: string;
  roles: string[];
}

const idPattern = /^[a-z][a-z0-9_]{0,62}$/;
const strategies: AuthStrategy[] = ['password', 'magic-link', 'oauth2', 'passkey'];
const transports: SessionTransport[] = ['secure-cookie', 'authorization-header'];
const permissionPattern = /^[a-z][a-z0-9_.:-]{0,127}$/;

export function validateAuthSpec(spec: AuthSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!idPattern.test(spec.id)) {
    issues.push({
      code: 'INVALID_AUTH_ID',
      path: 'id',
      message:
        'Auth id must be 1–63 lowercase letters, digits, or underscores and start with a letter.',
    });
  }
  if (!Number.isInteger(spec.revision) || spec.revision < 1) {
    issues.push({
      code: 'INVALID_REVISION',
      path: 'revision',
      message: 'Revision must be a positive integer.',
    });
  }
  if (!spec.providers.length) {
    issues.push({
      code: 'PROVIDERS_REQUIRED',
      path: 'providers',
      message: 'At least one authentication provider is required.',
    });
  }
  if (!transports.includes(spec.session.transport)) {
    issues.push({
      code: 'UNSUPPORTED_SESSION_TRANSPORT',
      path: 'session.transport',
      message: `Unsupported session transport: ${String(spec.session.transport)}.`,
    });
  }
  if (
    !Number.isInteger(spec.session.ttlSeconds) ||
    spec.session.ttlSeconds < 60 ||
    spec.session.ttlSeconds > 31536000
  ) {
    issues.push({
      code: 'INVALID_SESSION_TTL',
      path: 'session.ttlSeconds',
      message: 'Session TTL must be an integer between 60 seconds and 365 days.',
    });
  }
  if (
    spec.session.idleTimeoutSeconds !== undefined &&
    (!Number.isInteger(spec.session.idleTimeoutSeconds) ||
      spec.session.idleTimeoutSeconds < 60 ||
      spec.session.idleTimeoutSeconds > spec.session.ttlSeconds)
  ) {
    issues.push({
      code: 'INVALID_IDLE_TIMEOUT',
      path: 'session.idleTimeoutSeconds',
      message: 'Idle timeout must be at least 60 seconds and no greater than the session TTL.',
    });
  }
  if (spec.session.sameSite === 'none' && spec.session.transport !== 'secure-cookie') {
    issues.push({
      code: 'SAMESITE_NONE_REQUIRES_COOKIE',
      path: 'session.sameSite',
      message: 'SameSite=None is meaningful only with secure-cookie transport.',
    });
  }

  const providers = new Set<string>();
  for (const provider of spec.providers) {
    if (!idPattern.test(provider.id)) {
      issues.push({
        code: 'INVALID_PROVIDER_ID',
        path: `providers.${provider.id}`,
        message: `Invalid provider id: ${provider.id}.`,
      });
    }
    if (providers.has(provider.id)) {
      issues.push({
        code: 'DUPLICATE_PROVIDER',
        path: `providers.${provider.id}`,
        message: `Duplicate provider: ${provider.id}.`,
      });
    }
    providers.add(provider.id);
    if (!strategies.includes(provider.strategy)) {
      issues.push({
        code: 'UNSUPPORTED_STRATEGY',
        path: `providers.${provider.id}.strategy`,
        message: `Unsupported authentication strategy: ${String(provider.strategy)}.`,
      });
    }
    if (provider.strategy === 'oauth2' && (!provider.issuer || !provider.clientId)) {
      issues.push({
        code: 'OAUTH_CONFIG_REQUIRED',
        path: `providers.${provider.id}`,
        message: 'OAuth2 providers require issuer and clientId.',
      });
    }
    const issuerScheme = provider.issuer?.split(':', 1)[0]?.toLowerCase();
    if (issuerScheme === 'javascript' || issuerScheme === 'data') {
      issues.push({
        code: 'UNSAFE_ISSUER',
        path: `providers.${provider.id}.issuer`,
        message: 'Issuer must not use executable or data URI schemes.',
      });
    }
  }

  const roles = new Map<string, Set<string>>();
  for (const role of spec.roles) {
    if (!idPattern.test(role.name)) {
      issues.push({
        code: 'INVALID_ROLE',
        path: `roles.${role.name}`,
        message: `Invalid role name: ${role.name}.`,
      });
    }
    if (roles.has(role.name)) {
      issues.push({
        code: 'DUPLICATE_ROLE',
        path: `roles.${role.name}`,
        message: `Duplicate role: ${role.name}.`,
      });
    }
    const permissions = new Set<string>();
    for (const permission of role.permissions) {
      if (!permissionPattern.test(permission)) {
        issues.push({
          code: 'INVALID_PERMISSION',
          path: `roles.${role.name}.permissions`,
          message: `Invalid permission: ${permission}.`,
        });
      }
      permissions.add(permission);
    }
    roles.set(role.name, permissions);
  }

  for (const rule of spec.policies) {
    const target = `${rule.resource}.${rule.action}`;
    if (!permissionPattern.test(rule.resource)) {
      issues.push({
        code: 'INVALID_POLICY_RESOURCE',
        path: 'policies.resource',
        message: `Invalid policy resource: ${rule.resource}.`,
      });
    }
    if (!permissionPattern.test(rule.action)) {
      issues.push({
        code: 'INVALID_POLICY_ACTION',
        path: 'policies.action',
        message: `Invalid policy action: ${rule.action}.`,
      });
    }
    if (rule.roles?.some((role) => !roles.has(role))) {
      issues.push({
        code: 'UNKNOWN_POLICY_ROLE',
        path: 'policies',
        message: 'Policy references an unknown role.',
      });
    }
    if (rule.effect === 'deny' && !rule.roles?.length) {
      issues.push({
        code: 'DENY_ROLE_REQUIRED',
        path: 'policies',
        message:
          'A role-scoped deny rule is required; unscoped global denies belong to the central security policy engine.',
      });
    }
    if (rule.effect === 'allow') {
      for (const role of rule.roles ?? []) {
        const permissions = roles.get(role);
        if (permissions && !permissions.has(target)) {
          issues.push({
            code: 'POLICY_PERMISSION_MISMATCH',
            path: 'policies',
            message: `Allow rule ${target} is not declared by role ${role}.`,
          });
        }
      }
    }
  }

  if (spec.passwordPolicy) {
    const policy = spec.passwordPolicy;
    if (!Number.isInteger(policy.minLength) || policy.minLength < 8 || policy.minLength > 256) {
      issues.push({
        code: 'INVALID_PASSWORD_LENGTH',
        path: 'passwordPolicy.minLength',
        message: 'Password minimum length must be between 8 and 256.',
      });
    }
    if (
      policy.maxFailedAttempts !== undefined &&
      (!Number.isInteger(policy.maxFailedAttempts) || policy.maxFailedAttempts < 1)
    ) {
      issues.push({
        code: 'INVALID_LOCKOUT_ATTEMPTS',
        path: 'passwordPolicy.maxFailedAttempts',
        message: 'maxFailedAttempts must be a positive integer.',
      });
    }
    if (
      policy.lockoutMinutes !== undefined &&
      (!Number.isInteger(policy.lockoutMinutes) || policy.lockoutMinutes < 1)
    ) {
      issues.push({
        code: 'INVALID_LOCKOUT_DURATION',
        path: 'passwordPolicy.lockoutMinutes',
        message: 'lockoutMinutes must be a positive integer.',
      });
    }
  }

  if (spec.providers.some((provider) => provider.strategy === 'password') && !spec.passwordPolicy) {
    issues.push({
      code: 'PASSWORD_POLICY_REQUIRED',
      path: 'passwordPolicy',
      message: 'Password authentication requires an explicit password policy.',
    });
  }

  return issues;
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function canonical(spec: AuthSpec): string {
  const normalized = {
    ...spec,
    providers: [...spec.providers].sort((a, b) => a.id.localeCompare(b.id)),
    roles: [...spec.roles]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((role) => ({
        ...role,
        permissions: [...role.permissions].sort(),
      })),
    policies: [...spec.policies]
      .map((rule) => ({
        ...rule,
        roles: rule.roles ? [...rule.roles].sort() : undefined,
      }))
      .sort((a, b) =>
        `${a.resource}:${a.action}:${a.effect}:${(a.roles ?? []).join(',')}`.localeCompare(
          `${b.resource}:${b.action}:${b.effect}:${(b.roles ?? []).join(',')}`,
        ),
      ),
  };
  return JSON.stringify(normalized);
}

function normalizedProviders(spec: AuthSpec): AuthProviderSpec[] {
  return [...spec.providers].sort((a, b) => a.id.localeCompare(b.id));
}

function normalizedRoles(spec: AuthSpec): RoleSpec[] {
  return [...spec.roles]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((role) => ({ ...role, permissions: [...role.permissions].sort() }));
}

function normalizedPolicies(spec: AuthSpec): PolicyRule[] {
  return [...spec.policies]
    .map((rule) => ({
      ...rule,
      roles: rule.roles ? [...rule.roles].sort() : undefined,
    }))
    .sort((a, b) =>
      `${a.resource}:${a.action}:${a.effect}:${(a.roles ?? []).join(',')}`.localeCompare(
        `${b.resource}:${b.action}:${b.effect}:${(b.roles ?? []).join(',')}`,
      ),
    );
}

export function buildAuthPlan(spec: AuthSpec): AuthPlan {
  const issues = validateAuthSpec(spec);
  if (issues.length) {
    throw new Error(`Invalid auth specification: ${issues.map((issue) => issue.code).join(', ')}`);
  }

  const canonicalSpec = canonical(spec);
  const config = JSON.stringify(
    {
      id: spec.id,
      revision: spec.revision,
      providers: normalizedProviders(spec),
      session: spec.session,
      csrfProtection: spec.csrfProtection !== false,
    },
    null,
    2,
  );
  const policy = JSON.stringify(
    {
      roles: normalizedRoles(spec),
      policies: normalizedPolicies(spec),
    },
    null,
    2,
  );
  const contracts = [
    '// Generated contract boundary. Implement security-sensitive adapters outside this package.',
    'export interface AuthRuntime { authenticate(input: unknown): Promise<{ subject: string; roles: string[] } | null>; logout(sessionId: string): Promise<void>; }',
    'export interface AuthorizationRuntime { authorize(context: { subject: string; roles: string[] }, resource: string, action: string): Promise<boolean>; }',
  ].join('\n');

  return {
    specId: spec.id,
    revision: spec.revision,
    config,
    policy,
    contracts,
    checksum: stableHash(canonicalSpec),
  };
}

export function authorize(
  context: AuthorizationContext,
  resource: string,
  action: string,
  rules: PolicyRule[],
): boolean {
  const matching = rules.filter(
    (rule) =>
      rule.resource === resource &&
      rule.action === action &&
      (!rule.roles || rule.roles.some((role) => context.roles.includes(role))),
  );
  if (matching.some((rule) => rule.effect === 'deny')) return false;
  return matching.some((rule) => rule.effect === 'allow');
}
