import { describe, expect, it } from 'vitest';
import { buildContextPack, createProjectBrain, detectLanguage, KnowledgeStore } from '../packages/knowledge/src/index.js';
import { MemoryStore, memoryFromLesson } from '../packages/memory/src/index.js';

describe('Stage 8 Project Brain', () => {
  it('detects supported languages', () => {
    expect(detectLanguage('src/App.tsx')).toBe('typescript');
    expect(detectLanguage('src/Main.java')).toBe('java');
    expect(detectLanguage('scripts/build.sh')).toBe('shell');
    expect(detectLanguage('README')).toBe('unknown');
  });

  it('indexes files, symbols, imports and tests', () => {
    const brain = createProjectBrain('p1','repo1','abc',[{
      path:'src/app.ts', content:"import { helper } from './helper';\nexport function run(): void { helper(); }"
    }, { path:'src/app.test.ts', content:"import { run } from './app';\ntest('run', () => run());" }]);
    expect(brain.index.files).toHaveLength(2);
    expect(brain.index.symbols.some(s=>s.name==='run' && s.exported)).toBe(true);
    expect(brain.index.dependencies).toContainEqual({from:'src/app.ts',to:'./helper',kind:'require'});
    expect(brain.index.files.find(f=>f.path.endsWith('.test.ts'))?.tests).toBe(true);
  });

  it('ranks knowledge and enforces context budgets with provenance', () => {
    const store = new KnowledgeStore();
    store.upsert({id:'a',category:'decision',title:'Database decision',content:'Use durable event storage',source:{sourceId:'architecture',path:'docs/architecture.md'},tags:['database'],importance:1,updatedAt:new Date().toISOString()});
    store.upsert({id:'b',category:'lesson',title:'Failed retry',content:'Never replay destructive side effects',source:{sourceId:'verification',path:'tests.md'},tags:['recovery'],importance:.9,updatedAt:new Date().toISOString()});
    const pack = buildContextPack(store,{text:'database durable'}, {maxItems:2,maxCharacters:100});
    expect(pack.items[0]?.item.id).toBe('a');
    expect(pack.provenance).toEqual([{sourceId:'architecture',categories:['decision']}]);
    expect(pack.includedCharacters).toBeLessThanOrEqual(100);
  });
});

describe('Stage 8 Memory', () => {
  it('isolates project memory, ranks it, and prunes expiry', () => {
    const store = new MemoryStore();
    const lesson = memoryFromLesson('p1','Use idempotency for external side effects','verify-1');
    store.put(lesson);
    store.put({...lesson,id:'other',projectId:'p2'});
    expect(store.search({projectId:'p1',text:'idempotency side effects'})).toHaveLength(1);
    expect(store.list('p2')).toHaveLength(1);
    store.put({...lesson,id:'expired',expiresAt:'2020-01-01T00:00:00.000Z'});
    expect(store.prune(new Date('2026-01-01'))).toBe(1);
  });
});
