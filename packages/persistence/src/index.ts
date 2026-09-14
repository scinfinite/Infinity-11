import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@infinity-11/types';

export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface UserRecord { id: string; email: string; passwordHash: string; createdAt: string; }
export interface SessionRecord { id: string; userId: string; tokenHash: string; expiresAt: string; createdAt: string; }
export interface WorkspaceRecord { id: string; name: string; ownerId: string; createdAt: string; }
export interface MembershipRecord { workspaceId: string; userId: string; role: Role; createdAt: string; }
export interface ProjectRecord { id: string; workspaceId: string; name: string; createdAt: string; }
export interface AuditRecord { id: string; workspaceId: string; actorId: string; action: string; resourceType: string; resourceId: string; correlationId: string; occurredAt: string; metadataJson: string; }

export interface DatabaseProvider {
  migrate(): void;
  close(): void;
  transaction<T>(fn: () => T): T;
  createUser(email: string, passwordHash: string): UserRecord;
  findUserByEmail(email: string): UserRecord | undefined;
  createSession(userId: string, tokenHash: string, expiresAt: string): SessionRecord;
  findSessionByTokenHash(tokenHash: string): SessionRecord | undefined;
  revokeSession(sessionId: string): void;
  createWorkspace(name: string, ownerId: string): WorkspaceRecord;
  addMembership(workspaceId: string, userId: string, role: Role): MembershipRecord;
  getMembership(workspaceId: string, userId: string): MembershipRecord | undefined;
  createProject(workspaceId: string, name: string): ProjectRecord;
  getProject(projectId: string): ProjectRecord | undefined;
  listProjects(workspaceId: string): ProjectRecord[];
  appendEvent(event: DomainEvent, audit: Omit<AuditRecord, 'id' | 'occurredAt'>): void;
  listEvents(workspaceId: string): DomainEvent[];
  listAudit(workspaceId: string): AuditRecord[];
}

const now = () => new Date().toISOString();

export class SqliteDatabaseProvider implements DatabaseProvider {
  private readonly db: DatabaseSync;

  constructor(filename = ':memory:') {
    this.db = new DatabaseSync(filename);
    this.migrate();
  }

  migrate(): void {
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, revoked_at TEXT);
      CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS memberships (workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK(role IN ('owner','admin','member','viewer')), created_at TEXT NOT NULL, PRIMARY KEY(workspace_id,user_id));
      CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, name TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS domain_events (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, event_json TEXT NOT NULL, occurred_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, correlation_id TEXT NOT NULL, occurred_at TEXT NOT NULL, metadata_json TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_events_workspace ON domain_events(workspace_id, occurred_at);
      CREATE INDEX IF NOT EXISTS idx_audit_workspace ON audit_log(workspace_id, occurred_at);
    `);
  }

  close(): void { this.db.close(); }

  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const value = fn(); this.db.exec('COMMIT'); return value; } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }

  createUser(email: string, passwordHash: string): UserRecord {
    const record = { id: randomUUID(), email: email.trim().toLowerCase(), passwordHash, createdAt: now() };
    this.db.prepare('INSERT INTO users VALUES (?, ?, ?, ?)').run(record.id, record.email, record.passwordHash, record.createdAt);
    return record;
  }

  findUserByEmail(email: string): UserRecord | undefined {
    const row = this.db.prepare('SELECT id,email,password_hash AS passwordHash,created_at AS createdAt FROM users WHERE email = ?').get(email.trim().toLowerCase()) as UserRecord | undefined;
    return row;
  }

  createSession(userId: string, tokenHash: string, expiresAt: string): SessionRecord {
    const record = { id: randomUUID(), userId, tokenHash, expiresAt, createdAt: now() };
    this.db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?, ?, NULL)').run(record.id, record.userId, record.tokenHash, record.expiresAt, record.createdAt);
    return record;
  }

  findSessionByTokenHash(tokenHash: string): SessionRecord | undefined {
    const row = this.db.prepare('SELECT id,user_id AS userId,token_hash AS tokenHash,expires_at AS expiresAt,created_at AS createdAt FROM sessions WHERE token_hash = ? AND revoked_at IS NULL').get(tokenHash) as SessionRecord | undefined;
    if (!row || new Date(row.expiresAt).getTime() <= Date.now()) return undefined;
    return row;
  }

  revokeSession(sessionId: string): void { this.db.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').run(now(), sessionId); }

  createWorkspace(name: string, ownerId: string): WorkspaceRecord {
    const record = { id: randomUUID(), name: name.trim(), ownerId, createdAt: now() };
    this.db.prepare('INSERT INTO workspaces VALUES (?, ?, ?, ?)').run(record.id, record.name, record.ownerId, record.createdAt);
    this.addMembership(record.id, ownerId, 'owner');
    return record;
  }

  addMembership(workspaceId: string, userId: string, role: Role): MembershipRecord {
    const record = { workspaceId, userId, role, createdAt: now() };
    this.db.prepare('INSERT INTO memberships VALUES (?, ?, ?, ?) ON CONFLICT(workspace_id,user_id) DO UPDATE SET role=excluded.role').run(record.workspaceId, record.userId, record.role, record.createdAt);
    return record;
  }

  getMembership(workspaceId: string, userId: string): MembershipRecord | undefined {
    return this.db.prepare('SELECT workspace_id AS workspaceId,user_id AS userId,role,created_at AS createdAt FROM memberships WHERE workspace_id = ? AND user_id = ?').get(workspaceId, userId) as MembershipRecord | undefined;
  }

  createProject(workspaceId: string, name: string): ProjectRecord {
    const record = { id: randomUUID(), workspaceId, name: name.trim(), createdAt: now() };
    this.db.prepare('INSERT INTO projects VALUES (?, ?, ?, ?)').run(record.id, record.workspaceId, record.name, record.createdAt);
    return record;
  }

  getProject(projectId: string): ProjectRecord | undefined {
    return this.db.prepare('SELECT id,workspace_id AS workspaceId,name,created_at AS createdAt FROM projects WHERE id = ?').get(projectId) as ProjectRecord | undefined;
  }

  listProjects(workspaceId: string): ProjectRecord[] {
    return this.db.prepare('SELECT id,workspace_id AS workspaceId,name,created_at AS createdAt FROM projects WHERE workspace_id = ? ORDER BY created_at').all(workspaceId) as ProjectRecord[];
  }

  appendEvent(event: DomainEvent, audit: Omit<AuditRecord, 'id' | 'occurredAt'>): void {
    this.db.prepare('INSERT INTO domain_events VALUES (?, ?, ?, ?)').run(event.id, event.correlation.workspaceId ?? '', JSON.stringify(event), event.occurredAt);
    this.db.prepare('INSERT INTO audit_log VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), audit.workspaceId, audit.actorId, audit.action, audit.resourceType, audit.resourceId, audit.correlationId, now(), audit.metadataJson);
  }

  listEvents(workspaceId: string): DomainEvent[] {
    return (this.db.prepare('SELECT event_json AS eventJson FROM domain_events WHERE workspace_id = ? ORDER BY occurred_at').all(workspaceId) as Array<{eventJson: string}>).map(row => JSON.parse(row.eventJson) as DomainEvent);
  }

  listAudit(workspaceId: string): AuditRecord[] {
    return this.db.prepare('SELECT id,workspace_id AS workspaceId,actor_id AS actorId,action,resource_type AS resourceType,resource_id AS resourceId,correlation_id AS correlationId,occurred_at AS occurredAt,metadata_json AS metadataJson FROM audit_log WHERE workspace_id = ? ORDER BY occurred_at').all(workspaceId) as AuditRecord[];
  }
}
