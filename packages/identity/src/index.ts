import { createHash, randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import type { CorrelationContext, DomainEvent } from '@infinity-11/types';
import type { DatabaseProvider, ProjectRecord, Role, UserRecord, WorkspaceRecord } from '@infinity-11/persistence';

export class IdentityError extends Error {
  constructor(public readonly code: 'INVALID_INPUT' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'CONFLICT' | 'NOT_FOUND') { super(code); this.name = 'IdentityError'; }
}
export interface AuthSession { sessionId: string; userId: string; token: string; expiresAt: string; }
export interface AuthenticatedUser { id: string; email: string; }
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const assertEmail = (email: string) => { if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new IdentityError('INVALID_INPUT'); };
const hashPassword = (password: string) => { if (password.length < 12) throw new IdentityError('INVALID_INPUT'); const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`; };
const verifyPassword = (password: string, stored: string) => { const [salt, hash] = stored.split(':'); if (!salt || !hash) return false; const expected = Buffer.from(hash, 'hex'); const actual = scryptSync(password, salt, expected.length); return expected.length === actual.length && timingSafeEqual(expected, actual); };
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const correlation = (userId: string, workspaceId?: string, projectId?: string): CorrelationContext => ({ correlationId: randomUUID(), actorId: userId, workspaceId, projectId });

export class IdentityService {
  constructor(private readonly db: DatabaseProvider, private readonly sessionTtlMs = 1000 * 60 * 60 * 24 * 7) {}
  register(email: string, password: string): AuthenticatedUser { const normalized=normalizeEmail(email); assertEmail(normalized); if(this.db.findUserByEmail(normalized)) throw new IdentityError('CONFLICT'); const user=this.db.createUser(normalized,hashPassword(password)); return {id:user.id,email:user.email}; }
  login(email: string, password: string): AuthSession { const user=this.db.findUserByEmail(normalizeEmail(email)); if(!user || !verifyPassword(password,user.passwordHash)) throw new IdentityError('UNAUTHENTICATED'); const token=randomBytes(32).toString('base64url'); const expiresAt=new Date(Date.now()+this.sessionTtlMs).toISOString(); const session=this.db.createSession(user.id,hashToken(token),expiresAt); return {sessionId:session.id,userId:session.userId,token,expiresAt}; }
  authenticate(token: string): AuthenticatedUser { if(!token) throw new IdentityError('UNAUTHENTICATED'); const session=this.db.findSessionByTokenHash(hashToken(token)); if(!session) throw new IdentityError('UNAUTHENTICATED'); const user=this.db.findUserById(session.userId); if(!user) throw new IdentityError('UNAUTHENTICATED'); return {id:user.id,email:user.email}; }
  logout(token: string): void { const session=this.db.findSessionByTokenHash(hashToken(token)); if(session)this.db.revokeSession(session.id); }
  createWorkspace(userId:string,name:string):WorkspaceRecord { this.requireName(name); return this.db.transaction(()=>{const workspace=this.db.createWorkspace(name,userId); this.emit(userId,workspace.id,undefined,'workspace.created',workspace.id,{name:workspace.name}); return workspace;}); }
  addMember(actorId:string,workspaceId:string,userId:string,role:Exclude<Role,'owner'>):void { this.requireRole(actorId,workspaceId,['owner','admin']); this.db.addMembership(workspaceId,userId,role); this.emit(actorId,workspaceId,undefined,'workspace.member_added',userId,{role}); }
  createProject(userId:string,workspaceId:string,name:string):ProjectRecord { this.requireName(name); this.requireRole(userId,workspaceId,['owner','admin','member']); return this.db.transaction(()=>{const project=this.db.createProject(workspaceId,name); this.emit(userId,workspaceId,project.id,'project.created',project.id,{name:project.name}); return project;}); }
  getProject(userId:string,projectId:string):ProjectRecord { const project=this.db.getProject(projectId); if(!project)throw new IdentityError('NOT_FOUND'); this.requireRole(userId,project.workspaceId,['owner','admin','member','viewer']); return project; }
  listProjects(userId:string,workspaceId:string):ProjectRecord[] { this.requireRole(userId,workspaceId,['owner','admin','member','viewer']); return this.db.listProjects(workspaceId); }
  private requireRole(userId:string,workspaceId:string,allowed:Role[]):void { const membership=this.db.getMembership(workspaceId,userId); if(!membership || !allowed.includes(membership.role))throw new IdentityError('FORBIDDEN'); }
  private requireName(name:string):void { if(!name.trim() || name.trim().length>120)throw new IdentityError('INVALID_INPUT'); }
  private emit(actorId:string,workspaceId:string,projectId:string|undefined,type:string,resourceId:string,payload:Record<string,unknown>):void { const event:DomainEvent={id:randomUUID(),type,version:1,occurredAt:new Date().toISOString(),correlation:correlation(actorId,workspaceId,projectId),payload}; this.db.appendEvent(event,{workspaceId,actorId,action:type,resourceType:type.split('.')[0]??'unknown',resourceId,correlationId:event.correlation.correlationId,metadataJson:JSON.stringify(payload)}); }
}
export { hashToken, hashPassword, verifyPassword };
