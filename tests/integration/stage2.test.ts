import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IdentityError, IdentityService } from '../../packages/identity/src/index.js';
import { SqliteDatabaseProvider } from '../../packages/persistence/src/index.js';
import { FileObjectStorage } from '../../packages/storage/src/index.js';

const dbFor = () => new SqliteDatabaseProvider();

describe('Stage 2 identity and persistence', () => {
  it('registers, authenticates, expires/revokes sessions, and isolates workspaces', () => {
    const db = dbFor(); const identity = new IdentityService(db, 60_000);
    const alice = identity.register('Alice@Example.com', 'correct horse battery');
    const bob = identity.register('bob@example.com', 'correct horse battery');
    const session = identity.login('alice@example.com', 'correct horse battery');
    expect(identity.authenticate(session.token)).toEqual(alice);
    const workspace = identity.createWorkspace(alice.id, 'Alice Workspace');
    const project = identity.createProject(alice.id, workspace.id, 'Alpha');
    identity.addMember(alice.id, workspace.id, bob.id, 'viewer');
    expect(identity.listProjects(bob.id, workspace.id)).toHaveLength(1);
    expect(() => identity.getProject(bob.id, project.id)).not.toThrow();
    const other = identity.createWorkspace(bob.id, 'Bob Workspace');
    expect(() => identity.listProjects(alice.id, other.id)).toThrowError(new IdentityError('FORBIDDEN'));
    identity.logout(session.token);
    expect(() => identity.authenticate(session.token)).toThrowError(new IdentityError('UNAUTHENTICATED'));
    expect(db.listEvents(workspace.id).map(e => e.type)).toEqual(['workspace.created','project.created','workspace.member_added']);
    expect(db.listAudit(workspace.id)).toHaveLength(3);
    db.close();
  });

  it('persists state across provider reopen', () => {
    const dir = mkdtempSync(join(tmpdir(), 'infinity-stage2-')); const file = join(dir, 'state.sqlite');
    const first = new SqliteDatabaseProvider(file); const user = first.createUser('persist@example.com', 'hash'); const workspace = first.createWorkspace('Persisted', user.id); first.createProject(workspace.id, 'Project'); first.close();
    const second = new SqliteDatabaseProvider(file); expect(second.findUserById(user.id)?.email).toBe('persist@example.com'); expect(second.listProjects(workspace.id)).toHaveLength(1); second.close(); rmSync(dir, { recursive:true, force:true });
  });

  it('provides durable job primitives and safe object storage', async () => {
    const db = dbFor(); const job = db.enqueueJob('example', { value: 1 }); const claimed = db.claimJob();
    expect(claimed?.id).toBe(job.id); expect(claimed?.status).toBe('running'); db.completeJob(job.id);
    const dir = mkdtempSync(join(tmpdir(), 'infinity-storage-')); const storage = new FileObjectStorage(dir); const saved = await storage.put('workspace/project/a.txt', new TextEncoder().encode('hello'), 'text/plain'); expect(await storage.get(saved.key)).toEqual(new TextEncoder().encode('hello')); await expect(storage.put('../escape', new Uint8Array([1]))).rejects.toThrow('INVALID_STORAGE_KEY'); await storage.delete(saved.key); expect(existsSync(join(dir,'workspace/project/a.txt'))).toBe(false); rmSync(dir,{recursive:true,force:true}); db.close();
  });
});
