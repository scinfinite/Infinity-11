export type ModificationKind = 'create' | 'update' | 'delete' | 'rename';
export type PolicyDecision = 'allow' | 'ask' | 'deny';

export interface ProjectFile {
  path: string;
  content: string;
  hash?: string;
}

export interface ModificationOperation {
  kind: ModificationKind;
  path: string;
  content?: string;
  toPath?: string;
  expectedHash?: string;
}

export interface ModificationRequest {
  id: string;
  projectId: string;
  baseRevision: number;
  reason: string;
  operations: ModificationOperation[];
  actor?: string;
}

export interface ModificationIssue {
  code: string;
  path: string;
  message: string;
}

export interface PlannedOperation extends ModificationOperation {
  beforeHash?: string;
  afterHash?: string;
}

export interface ModificationPlan {
  requestId: string;
  projectId: string;
  baseRevision: number;
  requestChecksum: string;
  operations: PlannedOperation[];
  changedFiles: string[];
  checksum: string;
  policy: PolicyDecision;
}

export interface ProjectStore {
  read(projectId: string, path: string): Promise<ProjectFile | null>;
  write(projectId: string, path: string, content: string): Promise<void>;
  remove(projectId: string, path: string): Promise<void>;
  rename(projectId: string, fromPath: string, toPath: string): Promise<void>;
  revision(projectId: string): Promise<number>;
}

export interface ModificationPolicy {
  evaluate(input: {
    projectId: string;
    actor?: string;
    operation: ModificationOperation;
  }): Promise<PolicyDecision> | PolicyDecision;
}

export interface ModificationApplyResult {
  requestId: string;
  applied: boolean;
  revision: number;
  checksum: string;
  rollbackAvailable: boolean;
}

const idPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const pathPattern = /^(?!\/)(?!.*\\)(?!.*(?:^|\/)\.\.\/?)(?!.*(?:^|\/)[.]?(?:$|\/))[\x20-\x7e]+$/;

function assertSafePath(path: string, field: string, issues: ModificationIssue[]): void {
  if (!pathPattern.test(path) || path.startsWith('.git/') || path === '.git') {
    issues.push({
      code: 'UNSAFE_PATH',
      path: field,
      message: 'Project paths must be relative, normalized, printable, and outside .git.',
    });
  }
}

function hash(content: string): string {
  let value = 2166136261;
  for (let i = 0; i < content.length; i += 1) {
    value ^= content.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, '0');
}

function canonicalRequest(request: ModificationRequest): string {
  return JSON.stringify({
    id: request.id,
    projectId: request.projectId,
    baseRevision: request.baseRevision,
    reason: request.reason,
    actor: request.actor,
    operations: [...request.operations].sort(compareOperations),
  });
}

function canonicalPlan(request: ModificationRequest, operations: PlannedOperation[]): string {
  return JSON.stringify({
    request: canonicalRequest(request),
    operations,
  });
}

