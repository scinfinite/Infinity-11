import { describe, expect, it } from 'vitest';
import {
  buildDatabasePlan,
  checkDatabaseHealth,
  generateSeedSql,
  generateSchemaSql,
  validateDatabaseSpec,
  type DatabaseSpec,
} from '../packages/database/src/index';

const spec: DatabaseSpec = {
  id: 'tasks',
  dialect: 'postgres',
  revision: 1,
  tables: [
    {
      name: 'tasks',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
        { name: 'title', type: 'text' },
        { name: 'done', type: 'boolean', default: 'FALSE' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
      indexes: [{ name: 'tasks_title_idx', columns: ['title'] }],
    },
  ],
  seeds: [{ table: 'tasks', values: { title: 'first', done: false } }],
};

describe('Phase 13 database builder', () => {
  it('validates and deterministically generates a portable schema', () => {
    expect(validateDatabaseSpec(spec)).toEqual([]);
    const first = buildDatabasePlan(spec);
    const second = buildDatabasePlan({ ...spec, tables: [...spec.tables].reverse() });
    expect(first.schema).toBe(second.schema);
    expect(first.migration.checksum).toBe(second.migration.checksum);
    expect(first.schema).toContain('CREATE TABLE "tasks"');
    expect(first.schema).toContain('PRIMARY KEY');
  });

  it('fails closed for duplicate tables, unknown index columns, and unknown references', () => {
    const invalid = {
      ...spec,
      tables: [
        ...spec.tables,
        { name: 'tasks', columns: [{ name: 'id', type: 'uuid' as const }] },
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid' as const },
            {
              name: 'owner',
              type: 'uuid' as const,
              references: { table: 'missing', column: 'id' },
            },
          ],
        },
      ],
    };
    const issues = validateDatabaseSpec(invalid);
    expect(issues.some((i) => i.code === 'DUPLICATE_TABLE')).toBe(true);
    expect(issues.some((i) => i.code === 'REFERENCE_TABLE_UNKNOWN')).toBe(true);
    expect(() => generateSchemaSql(invalid)).toThrow(/Invalid database specification/);
  });

  it('rejects unsafe seed columns and emits escaped deterministic seed SQL', () => {
    expect(generateSeedSql(spec)).toContain("'first'");
    expect(generateSeedSql(spec)).toContain('FALSE');
    expect(() =>
      generateSeedSql({ ...spec, seeds: [{ table: 'tasks', values: { nope: 'x' } }] }),
    ).toThrow(/Unknown seed column/);

    const reordered = {
      ...spec,
      seeds: [
        { table: 'tasks', values: { title: "O'Reilly", done: true } },
        { table: 'tasks', values: { title: 'first', done: false } },
      ],
    };
    const reversed = { ...reordered, seeds: [...reordered.seeds].reverse() };
    expect(generateSeedSql(reordered)).toBe(generateSeedSql(reversed));
    expect(generateSeedSql(reordered)).toContain("'O''Reilly'");
    expect(() =>
      generateSeedSql({ ...spec, seeds: [{ table: 'tasks', values: { done: Number.NaN } }] }),
    ).toThrow(/finite/);
  });

  it('rejects an impossible ON DELETE SET NULL relationship', () => {
    const invalid: DatabaseSpec = {
      ...spec,
      tables: [
        {
          name: 'users',
          columns: [{ name: 'id', type: 'uuid', primaryKey: true }],
        },
        {
          name: 'tasks',
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true },
            {
              name: 'owner_id',
              type: 'uuid',
              references: { table: 'users', column: 'id', onDelete: 'set-null' },
            },
          ],
        },
      ],
    };
    expect(validateDatabaseSpec(invalid).some((i) => i.code === 'SET_NULL_REQUIRES_NULLABLE')).toBe(
      true,
    );
  });

  it('reports dependency health without leaking executor internals', async () => {
    const ok = await checkDatabaseHealth({ execute: async () => undefined }, 'sqlite');
    expect(ok.ok).toBe(true);
    const failed = await checkDatabaseHealth(
      {
        execute: async () => {
          throw new Error('connection refused');
        },
      },
      'postgres',
    );
    expect(failed.ok).toBe(false);
    expect(failed.error).toBe('connection refused');

    const unsupported = await checkDatabaseHealth({ execute: async () => undefined }, 'mysql' as never);
    expect(unsupported.ok).toBe(false);
    expect(unsupported.error).toContain('Unsupported database dialect');
  });
});
