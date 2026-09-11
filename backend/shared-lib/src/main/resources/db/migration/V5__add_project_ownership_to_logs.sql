ALTER TABLE logs
    ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_logs_project_timestamp
    ON logs(project_id, timestamp DESC);
