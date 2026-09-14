import { describe, expect, it } from 'vitest';
import { IdentityError, IdentityService } from '../../packages/identity/src/index.js';
import { SqliteDatabaseProvider } from '../../packages/persistence/src/index.js';

describe('Stage 2 security boundaries', () => {
  it('never stores plaintext session tokens or passwords', () => {
    const db = new SqliteDatabaseProvider();
    const identity = new IdentityService(db);
    const user = identity.register('secret@example.com', 'very strong password');
    const session = identity.login('secret@example.com', 'very strong password');
    const rawUser = db.findUserById(user.id);
    const rawSession = db.findSessionByTokenHash(session.token);
    expect(rawUser?.passwordHash).not.toContain('very strong password');
    expect(rawSession).toBeUndefined();
    expect(identity.authenticate(session.token).id).toBe(user.id);
    db.close();
  });

  it('rejects cross-workspace reads and privileged membership changes', () => {
    const db = new SqliteDatabaseProvider();
    const identity = new IdentityService(db);
    const owner = identity.register('owner@example.com', 'owner password 123');
    const stranger = identity.register('stranger@example.com', 'stranger password');
    const workspace = identity.createWorkspace(owner.id, 'Owner');
    const foreign = identity.createWorkspace(stranger.id, 'Foreign');
    expect(() => identity.listProjects(stranger.id, workspace.id)).toThrowError(
      new IdentityError('FORBIDDEN'),
    );
    expect(() => identity.addMember(stranger.id, workspace.id, owner.id, 'member')).toThrowError(
      new IdentityError('FORBIDDEN'),
    );
    expect(() => identity.getProject(owner.id, foreign.id)).toThrow();
    db.close();
  });
});
