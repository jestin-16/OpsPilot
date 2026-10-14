-- Connector support: wider credential column, push-ingest token for APP_LOGS, and a fix for the
-- provider column (the entity previously mapped to provider_type while V8 created "provider").
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'integrations' AND column_name = 'provider_type') THEN
        UPDATE integrations SET provider = provider_type WHERE provider IS NULL OR provider = '';
        ALTER TABLE integrations DROP COLUMN provider_type;
    END IF;
END $$;

ALTER TABLE integrations ALTER COLUMN credential_reference TYPE TEXT;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS ingest_token_hash VARCHAR(64);
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS ingest_token_prefix VARCHAR(16);
CREATE UNIQUE INDEX IF NOT EXISTS uq_integrations_ingest_token_hash ON integrations(ingest_token_hash);
CREATE INDEX IF NOT EXISTS idx_integrations_project_id ON integrations(project_id);
