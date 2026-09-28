CREATE TABLE notification_policies (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT,
    event_type VARCHAR(100),
    minimum_severity VARCHAR(50),
    enabled BOOLEAN NOT NULL DEFAULT true,
    selected_channels VARCHAR(255),
    cooldown INT NOT NULL DEFAULT 0
);

CREATE TABLE notification_deliveries (
    id BIGSERIAL PRIMARY KEY,
    policy_id BIGINT,
    event_id VARCHAR(100),
    channel VARCHAR(50) NOT NULL,
    message TEXT,
    status VARCHAR(50) NOT NULL,
    retry_count INT DEFAULT 0,
    last_attempt_at TIMESTAMP,
    error_message TEXT
);

-- Seed global policy for alerts
INSERT INTO notification_policies (event_type, minimum_severity, enabled, selected_channels, cooldown) VALUES
(NULL, 'WARNING', true, 'IN_APP', 5);