function compareOperations(a: ModificationOperation, b: ModificationOperation): number {
  return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

function comparePlannedOperations(a: PlannedOperation, b: PlannedOperation): number {
  return compareOperations(a, b);
}

function checksum(input: string): string {
  return hash(input);
}

export function validateModificationRequest(request: ModificationRequest): ModificationIssue[] {
  const issues: ModificationIssue[] = [];
  if (!idPattern.test(request.id)) {
    issues.push({
      code: 'INVALID_REQUEST_ID',
      path: 'id',
      message: 'Request id is invalid.',
    });
  }
  if (!idPattern.test(request.projectId)) {
    issues.push({
      code: 'INVALID_PROJECT_ID',
      path: 'projectId',
      message: 'Project id is invalid.',
    });
  }
  if (!Number.isInteger(request.baseRevision) || request.baseRevision < 0) {
    issues.push({
      code: 'INVALID_BASE_REVISION',
      path: 'baseRevision',
      message: 'Base revision must be a non-negative integer.',
    });
  }
  if (!request.reason.trim() || request.reason.length > 4096) {
    issues.push({
      code: 'INVALID_REASON',
      path: 'reason',
      message: 'Reason must be non-empty and at most 4096 characters.',
    });
  }
  if (!request.operations.length) {
    issues.push({
      code: 'OPERATIONS_REQUIRED',
      path: 'operations',
      message: 'At least one modification operation is required.',
    });
  }

  const paths = new Set<string>();
  for (const [index, operation] of request.operations.entries()) {
    const prefix = `operations.${index}`;
    assertSafePath(operation.path, `${prefix}.path`, issues);
    if (paths.has(operation.path)) {
      issues.push({
        code: 'DUPLICATE_PATH',
        path: `${prefix}.path`,
        message: 'A path may be modified only once per request.',
      });
    }
    paths.add(operation.path);

    if (operation.kind === 'create' || operation.kind === 'update') {
      if (operation.content === undefined) {
        issues.push({
          code: 'CONTENT_REQUIRED',
          path: `${prefix}.content`,
          message: `${operation.kind} operations require content.`,
        });
      }
    } else if (operation.content !== undefined) {
      issues.push({
        code: 'UNEXPECTED_CONTENT',
        path: `${prefix}.content`,
        message: `${operation.kind} operations must not carry content.`,
      });
    }

    if (operation.kind === 'rename') {
      if (!operation.toPath) {
        issues.push({
          code: 'RENAME_TARGET_REQUIRED',
          path: `${prefix}.toPath`,
          message: 'Rename operations require a destination path.',
        });
      } else {
        assertSafePath(operation.toPath, `${prefix}.toPath`, issues);
        if (paths.has(operation.toPath)) {
          issues.push({
            code: 'DUPLICATE_PATH',
            path: `${prefix}.toPath`,
            message: 'Rename destination conflicts with another operation.',
          });
        }
      }
    } else if (operation.toPath !== undefined) {
      issues.push({
        code: 'UNEXPECTED_TARGET',
        path: `${prefix}.toPath`,
        message: 'Only rename operations may specify toPath.',
      });
    }
  }
  return issues;
}

export async function buildModificationPlan(
  request: ModificationRequest,
  store: ProjectStore,
  policy: ModificationPolicy,
): Promise<ModificationPlan> {
  const issues = validateModificationRequest(request);
  if (issues.length) {
    throw new Error(
      `Invalid modification request: ${issues.map((issue) => issue.code).join(', ')}`,
    );
  }

  const currentRevision = await store.revision(request.projectId);
  if (currentRevision !== request.baseRevision) {
    throw new Error(
      `STALE_PROJECT_REVISION: expected ${request.baseRevision}, found ${currentRevision}`,
    );
  }

  const planned: PlannedOperation[] = [];
  let finalDecision: PolicyDecision = 'allow';
  for (const operation of request.operations) {
    const decision = await policy.evaluate({
      projectId: request.projectId,
      actor: request.actor,
      operation,
    });
    if (decision === 'deny') {
      throw new Error(`POLICY_DENIED: ${operation.kind} ${operation.path}`);
    }
    if (decision === 'ask') finalDecision = 'ask';

    const before = await store.read(request.projectId, operation.path);
    const beforeHash = before ? hash(before.content) : undefined;
    if (operation.expectedHash !== undefined && operation.expectedHash !== beforeHash) {
      throw new Error(`STALE_FILE: ${operation.path}`);
    }
    if (operation.kind === 'create' && before) {
      throw new Error(`FILE_EXISTS: ${operation.path}`);
    }
    if (
      (operation.kind === 'update' || operation.kind === 'delete' || operation.kind === 'rename') &&
      !before
    ) {
      throw new Error(`FILE_NOT_FOUND: ${operation.path}`);
    }
    if (operation.kind === 'rename') {
      const target = await store.read(request.projectId, operation.toPath!);
      if (target) {
        throw new Error(`RENAME_TARGET_EXISTS: ${operation.toPath}`);
      }
    }

    planned.push({
      ...operation,
      beforeHash,
      afterHash: operation.content === undefined ? undefined : hash(operation.content),
    });
  }

  const operations = [...planned].sort(comparePlannedOperations);
  const changedFiles = [
    ...new Set(
      operations.flatMap((operation) =>
        operation.kind === 'rename' ? [operation.path, operation.toPath!] : [operation.path],
      ),
    ),
  ].sort();
  return {
    requestId: request.id,
    projectId: request.projectId,
    baseRevision: request.baseRevision,
    requestChecksum: checksum(canonicalRequest(request)),
    operations,
    changedFiles,
    checksum: checksum(canonicalPlan(request, operations)),
    policy: finalDecision,
  };
}

export async function applyModificationPlan(
  request: ModificationRequest,
  plan: ModificationPlan,
  store: ProjectStore,
  approveAsk: () => Promise<boolean> | boolean = () => false,
): Promise<ModificationApplyResult> {
  if (
    plan.requestId !== request.id ||
    plan.projectId !== request.projectId ||
    plan.baseRevision !== request.baseRevision
  ) {
    throw new Error('PLAN_MISMATCH: plan does not belong to request.');
  }
  if (plan.requestChecksum !== checksum(canonicalRequest(request))) {
    throw new Error('PLAN_MISMATCH: request operations differ from the planned request.');
  }
  if (plan.policy === 'ask' && !(await approveAsk())) {
    throw new Error('APPROVAL_REQUIRED: modification plan was not approved.');
  }
  const currentRevision = await store.revision(request.projectId);
  if (currentRevision !== plan.baseRevision) {
    throw new Error('STALE_PLAN: project changed after planning.');
  }

  const backups = new Map<string, ProjectFile | null>();
  for (const operation of plan.operations) {
    backups.set(operation.path, await store.read(request.projectId, operation.path));
    if (operation.toPath) {
      backups.set(operation.toPath, await store.read(request.projectId, operation.toPath));
    }
  }

  try {
    for (const operation of plan.operations) {
      if (operation.kind === 'create' || operation.kind === 'update') {
        await store.write(request.projectId, operation.path, operation.content!);
      } else if (operation.kind === 'delete') {
        await store.remove(request.projectId, operation.path);
      } else {
        await store.rename(request.projectId, operation.path, operation.toPath!);
      }
    }
  } catch (error) {
    for (const [path, file] of backups) {
      if (file) {
        await store.write(request.projectId, path, file.content);
      } else if (await store.read(request.projectId, path)) {
        await store.remove(request.projectId, path);
      }
    }
    throw error;
  }

  return {
    requestId: request.id,
    applied: true,
    revision: await store.revision(request.projectId),
    checksum: plan.checksum,
    rollbackAvailable: backups.size > 0,
  };
}

export function summarizeModification(plan: ModificationPlan): string {
  return plan.operations
    .map((operation) => {
      const target =
        operation.kind === 'rename' ? `${operation.path} → ${operation.toPath}` : operation.path;
      return `${operation.kind.toUpperCase()} ${target}`;
    })
    .join('\n');
}
