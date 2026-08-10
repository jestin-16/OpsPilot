-- Baseline Schema Migration for OpsPilot

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- User_Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    repository_url VARCHAR(512),
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Deployments Table
CREATE TABLE IF NOT EXISTS deployments (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    deployed_by_id BIGINT NOT NULL REFERENCES users(id),
    deployed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Containers Table
CREATE TABLE IF NOT EXISTS containers (
    container_id BIGSERIAL PRIMARY KEY,
    deployment_id BIGINT REFERENCES deployments(id) ON DELETE SET NULL,
    image_name VARCHAR(255) NOT NULL,
    container_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pods Table
CREATE TABLE IF NOT EXISTS pods (
    pod_id BIGSERIAL PRIMARY KEY,
    container_id BIGINT REFERENCES containers(container_id) ON DELETE SET NULL,
    node_name VARCHAR(255) NOT NULL,
    pod_status VARCHAR(50) NOT NULL,
    cpu_usage VARCHAR(50) NOT NULL,
    memory_usage VARCHAR(50) NOT NULL
);

-- Logs Table
CREATE TABLE IF NOT EXISTS logs (
    log_id BIGSERIAL PRIMARY KEY,
    source_service VARCHAR(255) NOT NULL,
    log_level VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deployment_id BIGINT REFERENCES deployments(id) ON DELETE SET NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pipeline_Runs Table
CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    commit_sha VARCHAR(100) NOT NULL,
    commit_message TEXT,
    author VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit_Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(255) NOT NULL,
    resource_id VARCHAR(255),
    details TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Refresh_Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expiry_date TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
