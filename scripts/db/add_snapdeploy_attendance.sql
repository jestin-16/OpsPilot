-- Links the live SnapDeploy attendance-backend container to user jestinshajik@gmail.com (id: 5)
BEGIN;

INSERT INTO projects (
    project_name, 
    slug, 
    environment, 
    description, 
    repository_url, 
    github_repo_name, 
    status, 
    owner_id, 
    created_at
) VALUES (
    'attendance-backend',
    'attendance-backend',
    'production',
    'Attendance Backend live container hosted on SnapDeploy',
    'https://github.com/jestin-16/attendance-backend',
    'jestin-16/attendance-backend',
    'Active',
    5,
    NOW()
) ON CONFLICT (slug) DO UPDATE SET 
    repository_url = EXCLUDED.repository_url,
    description = EXCLUDED.description,
    status = EXCLUDED.status;

INSERT INTO deployments (
    project_id,
    deployed_by_id,
    version,
    environment,
    status,
    source,
    url,
    actor,
    deployed_at,
    updated_at
) VALUES (
    (SELECT id FROM projects WHERE slug = 'attendance-backend'),
    5,
    'v1.0.0',
    'production',
    'Succeeded',
    'MANUAL',
    'https://attendance-backend-c0495.containers.snapdeploy.app',
    'jestinshajik@gmail.com',
    NOW(),
    NOW()
);

INSERT INTO containers (
    deployment_id,
    image_name,
    container_status,
    created_at
) VALUES (
    (SELECT id FROM deployments WHERE project_id = (SELECT id FROM projects WHERE slug = 'attendance-backend') ORDER BY deployed_at DESC LIMIT 1),
    'attendance-backend-c0495.containers.snapdeploy.app',
    'RUNNING',
    NOW()
);

INSERT INTO resources (
    project_id,
    name,
    provider,
    provider_resource_id,
    resource_type,
    status,
    environment,
    metadata,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM projects WHERE slug = 'attendance-backend'),
    'attendance-backend-c0495',
    'DOCKER',
    'snapdeploy-attendance-backend-c0495',
    'CONTAINER',
    'HEALTHY',
    'production',
    '{"url":"https://attendance-backend-c0495.containers.snapdeploy.app","platform":"SnapDeploy","provider":"SnapDeploy Containers"}',
    NOW(),
    NOW()
);

INSERT INTO logs (
    project_id,
    deployment_id,
    source_service,
    source_type,
    log_level,
    message,
    metadata,
    timestamp
) VALUES (
    (SELECT id FROM projects WHERE slug = 'attendance-backend'),
    (SELECT id FROM deployments WHERE project_id = (SELECT id FROM projects WHERE slug = 'attendance-backend') ORDER BY deployed_at DESC LIMIT 1),
    'snapdeploy',
    'DEPLOYMENT',
    'INFO',
    'Container attendance-backend-c0495 successfully linked and healthy at https://attendance-backend-c0495.containers.snapdeploy.app',
    '{"url":"https://attendance-backend-c0495.containers.snapdeploy.app","platform":"SnapDeploy"}',
    NOW()
);

COMMIT;
