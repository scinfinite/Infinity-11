export type DatabaseDialect = 'postgres' | 'sqlite';
export type ColumnType = 'uuid' | 'text' | 'integer' | 'boolean' | 'timestamp' | 'json';

export interface ColumnSpec {
  name: string;
  type: ColumnType;
  nullable?: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  default?: string;
  references?: { table: string; column: string; onDelete?: 'cascade' | 'restrict' | 'set-null' };
}
export interface IndexSpec {
  name: string;
  columns: string[];
  unique?: boolean;
}
export interface TableSpec {
  name: string;
  columns: ColumnSpec[];
  indexes?: IndexSpec[];
}
export interface SeedRow {
  table: string;
  values: Record<string, string | number | boolean | null>;
}
export interface DatabaseSpec {
  id: string;
  dialect: DatabaseDialect;
  tables: TableSpec[];
  seeds?: SeedRow[];
  revision: number;
}
export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
}
export interface MigrationFile {
  path: string;
  sql: string;
  checksum: string;
}
export interface DatabasePlan {
  specId: string;
  revision: number;
  dialect: DatabaseDialect;
  migration: MigrationFile;
  seed: MigrationFile | null;
  schema: string;
  repositoryContract: string;
}

const idPattern = /^[a-z][a-z0-9_]{0,62}$/;
const columnTypes: ColumnType[] = ['uuid', 'text', 'integer', 'boolean', 'timestamp', 'json'];
const quoteIdent = (value: string, dialect: DatabaseDialect) =>
  dialect === 'postgres' ? `"${value.replace(/"/g, '""')}"` : `"${value.replace(/"/g, '""')}"`;
const sqlString = (value: string) => `'${value.replace(/'/g, "''")}'`;

export function validateDatabaseSpec(spec: DatabaseSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!idPattern.test(spec.id))
    issues.push({
      code: 'INVALID_DATABASE_ID',
      path: 'id',
      message:
        'Database id must be 1–63 lowercase letters, digits, or underscores and start with a letter.',
    });
  if (!['postgres', 'sqlite'].includes(spec.dialect))
    issues.push({
      code: 'UNSUPPORTED_DIALECT',
      path: 'dialect',
      message: `Unsupported database dialect: ${String(spec.dialect)}.`,
    });
  if (!Number.isInteger(spec.revision) || spec.revision < 1)
    issues.push({
      code: 'INVALID_REVISION',
      path: 'revision',
      message: 'Revision must be a positive integer.',
    });
  if (!spec.tables.length)
    issues.push({
      code: 'TABLES_REQUIRED',
      path: 'tables',
      message: 'At least one table is required.',
    });
  const tables = new Set<string>();
  for (const table of spec.tables) {
    if (!idPattern.test(table.name))
      issues.push({
        code: 'INVALID_TABLE_NAME',
        path: `tables.${table.name}`,
        message: `Invalid table name: ${table.name}.`,
      });
    if (tables.has(table.name))
      issues.push({
        code: 'DUPLICATE_TABLE',
        path: `tables.${table.name}`,
        message: `Duplicate table: ${table.name}.`,
      });
    tables.add(table.name);
    if (!table.columns.length)
      issues.push({
        code: 'COLUMNS_REQUIRED',
        path: `tables.${table.name}`,
        message: 'Every table requires at least one column.',
      });
    const columns = new Set<string>();
    let primaryKeys = 0;
    for (const column of table.columns) {
      if (!idPattern.test(column.name))
        issues.push({
          code: 'INVALID_COLUMN_NAME',
          path: `tables.${table.name}.${column.name}`,
          message: `Invalid column name: ${column.name}.`,
        });
      if (columns.has(column.name))
        issues.push({
          code: 'DUPLICATE_COLUMN',
          path: `tables.${table.name}.${column.name}`,
          message: `Duplicate column: ${column.name}.`,
        });
      columns.add(column.name);
      if (!columnTypes.includes(column.type))
        issues.push({
          code: 'UNSUPPORTED_COLUMN_TYPE',
          path: `tables.${table.name}.${column.name}`,
          message: `Unsupported column type: ${String(column.type)}.`,
        });
      if (column.primaryKey) primaryKeys++;
      if (column.references && !idPattern.test(column.references.table))
        issues.push({
          code: 'INVALID_REFERENCE_TABLE',
          path: `tables.${table.name}.${column.name}`,
          message: 'Referenced table name is invalid.',
        });
      if (column.references && !idPattern.test(column.references.column))
        issues.push({
          code: 'INVALID_REFERENCE_COLUMN',
          path: `tables.${table.name}.${column.name}`,
          message: 'Referenced column name is invalid.',
        });
    }
    if (primaryKeys > 1)
      issues.push({
        code: 'MULTIPLE_PRIMARY_KEYS',
        path: `tables.${table.name}`,
        message: 'A table may declare at most one primary key column in the portable contract.',
      });
    for (const index of table.indexes ?? []) {
      if (!idPattern.test(index.name))
        issues.push({
          code: 'INVALID_INDEX_NAME',
          path: `tables.${table.name}.indexes`,
          message: `Invalid index name: ${index.name}.`,
        });
      if (!index.columns.length)
        issues.push({
          code: 'INDEX_COLUMNS_REQUIRED',
          path: `tables.${table.name}.indexes.${index.name}`,
          message: 'An index must contain at least one column.',
        });
      for (const column of index.columns)
        if (!columns.has(column))
          issues.push({
            code: 'INDEX_COLUMN_UNKNOWN',
            path: `tables.${table.name}.indexes.${index.name}`,
            message: `Index references unknown column: ${column}.`,
          });
    }
  }
  const tableNames = new Set(spec.tables.map((t) => t.name));
  for (const table of spec.tables)
    for (const column of table.columns) {
      if (column.references && !tableNames.has(column.references.table))
        issues.push({
          code: 'REFERENCE_TABLE_UNKNOWN',
          path: `tables.${table.name}.${column.name}`,
          message: `Referenced table does not exist: ${column.references.table}.`,
        });
    }
  for (const seed of spec.seeds ?? [])
    if (!tableNames.has(seed.table))
      issues.push({
        code: 'SEED_TABLE_UNKNOWN',
        path: 'seeds',
        message: `Seed references unknown table: ${seed.table}.`,
      });
  return issues;
}

