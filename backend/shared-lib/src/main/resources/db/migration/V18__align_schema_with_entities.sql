-- Brings a schema built by V1-V17 in line with the JPA entities. Until this release Flyway was not on the
-- classpath, so every existing database was built by Hibernate's ddl-auto=update instead; those are
-- baselined at version 17 (spring.flyway.baseline-version) and this script runs on them as well.
-- Every statement is therefore idempotent: it adds what is missing and leaves what is already right.

-- Tables that entities use but no migration created.
CREATE TABLE IF NOT EXISTS commit_logs (
    commit_log_id BIGSERIAL PRIMARY KEY,
    author        VARCHAR(255)  NOT NULL,
    branch_name   VARCHAR(255)  NOT NULL,
    commit_sha    VARCHAR(255)  NOT NULL,
    message       VARCHAR(2048) NOT NULL,
    "timestamp"   TIMESTAMP(6)  NOT NULL,
    project_id    BIGINT REFERENCES projects (id)
);

CREATE TABLE IF NOT EXISTS resources (
    id                   BIGSERIAL PRIMARY KEY,
    created_at           TIMESTAMP(6) NOT NULL,
    environment          VARCHAR(255),
    integration_id       BIGINT,
    metadata             TEXT,
    name                 VARCHAR(255) NOT NULL,
    project_id           BIGINT       NOT NULL,
    provider             VARCHAR(255) NOT NULL,
    provider_resource_id VARCHAR(255) NOT NULL,
    region               VARCHAR(255),
    resource_type        VARCHAR(255) NOT NULL,
    status               VARCHAR(255) NOT NULL,
    updated_at           TIMESTAMP(6) NOT NULL
);

-- Columns that entities map but no migration added.
ALTER TABLE log_sources   ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deployment_id BIGINT;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS build_logs TEXT;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS duration_ms BIGINT;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS exit_code INTEGER;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS external_run_id VARCHAR(255);
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS repo_url VARCHAR(512);
ALTER TABLE pods          ADD COLUMN IF NOT EXISTS namespace VARCHAR(255);
ALTER TABLE pods          ADD COLUMN IF NOT EXISTS pod_name VARCHAR(255);
ALTER TABLE projects      ADD COLUMN IF NOT EXISTS aws_log_group_name VARCHAR(255);
ALTER TABLE projects      ADD COLUMN IF NOT EXISTS credentials_json TEXT;
ALTER TABLE projects      ADD COLUMN IF NOT EXISTS github_repo_name VARCHAR(255);
ALTER TABLE projects      ADD COLUMN IF NOT EXISTS loki_app_label VARCHAR(255);
ALTER TABLE projects      ADD COLUMN IF NOT EXISTS oci_log_group_ocid VARCHAR(255);

-- Types that differ from the entities (ddl-auto=validate rejects both).
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'incidents' AND column_name = 'id') = 'integer' THEN
        ALTER TABLE incidents ALTER COLUMN id TYPE BIGINT;
        ALTER SEQUENCE IF EXISTS incidents_id_seq AS BIGINT;
    END IF;

    -- RefreshToken.expiryDate is an Instant; stored values are UTC.
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'refresh_tokens' AND column_name = 'expiry_date')
        = 'timestamp without time zone' THEN
        ALTER TABLE refresh_tokens ALTER COLUMN expiry_date TYPE TIMESTAMPTZ USING expiry_date AT TIME ZONE 'UTC';
    END IF;
END $$;

-- Widen columns the migrations made narrower than the entities allow, so valid values are not rejected.
-- Only VARCHARs shorter than 255 are touched: widening never rewrites or truncates data, and TEXT or
-- already-wider columns are left alone.
DO $$
DECLARE
    target TEXT;
    tbl    TEXT;
    col    TEXT;
BEGIN
    FOREACH target IN ARRAY ARRAY[
        'alert_rules.event_type',
        'alert_rules.notification_policy',
        'alert_rules.severity',
        'alerts.event_type',
        'alerts.severity',
        'alerts.status',
        'containers.container_status',
        'deployments.environment',
        'deployments.status',
        'deployments.version',
        'infrastructure_events.event_type',
        'infrastructure_events.provider',
        'infrastructure_events.severity',
        'integrations.category',
        'integrations.provider',
        'integrations.status',
        'log_sources.auth_method',
        'log_sources.ingestion_mode',
        'log_sources.source_name',
        'logs.log_level',
        'notification_deliveries.channel',
        'notification_deliveries.event_id',
        'notification_deliveries.status',
        'notification_policies.event_type',
        'notification_policies.minimum_severity',
        'notifications.type',
        'pipeline_runs.commit_sha',
        'pipeline_runs.event_type',
        'pipeline_runs.status',
        'platform_integrations.provider_type',
        'platform_settings.setting_key',
        'pods.cpu_usage',
        'pods.memory_usage',
        'pods.pod_status',
        'projects.status',
        'roles.role_name'
    ] LOOP
        tbl := split_part(target, '.', 1);
        col := split_part(target, '.', 2);
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = current_schema() AND table_name = tbl AND column_name = col
                     AND data_type = 'character varying' AND character_maximum_length < 255) THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE VARCHAR(255)', tbl, col);
        END IF;
    END LOOP;
END $$;

-- The entities treat pod metrics as optional.
ALTER TABLE pods ALTER COLUMN cpu_usage DROP NOT NULL;
ALTER TABLE pods ALTER COLUMN memory_usage DROP NOT NULL;
