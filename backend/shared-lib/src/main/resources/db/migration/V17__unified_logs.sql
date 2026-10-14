-- Unified log entries: which integration produced a row, what kind of source it was, and free-form metadata.
ALTER TABLE logs ADD COLUMN IF NOT EXISTS integration_id BIGINT;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS source_type VARCHAR(30);
ALTER TABLE logs ADD COLUMN IF NOT EXISTS metadata TEXT;

-- Messages from connectors can exceed the old 2048-character JPA limit; the column is already TEXT.
CREATE INDEX IF NOT EXISTS idx_logs_project_integration_ts ON logs(project_id, integration_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_project_level_ts ON logs(project_id, log_level, timestamp DESC);
