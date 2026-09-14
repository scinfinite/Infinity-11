export const QUALITY_STATES = ['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'BLOCKED'] as const;
export type QualityState = (typeof QUALITY_STATES)[number];

export const PERMISSION_DECISIONS = ['ALLOW', 'ASK', 'DENY'] as const;
export type PermissionDecision = (typeof PERMISSION_DECISIONS)[number];

export type ProviderKind =
  | 'ai'
  | 'credential'
  | 'execution'
  | 'database'
  | 'storage'
  | 'browser'
  | 'deployment'
  | 'git'
  | 'knowledge'
  | 'notification';

export interface CorrelationContext {
  correlationId: string;
  causationId?: string;
  actorId?: string;
  workspaceId?: string;
  projectId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  correlationId: string;
  details?: Record<string, unknown>;
}

export interface DomainEvent<TType extends string = string, TPayload = unknown> {
  id: string;
  type: TType;
  version: 1;
  occurredAt: string;
  correlation: CorrelationContext;
  payload: TPayload;
}

export interface ProviderReference {
  id: string;
  kind: ProviderKind;
  adapter: string;
}

export interface CapabilityRequirement {
  capability: string;
  required?: boolean;
}

export interface VerificationEvidence {
  kind: string;
  sourceRevision?: string;
  environmentId?: string;
  location?: string;
  summary: string;
}

export interface VerificationRecord {
  id: string;
  state: QualityState;
  dimensions: Record<string, 'PASS' | 'FAIL' | 'UNKNOWN'>;
  evidence: VerificationEvidence[];
  checkedAt: string;
}