function typeSql(type: ColumnType, dialect: DatabaseDialect): string {
  if (type === 'uuid') return dialect === 'postgres' ? 'UUID' : 'TEXT';
  if (type === 'integer') return 'INTEGER';
  if (type === 'boolean') return dialect === 'postgres' ? 'BOOLEAN' : 'INTEGER';
  if (type === 'timestamp') return dialect === 'postgres' ? 'TIMESTAMPTZ' : 'TEXT';
  if (type === 'json') return dialect === 'postgres' ? 'JSONB' : 'TEXT';
  return 'TEXT';
}

function columnSql(column: ColumnSpec, dialect: DatabaseDialect): string {
  const parts = [quoteIdent(column.name, dialect), typeSql(column.type, dialect)];
  if (column.primaryKey) parts.push('PRIMARY KEY');
  if (column.unique) parts.push('UNIQUE');
  if (column.nullable !== true) parts.push('NOT NULL');
  if (column.default !== undefined) parts.push(`DEFAULT ${column.default}`);
  if (column.references) {
    parts.push(
      `REFERENCES ${quoteIdent(column.references.table, dialect)} (${quoteIdent(column.references.column, dialect)})`,
    );
    if (column.references.onDelete)
      parts.push(`ON DELETE ${column.references.onDelete.toUpperCase()}`);
  }
  return parts.join(' ');
}

