export type Language =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'kotlin'
  | 'swift'
  | 'dart'
  | 'sql'
  | 'shell'
  | 'html'
  | 'css'
  | 'unknown';

export type KnowledgeCategory =
  | 'requirement'
  | 'architecture'
  | 'decision'
  | 'convention'
  | 'dependency'
  | 'symbol'
  | 'test'
  | 'bug'
  | 'security'
  | 'deployment'
  | 'agent'
  | 'lesson'
  | 'document'
  | 'source';

export interface SourceRef {
  sourceId: string;
  path?: string;
  lineStart?: number;
  lineEnd?: number;
}

export interface KnowledgeItem {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  source: SourceRef;
  tags: string[];
  importance: number;
  updatedAt: string;
}

export interface SymbolRecord {
  id: string;
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'method' | 'variable' | 'unknown';
  path: string;
  language: Language;
  line: number;
  exported: boolean;
}

export interface DependencyEdge {
  from: string;
  to: string;
  kind: 'import' | 'require' | 'extends' | 'implements' | 'package';
}

export interface FileRecord {
  path: string;
  language: Language;
  size: number;
  hash: string;
  imports: string[];
  symbols: SymbolRecord[];
  tests: boolean;
}

export interface RepositoryIndex {
  repositoryId: string;
  revision: string;
  files: FileRecord[];
  symbols: SymbolRecord[];
  dependencies: DependencyEdge[];
  detectedLanguages: Array<{ language: Language; files: number }>;
  generatedAt: string;
}

export interface ProjectBrain {
  projectId: string;
  revision: string;
  summary: string;
  requirements: KnowledgeItem[];
  decisions: KnowledgeItem[];
  lessons: KnowledgeItem[];
  risks: KnowledgeItem[];
  conventions: KnowledgeItem[];
  index: RepositoryIndex;
  updatedAt: string;
}

export interface RetrievalQuery {
  text: string;
  categories?: KnowledgeCategory[];
  paths?: string[];
  limit?: number;
}

export interface RetrievalResult {
  item: KnowledgeItem;
  score: number;
  matchedTerms: string[];
}

export interface ContextBudget {
  maxItems: number;
  maxCharacters: number;
}

export interface ContextPack {
  items: RetrievalResult[];
  includedCharacters: number;
  omittedCount: number;
  provenance: Array<{ sourceId: string; categories: KnowledgeCategory[] }>;
}

const EXTENSIONS: Record<string, Language> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.c': 'c',
  '.h': 'c',
  '.cc': 'cpp',
  '.cpp': 'cpp',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.php': 'php',
  '.rb': 'ruby',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.swift': 'swift',
  '.dart': 'dart',
  '.sql': 'sql',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.html': 'html',
  '.css': 'css',
};

export function detectLanguage(path: string): Language {
  const dot = path.lastIndexOf('.');
  return dot >= 0 ? (EXTENSIONS[path.slice(dot).toLowerCase()] ?? 'unknown') : 'unknown';
}

