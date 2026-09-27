CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    project_id BIGINT NOT NULL,
    affected_service VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP,
    created_by_id BIGINT,
    deployment_id BIGINT,
    pipeline_run_id BIGINT,
    CONSTRAINT fk_incident_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_incident_creator FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_incident_deployment FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE SET NULL,
    CONSTRAINT fk_incident_pipeline FOREIGN KEY (pipeline_run_id) REFERENCES pipeline_runs(run_id) ON DELETE SET NULL
);

CREATE INDEX idx_incidents_project_id ON incidents(project_id);
CREATE INDEX idx_incidents_status ON incidents(status);
