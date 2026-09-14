-- Stage 2 canonical relational schema. Provider adapters may translate this schema to another database engine.
-- Timestamp: 2026-09-14 UTC. Immutable migration: corrective changes must use a new migration.

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS memberships (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','member','viewer')),
  created_at timestamptz NOT NULL,
  PRIMARY KEY (workspace_id,user_id)
);
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS domain_events (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL,
  event_json jsonb NOT NULL,
  occurred_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  correlation_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL,
  metadata_json jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships(user_id);
CREATE INDEX IF NOT EXISTS projects_workspace_idx ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS domain_events_workspace_idx ON domain_events(workspace_id,occurred_at);
CREATE INDEX IF NOT EXISTS audit_log_workspace_idx ON audit_log(workspace_id,occurred_at);

-- RLS is intentionally enabled at the database-policy adapter boundary.
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
