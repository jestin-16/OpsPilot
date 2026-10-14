-- Project-first restructure: slug + environment on projects, and a "Default Project"
-- that adopts any pre-existing data that was not attached to a project.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug VARCHAR(120);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS environment VARCHAR(20) NOT NULL DEFAULT 'dev';

-- Backfill slugs (id suffix guarantees uniqueness for legacy rows).
UPDATE projects
SET slug = COALESCE(NULLIF(trim(both '-' from lower(regexp_replace(project_name, '[^a-zA-Z0-9]+', '-', 'g'))), ''), 'project')
           || '-' || id
WHERE slug IS NULL;

ALTER TABLE projects ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_projects_slug ON projects(slug);

ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_projects_environment;
ALTER TABLE projects ADD CONSTRAINT chk_projects_environment CHECK (environment IN ('dev', 'staging', 'prod'));

-- Default Project: owned by the first ADMIN (else the first user). Skipped on an empty database.
DO $$
DECLARE
    owner BIGINT;
    default_id BIGINT;
    orphans BIGINT;
BEGIN
    SELECT count(*) INTO orphans FROM (
        SELECT 1 FROM logs WHERE project_id IS NULL
        UNION ALL SELECT 1 FROM pipeline_runs WHERE project_id IS NULL
        UNION ALL SELECT 1 FROM incidents WHERE project_id IS NULL
        UNION ALL SELECT 1 FROM alerts WHERE project_id IS NULL
        UNION ALL SELECT 1 FROM log_sources WHERE project_id IS NULL
        UNION ALL SELECT 1 FROM pipeline_sources WHERE project_id IS NULL
        UNION ALL SELECT 1 FROM infrastructure_events WHERE project_id IS NULL
    ) o;

    SELECT u.id INTO owner FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE r.role_name IN ('ADMIN', 'ROLE_ADMIN')
        ORDER BY u.id LIMIT 1;
    IF owner IS NULL THEN
        SELECT id INTO owner FROM users ORDER BY id LIMIT 1;
    END IF;

    IF owner IS NULL OR orphans = 0 THEN
        RETURN;
    END IF;

    SELECT id INTO default_id FROM projects WHERE slug = 'default-project';
    IF default_id IS NULL THEN
        INSERT INTO projects (project_name, description, owner_id, status, slug, environment)
        VALUES ('Default Project', 'Adopts data created before projects became the top-level entity.',
                owner, 'Active', 'default-project', 'dev')
        RETURNING id INTO default_id;
    END IF;

    UPDATE logs SET project_id = default_id WHERE project_id IS NULL;
    UPDATE pipeline_runs SET project_id = default_id WHERE project_id IS NULL;
    UPDATE incidents SET project_id = default_id WHERE project_id IS NULL;
    UPDATE alerts SET project_id = default_id WHERE project_id IS NULL;
    UPDATE log_sources SET project_id = default_id WHERE project_id IS NULL;
    UPDATE pipeline_sources SET project_id = default_id WHERE project_id IS NULL;
    UPDATE infrastructure_events SET project_id = default_id WHERE project_id IS NULL;
END $$;
-- alert_rules with NULL project_id are intentionally global and are left untouched.
