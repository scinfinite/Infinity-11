# Stage 1 migration/versioning conventions

Stage 1 establishes conventions without introducing product persistence yet.

## Package versions

- The repository is a pnpm workspace.
- Node.js is pinned to the supported major/minor range in the root `package.json`.
- Direct dependencies are pinned to exact versions in the root toolchain manifest.
- Workspace package dependencies use `workspace:*` so internal package boundaries cannot silently resolve to an external package.
- `pnpm-lock.yaml` is committed and is the canonical dependency-resolution snapshot.
- CI uses `pnpm install --frozen-lockfile` so dependency resolution cannot silently drift.

## Database migrations

- Stage 1 does not create product tables.
- Future migrations live under `supabase/migrations/` and are append-only once applied.
- Migration filenames must begin with a UTC timestamp followed by a short immutable description.
- Applied migrations must never be edited in place; corrective changes use a new migration.
- Destructive or data-loss migrations require explicit review and a documented rollback/mitigation strategy.
- Schema changes must remain compatible with the application's deployed version during rolling upgrades where applicable.

## Contract versioning

- Shared contracts are versioned explicitly.
- Domain events carry a schema version.
- Breaking API/event changes require a new version rather than silently changing an existing contract.
- Provider-specific fields remain adapter-owned and must not leak into core contracts.
