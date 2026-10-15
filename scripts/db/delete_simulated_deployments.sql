-- Removes everything the old deployment simulator made up: deployments labelled SIMULATED by migration
-- V19, the containers and pods it invented for them, and its status-change log lines. Real logs and
-- incidents that point at those deployments are kept, with the link cleared.
-- Review, then run:  docker exec -i opspilot-postgres psql -U opspilot -d opspilot < scripts/db/delete_simulated_deployments.sql
-- The demo projects the old seeder created ("Demo Project 1" / "Demo Project 2") are not touched; delete
-- them from the Projects page if you don't want them.

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

COMMIT;
