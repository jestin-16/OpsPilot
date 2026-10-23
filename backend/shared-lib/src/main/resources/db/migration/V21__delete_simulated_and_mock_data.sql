-- V21: Remove simulated deployments, fabricated containers/pods, and demo fixture projects
-- Cleans up any mock/simulated legacy records from the database.

-- 1. Remove fabricated pods and containers linked to simulated deployments or demo projects
DELETE FROM pods
WHERE container_id IN (
    SELECT c.container_id FROM containers c
    JOIN deployments d ON c.deployment_id = d.id
    WHERE d.source = 'SIMULATED'
) OR pod_name = 'nginx-latest-pod' OR node_name = 'minikube';

DELETE FROM containers
WHERE deployment_id IN (
    SELECT id FROM deployments WHERE source = 'SIMULATED'
) OR deployment_id IN (
    SELECT id FROM deployments WHERE project_id IN (
        SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2')
    )
);

-- 2. Clean up logs and notifications pointing to simulated deployments or demo projects
DELETE FROM logs
WHERE (deployment_id IN (SELECT id FROM deployments WHERE source = 'SIMULATED')
   AND source_service IN ('deployment-service', 'kubernetes-service'))
   OR project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2'));

UPDATE logs SET deployment_id = NULL WHERE deployment_id IN (SELECT id FROM deployments WHERE source = 'SIMULATED');

DELETE FROM notifications
WHERE (deployment_id IN (SELECT id FROM deployments WHERE source = 'SIMULATED')
   AND type IN ('DEPLOYMENT_INITIATED', 'DEPLOYMENT_SUCCESS'))
   OR deployment_id IN (SELECT id FROM deployments WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2')));

UPDATE notifications SET deployment_id = NULL WHERE deployment_id IN (SELECT id FROM deployments WHERE source = 'SIMULATED');

UPDATE incidents SET deployment_id = NULL WHERE deployment_id IN (SELECT id FROM deployments WHERE source = 'SIMULATED');

-- 3. Delete simulated deployments
DELETE FROM deployments 
WHERE source = 'SIMULATED' 
   OR project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2'));

-- 4. Delete demo projects and any references to them
DELETE FROM pipeline_runs WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2'));
DELETE FROM commit_logs WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2'));
DELETE FROM log_sources WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2'));
DELETE FROM pipeline_sources WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2'));
DELETE FROM integrations WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2'));
DELETE FROM incidents WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2'));
DELETE FROM alert_rules WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2'));
DELETE FROM alerts WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2'));
DELETE FROM infrastructure_events WHERE project_id IN (SELECT id FROM projects WHERE slug IN ('demo-project-1', 'demo-project-2') OR project_name IN ('Demo Project 1', 'Demo Project 2'));

DELETE FROM projects 
WHERE slug IN ('demo-project-1', 'demo-project-2') 
   OR project_name IN ('Demo Project 1', 'Demo Project 2')
   OR repository_url IN ('https://github.com/demo/1', 'https://github.com/demo/2');

-- 5. Remove mock audit user
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = 'opspilot-audit-other@example.com');
DELETE FROM users WHERE email = 'opspilot-audit-other@example.com';
