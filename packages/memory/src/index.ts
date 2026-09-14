export type MemoryType = 'conversation' | 'preference' | 'decision' | 'fact' | 'lesson' | 'success' | 'failure';
export interface MemoryRecord {
  id: string; projectId: string; type: MemoryType; content: string; tags: string[];
  source: { kind: 'user' | 'agent' | 'workflow' | 'verification'; ref: string };
  confidence: number; importance: number; createdAt: string; updatedAt: string;
  expiresAt?: string;
}
export interface MemoryQuery { projectId: string; text: string; types?: MemoryType[]; limit?: number; }

export class MemoryStore {
  private records = new Map<string, MemoryRecord>();
  put(record: MemoryRecord): void { this.records.set(record.id, {...record, tags:[...new Set(record.tags)]}); }
  get(id: string): MemoryRecord | undefined { return this.records.get(id); }
  delete(id: string): boolean { return this.records.delete(id); }
  list(projectId: string): MemoryRecord[] { return [...this.records.values()].filter(r=>r.projectId===projectId); }
  search(query: MemoryQuery): MemoryRecord[] {
    const terms = query.text.toLowerCase().split(/\W+/).filter(t=>t.length>1);
    return this.list(query.projectId).filter(r=>!query.types || query.types.includes(r.type))
      .map(r=>({r,score:terms.reduce((n,t)=>n+(r.content.toLowerCase().includes(t)?1:0),0)*r.confidence*r.importance}))
      .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,query.limit??10).map(x=>x.r);
  }
  prune(now = new Date()): number {
    let removed=0; for (const [id,r] of this.records) if (r.expiresAt && new Date(r.expiresAt) <= now) { this.records.delete(id); removed++; } return removed;
  }
}

export function memoryFromLesson(projectId: string, content: string, sourceRef: string, importance=0.8): MemoryRecord {
  const now = new Date().toISOString();
  return { id:`lesson:${projectId}:${sourceRef}`, projectId, type:'lesson', content, tags:['engineering'], source:{kind:'verification',ref:sourceRef}, confidence:1, importance, createdAt:now, updatedAt:now };
}
