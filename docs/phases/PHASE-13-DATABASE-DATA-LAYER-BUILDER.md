# Phase 13 — Database and Data Layer Builder

**Status:** IN PROGRESS
**Branch:** `phase-13-database-data-layer-builder`
**Baseline:** Phase 12 is closed on `main` and its final exact-head CI is green.

## Goal

Give INFINITY-11 a provider-independent database/data-layer builder that can turn an application data model into deterministic, reviewable schema, migration, seed, repository, and health-check contracts without coupling the product to Supabase or another vendor.

## Implemented boundary

- `packages/database` is the canonical database-builder package.
- Portable PostgreSQL and SQLite schema generation.
- Strict database/table/column/index/reference validation with fail-closed behavior.
- Deterministic table/index ordering and migration checksums.
- Safe identifier quoting and SQL-string escaping.
- Deterministic seed SQL generation with unknown-column rejection.
- Generated migration and seed file naming contracts.
- Repository interface contract generation.
- Database executor and transaction-executor boundaries.
- Dependency health-check contract with bounded diagnostic output.
- No database driver is forced into the core package; drivers remain adapters.

## Security and correctness boundary

The builder rejects invalid identifiers, duplicate schema objects, invalid references, unsupported types/dialects, unknown seed tables/columns, duplicate primary keys, and invalid indexes. It never accepts raw generated credentials. SQL defaults are explicitly supplied schema expressions rather than inferred secrets.

## Acceptance criteria

1. Application database specifications validate fail-closed.
2. PostgreSQL and SQLite output is deterministic for equivalent specifications.
3. Generated SQL is safely quoted and seed values are escaped.
4. Foreign-key references and indexes are checked against the declared schema.
5. Migration/seed metadata includes stable checksums.
6. Repository and execution contracts remain adapter-independent.
7. Health failures return explicit status without pretending success.
8. Earlier phases remain regression-safe.
9. Format, lint, typecheck, unit tests, build, dependency security, and secret scanning pass.
10. Documentation and roadmap status reflect verified repository evidence.

## Verification evidence

- Unit coverage: `tests/phase-13-database.test.ts`
- Package build: `packages/database/tsconfig.json`
- Root TypeScript build graph includes the database package.
- Final branch and post-merge main CI are required before closure.

## Completion gate

Phase 13 remains **IN PROGRESS** until its implementation branch is verified, merged, and the exact synchronized `main` head passes final CI.
