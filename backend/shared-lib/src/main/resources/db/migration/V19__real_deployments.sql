-- Deployments become records of real deployments instead of the output of a simulator.
--   source      MANUAL (recorded through the API/UI, e.g. by a CI step) or GITHUB (deployment webhooks)
--   external_id the provider's deployment id, so status updates land on the same row
--   url         where the deployment is reachable (GitHub environment_url), if known
--   actor       who deployed, when that is not an OpsPilot user (GitHub login)
-- A GitHub deployment has no OpsPilot user, so deployed_by_id becomes optional.

ALTER TABLE deployments ADD COLUMN IF NOT EXISTS source VARCHAR(30) NOT NULL DEFAULT 'MANUAL';
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS url VARCHAR(1024);
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS actor VARCHAR(255);
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6);
ALTER TABLE deployments ALTER COLUMN deployed_by_id DROP NOT NULL;

-- Every deployment that exists before this migration was produced by the old simulator (timed status
-- changes, invented containers and pods). Label them rather than delete them; to remove them run
-- scripts/db/delete_simulated_deployments.sql.
UPDATE deployments SET source = 'SIMULATED' WHERE source = 'MANUAL';

CREATE UNIQUE INDEX IF NOT EXISTS uq_deployments_external
    ON deployments (project_id, source, external_id)
    WHERE external_id IS NOT NULL;
