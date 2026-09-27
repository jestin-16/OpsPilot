CREATE TABLE integrations (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    configuration TEXT,
    credential_reference VARCHAR(255),
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_health_check_at TIMESTAMP,
    CONSTRAINT fk_integrations_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
