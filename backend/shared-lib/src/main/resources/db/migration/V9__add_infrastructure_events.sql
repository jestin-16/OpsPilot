CREATE TABLE infrastructure_events (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    project_id BIGINT,
    integration_id BIGINT,
    provider VARCHAR(50),
    resource_id VARCHAR(255),
    event_type VARCHAR(50),
    severity VARCHAR(20),
    message TEXT,
    metadata TEXT
);
