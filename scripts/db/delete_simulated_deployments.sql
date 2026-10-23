-- Removes everything the old deployment simulator and demo seeders made up: deployments labelled
-- SIMULATED by migration V19, the containers and pods invented for them, the demo fixture projects
-- ("Demo Project 1" / "Demo Project 2"), and mock audit users.
-- Real logs and incidents that point at those deployments are kept, with the link cleared.
-- Review, then run:  docker exec -i opspilot-postgres psql -U opspilot -d opspilot < scripts/db/delete_simulated_deployments.sql

BEGIN;

CREATE TEMP TABLE simulated ON COMMIT DROP AS
    SELECT id FROM deployments WHERE source = 'SIMULATED';

DELETE FROM pods
WHERE container_id IN (SELECT container_id FROM containers WHERE deployment_id IN (SELECT id FROM simulated));

DELETE FROM containers WHERE deployment_id IN (SELECT id FROM simulated);

-- The simulator's own log lines.
DELETE FROM logs
WHERE deployment_id IN (SELECT id FROM simulated)
  AND source_service IN ('deployment-service', 'kubernetes-service');
UPDATE logs SET deployment_id = NULL WHERE deployment_id IN (SELECT id FROM simulated);

DELETE FROM notifications
WHERE deployment_id IN (SELECT id FROM simulated)
  AND type IN ('DEPLOYMENT_INITIATED', 'DEPLOYMENT_SUCCESS');
UPDATE notifications SET deployment_id = NULL WHERE deployment_id IN (SELECT id FROM simulated);

UPDATE incidents SET deployment_id = NULL WHERE deployment_id IN (SELECT id FROM simulated);

DELETE FROM deployments WHERE id IN (SELECT id FROM simulated);

-- Purge demo fixture projects ("Demo Project 1" / "Demo Project 2") and their references
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

-- Purge mock audit user
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = 'opspilot-audit-other@example.com');
DELETE FROM users WHERE email = 'opspilot-audit-other@example.com';

COMMIT;

