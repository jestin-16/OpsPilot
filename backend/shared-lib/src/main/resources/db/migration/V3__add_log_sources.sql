CREATE TABLE IF NOT EXISTS log_sources (
    source_id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL,
    ingestion_mode VARCHAR(20) NOT NULL,
    field_mapping JSONB NOT NULL,
    auth_method VARCHAR(30) NOT NULL,
    auth_config JSONB,
    poll_endpoint_url VARCHAR(500),
    poll_interval_seconds INT DEFAULT 60,
    last_polled_at TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
