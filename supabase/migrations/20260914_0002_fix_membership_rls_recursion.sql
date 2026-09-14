-- Corrective migration: replace recursive membership policy evaluation with a security-definer helper.
-- Timestamp: 2026-09-14 UTC. Do not edit migration 0001.

DROP POLICY IF EXISTS membership_isolation ON memberships;
DROP POLICY IF EXISTS project_isolation ON projects;
DROP POLICY IF EXISTS event_isolation ON domain_events;
DROP POLICY IF EXISTS audit_isolation ON audit_log;

CREATE OR REPLACE FUNCTION app_has_workspace_access(target_workspace uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE workspace_id = target_workspace
      AND user_id::text = current_setting('app.user_id', true)
  );
$$;

REVOKE ALL ON FUNCTION app_has_workspace_access(uuid) FROM PUBLIC;

CREATE POLICY membership_isolation ON memberships
  USING (user_id::text = current_setting('app.user_id', true) OR app_has_workspace_access(workspace_id));
CREATE POLICY project_isolation ON projects
  USING (app_has_workspace_access(workspace_id));
CREATE POLICY event_isolation ON domain_events
  USING (app_has_workspace_access(workspace_id));
CREATE POLICY audit_isolation ON audit_log
  USING (app_has_workspace_access(workspace_id));
