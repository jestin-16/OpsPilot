-- Standalone CI/CD sources (GitHub Actions / Jenkins) that do not require a Project.
CREATE TABLE IF NOT EXISTS pipeline_sources (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- GitHub Actions
    repo_full_name VARCHAR(255),
    access_token TEXT,
    -- Jenkins
    base_url VARCHAR(512),
    job_name VARCHAR(255),
    username VARCHAR(255),
    api_token TEXT,
    -- Webhook authentication (server-generated)
    webhook_secret TEXT NOT NULL,
    project_id BIGINT,
    CONSTRAINT chk_pipeline_source_provider CHECK (provider IN ('GITHUB_ACTIONS', 'JENKINS')),
    CONSTRAINT fk_pipeline_source_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pipeline_sources_project_id ON pipeline_sources(project_id);

-- Runs and incidents may now belong to a source instead of (or in addition to) a project.
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS source_id BIGINT;
ALTER TABLE pipeline_runs ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE pipeline_runs
    ADD CONSTRAINT fk_pipeline_run_source FOREIGN KEY (source_id) REFERENCES pipeline_sources(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_source_id ON pipeline_runs(source_id);

ALTER TABLE incidents ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS source_id BIGINT;
ALTER TABLE incidents
    ADD CONSTRAINT fk_incident_source FOREIGN KEY (source_id) REFERENCES pipeline_sources(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_source_id ON incidents(source_id);
