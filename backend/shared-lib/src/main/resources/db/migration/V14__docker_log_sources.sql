-- Push-model Docker monitoring sources. An agent (Grafana Alloy) authenticates with a per-source
-- token; only a SHA-256 hash of the token is stored. Distinct from the legacy webhook/poll log_sources table.
CREATE TABLE IF NOT EXISTS docker_log_sources (
    id UUID PRIMARY KEY,
    project_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    environment VARCHAR(32) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'DOCKER',
    token_hash VARCHAR(64) NOT NULL,
    token_prefix VARCHAR(16) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_docker_log_sources_token_hash UNIQUE (token_hash),
    CONSTRAINT chk_docker_log_sources_type CHECK (type IN ('DOCKER')),
    CONSTRAINT chk_docker_log_sources_status CHECK (status IN ('WAITING', 'ACTIVE', 'STALE')),
    CONSTRAINT fk_docker_log_sources_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_docker_log_sources_project_id ON docker_log_sources(project_id);
