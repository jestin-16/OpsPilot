CREATE TABLE alert_rules (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT,
    integration_id BIGINT,
    resource VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    threshold INT NOT NULL DEFAULT 1,
    time_window INT NOT NULL DEFAULT 5,
    enabled BOOLEAN NOT NULL DEFAULT true,
    notification_policy VARCHAR(50)
);

CREATE TABLE alerts (
    id BIGSERIAL PRIMARY KEY,
    alert_rule_id BIGINT,
    project_id BIGINT,
    resource VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    message TEXT,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP
);

-- Seed initial rules (Global rules, so project_id is NULL)
INSERT INTO alert_rules (event_type, severity, threshold, time_window, enabled, notification_policy) VALUES
('PIPELINE_FAILED', 'CRITICAL', 1, 5, true, 'SYSTEM_ALERT'),
('DEPLOYMENT_FAILED', 'CRITICAL', 1, 5, true, 'SYSTEM_ALERT'),
('POD_CRASHED', 'CRITICAL', 1, 5, true, 'SYSTEM_ALERT'),
('CONTAINER_EXITED', 'WARNING', 1, 5, true, 'SYSTEM_ALERT'),
('REPEATED_ERROR_LOGS', 'WARNING', 5, 5, true, 'SYSTEM_ALERT'),
('HIGH_CPU', 'WARNING', 1, 5, true, 'SYSTEM_ALERT'),
('HIGH_MEMORY', 'WARNING', 1, 5, true, 'SYSTEM_ALERT'),
('HEALTH_CHECK_FAILURE', 'CRITICAL', 1, 5, true, 'SYSTEM_ALERT');
