import type { PermissionDecision } from '@infinity-11/types';

export type Capability =
  | 'filesystem.read'
  | 'filesystem.write'
  | 'filesystem.delete'
  | 'shell.execute'
  | 'execution.execute'
  | 'network.request'
  | 'github.read'
  | 'github.write'
  | 'github.merge'
  | 'database.read'
  | 'database.write'
  | 'database.admin'
  | 'deploy.execute'
  | 'secret.use'
  | 'browser.control'
  | 'mcp.use';

export interface PermissionRequest {
  capability: Capability;
  resource?: string;
  reason: string;
}

export interface PermissionPolicy {
  decide(request: PermissionRequest): PermissionDecision;
}

export const denyByDefault: PermissionPolicy = {
  decide: () => 'DENY',
};