function hashContent(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function lineOf(text: string, offset: number): number {
  return text.slice(0, offset).split('\n').length;
}

function extractSymbols(path: string, text: string, language: Language): SymbolRecord[] {
  const patterns: Array<[RegExp, SymbolRecord['kind']]> =
    language === 'python'
      ? [
          [/^\s*(?:async\s+)?def\s+([A-Za-z_$][\w$]*)/gm, 'function'],
          [/^\s*class\s+([A-Za-z_$][\w$]*)/gm, 'class'],
        ]
      : language === 'java'
        ? [
            [/\bclass\s+([A-Za-z_$][\w$]*)/g, 'class'],
            [/\binterface\s+([A-Za-z_$][\w$]*)/g, 'interface'],
            [
              /(?:public|private|protected|static|final|abstract|synchronized|native|\s)+[A-Za-z0-9_<> ,?]+\s+([A-Za-z_$][\w$]*)\s*\(/g,
              'method',
            ],
          ]
        : [
            [/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g, 'function'],
            [/(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/g, 'class'],
            [/(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/g, 'interface'],
            [/(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*=/g, 'type'],
          ];

  const symbols: SymbolRecord[] = [];
  for (const [pattern, kind] of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text))) {
      const name = match[1];
      if (!name) continue;
      symbols.push({
        id: `${path}:${lineOf(text, match.index)}:${name}`,
        name,
        kind,
        path,
        language,
        line: lineOf(text, match.index),
        exported: /\bexport\b/.test(text.slice(Math.max(0, match.index - 16), match.index + 16)),
      });
    }
  }
  return symbols;
}

function extractImports(text: string, language: Language): string[] {
  const patterns: RegExp[] =
    language === 'python'
      ? [/^\s*import\s+([^\s#]+)/gm, /^\s*from\s+([^\s]+)\s+import/gm]
      : language === 'java'
        ? [/^\s*import\s+([^;]+);/gm]
        : language === 'go'
          ? [/^\s*import\s+["']([^"']+)["']/gm]
          : [
              /\bimport\s+(?:[^'"\n]+from\s+)?["']([^"']+)["']/g,
              /\brequire\(\s*["']([^"']+)["']\s*\)/g,
            ];
  const imports: string[] = [];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text))) if (match[1]) imports.push(match[1]);
  }
  return [...new Set(imports)];
}

export function indexRepository(
  repositoryId: string,
  revision: string,
  files: Array<{ path: string; content: string }>,
): RepositoryIndex {
  const records: FileRecord[] = [];
  const symbols: SymbolRecord[] = [];
  const dependencies: DependencyEdge[] = [];

  for (const file of files) {
    const language = detectLanguage(file.path);
    const imports = extractImports(file.content, language);
    const fileSymbols = extractSymbols(file.path, file.content, language);
    records.push({
      path: file.path,
      language,
      size: file.content.length,
      hash: hashContent(file.content),
      imports,
      symbols: fileSymbols,
      tests: /(^|[/_.-])(test|tests|spec|specs)([/_.-]|$)/i.test(file.path),
    });
    symbols.push(...fileSymbols);
    for (const target of imports)
      dependencies.push({ from: file.path, to: target, kind: 'import' });
  }

  const counts = new Map<Language, number>();
  for (const file of records) {
    if (file.language !== 'unknown')
      counts.set(file.language, (counts.get(file.language) ?? 0) + 1);
  }

  return {
    repositoryId,
    revision,
    files: records,
    symbols,
    dependencies,
    detectedLanguages: [...counts]
      .map(([language, files]) => ({ language, files }))
      .sort((a, b) => b.files - a.files),
    generatedAt: new Date().toISOString(),
  };
}

export class KnowledgeStore {
  private readonly items = new Map<string, KnowledgeItem>();

  upsert(item: KnowledgeItem): void {
    this.items.set(item.id, { ...item, tags: [...new Set(item.tags)] });
  }

  remove(id: string): boolean {
    return this.items.delete(id);
  }

  get(id: string): KnowledgeItem | undefined {
    return this.items.get(id);
  }

  all(): KnowledgeItem[] {
    return [...this.items.values()];
  }

  search(query: RetrievalQuery): RetrievalResult[] {
    const terms = query.text
      .toLowerCase()
      .split(/[^a-z0-9_$.-]+/)
      .filter((term) => term.length > 1);
    const results: RetrievalResult[] = [];
    for (const item of this.items.values()) {
      if (query.categories && !query.categories.includes(item.category)) continue;
      if (query.paths && !query.paths.some((path) => item.source.path?.startsWith(path))) continue;
      const haystack = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
      const matchedTerms = terms.filter((term) => haystack.includes(term));
      if (!matchedTerms.length) continue;
      results.push({
        item,
        matchedTerms,
        score: (matchedTerms.length / Math.max(1, terms.length)) * 0.75 + item.importance * 0.25,
      });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, query.limit ?? 10);
  }
}

export function buildContextPack(
  store: KnowledgeStore,
  query: RetrievalQuery,
  budget: ContextBudget,
): ContextPack {
  const ranked = store.search({
    ...query,
    limit: Math.max(query.limit ?? budget.maxItems, budget.maxItems * 2),
  });
  const items: RetrievalResult[] = [];
  let characters = 0;
  for (const result of ranked) {
    if (items.length >= budget.maxItems) break;
    if (characters + result.item.content.length > budget.maxCharacters) continue;
    items.push(result);
    characters += result.item.content.length;
  }

  const sourceIds = [...new Set(items.map((result) => result.item.source.sourceId))];
  const provenance = sourceIds.map((sourceId) => ({
    sourceId,
    categories: [
      ...new Set(
        items
          .filter((result) => result.item.source.sourceId === sourceId)
          .map((result) => result.item.category),
      ),
    ],
  }));

  return {
    items,
    includedCharacters: characters,
    omittedCount: Math.max(0, ranked.length - items.length),
    provenance,
  };
}

export function createProjectBrain(
  projectId: string,
  repositoryId: string,
  revision: string,
  files: Array<{ path: string; content: string }>,
): ProjectBrain {
  return {
    projectId,
    revision,
    summary: `Project ${projectId} at revision ${revision}`,
    requirements: [],
    decisions: [],
    lessons: [],
    risks: [],
    conventions: [],
    index: indexRepository(repositoryId, revision, files),
    updatedAt: new Date().toISOString(),
  };
}