export function generateSchemaSql(spec: DatabaseSpec): string {
  const issues = validateDatabaseSpec(spec);
  if (issues.length)
    throw new Error(`Invalid database specification: ${issues.map((i) => i.code).join(', ')}`);
  const lines: string[] = [
    '-- Generated by INFINITY-11 Database and Data Layer Builder.',
    '-- Review and execute through the migration runner; do not hand-edit generated checksums.',
    '',
  ];
  for (const table of [...spec.tables].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`CREATE TABLE ${quoteIdent(table.name, spec.dialect)} (`);
    lines.push(table.columns.map((column) => `  ${columnSql(column, spec.dialect)}`).join(',\n'));
    lines.push(');', '');
    for (const index of [...(table.indexes ?? [])].sort((a, b) => a.name.localeCompare(b.name))) {
      lines.push(
        `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${quoteIdent(index.name, spec.dialect)} ON ${quoteIdent(table.name, spec.dialect)} (${index.columns.map((c) => quoteIdent(c, spec.dialect)).join(', ')});`,
        '',
      );
    }
  }
  return lines.join('\n');
}

function valueSql(value: string | number | boolean | null): string {
  if (value === null) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return sqlString(value);
}
export function generateSeedSql(spec: DatabaseSpec): string {
  const seeds = [...(spec.seeds ?? [])];
  if (!seeds.length) return '';
  const tableMap = new Map(spec.tables.map((t) => [t.name, t]));
  const lines = ['-- Generated deterministic seed data.'];
  for (const seed of seeds) {
    const table = tableMap.get(seed.table);
    if (!table) throw new Error(`Unknown seed table: ${seed.table}`);
    const keys = Object.keys(seed.values).sort();
    for (const key of keys)
      if (!table.columns.some((c) => c.name === key))
        throw new Error(`Unknown seed column: ${seed.table}.${key}`);
    lines.push(
      `INSERT INTO ${quoteIdent(seed.table, spec.dialect)} (${keys.map((k) => quoteIdent(k, spec.dialect)).join(', ')}) VALUES (${keys.map((k) => valueSql(seed.values[k])).join(', ')});`,
    );
  }
  return lines.join('\n') + '\n';
}

function stableHash(input: string): string {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 16777619);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0');
}
export function buildDatabasePlan(spec: DatabaseSpec): DatabasePlan {
  const normalized: DatabaseSpec = {
    ...spec,
    id: spec.id.trim().toLowerCase(),
    tables: [...spec.tables]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({
        ...t,
        columns: [...t.columns],
        indexes: [...(t.indexes ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
      })),
  };
  const issues = validateDatabaseSpec(normalized);
  if (issues.length)
    throw new Error(`Invalid database specification: ${issues.map((i) => i.code).join(', ')}`);
  const schema = generateSchemaSql(normalized);
  const checksum = stableHash(schema);
  const migration = {
    path: `supabase/migrations/${String(normalized.revision).padStart(4, '0')}_${normalized.id}.sql`,
    sql: schema,
    checksum,
  };
  const seedSql = generateSeedSql(normalized);
  const seed = seedSql
    ? {
        path: `supabase/seed/${String(normalized.revision).padStart(4, '0')}_${normalized.id}.sql`,
        sql: seedSql,
        checksum: stableHash(seedSql),
      }
    : null;
  const repositoryContract = `export interface ${normalized.id.replace(/(^|_)(\w)/g, (_, a, b) => b.toUpperCase())}Repository {\n  findById(id: string): Promise<unknown | null>;\n  create(input: unknown): Promise<unknown>;\n  update(id: string, input: unknown): Promise<unknown>;\n  delete(id: string): Promise<void>;\n}`;
  return {
    specId: normalized.id,
    revision: normalized.revision,
    dialect: normalized.dialect,
    migration,
    seed,
    schema,
    repositoryContract,
  };
}

export interface DatabaseExecutor {
  execute(sql: string, params?: readonly unknown[]): Promise<unknown>;
}
export interface TransactionExecutor extends DatabaseExecutor {
  transaction<T>(work: (tx: DatabaseExecutor) => Promise<T>): Promise<T>;
}
export interface DatabaseHealth {
  ok: boolean;
  latencyMs: number;
  dialect: DatabaseDialect;
  error?: string;
}
export async function checkDatabaseHealth(
  executor: DatabaseExecutor,
  dialect: DatabaseDialect,
): Promise<DatabaseHealth> {
  const started = Date.now();
  try {
    await executor.execute('SELECT 1');
    return { ok: true, latencyMs: Date.now() - started, dialect };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      dialect,
      error: error instanceof Error ? error.message : 'Database health check failed.',
    };
  }
}
