-- Databases built by Hibernate's ddl-auto=update (every database created before Flyway was enabled) got a
-- CHECK constraint on each enum column, listing the enum's values at the time the table was created.
-- `update` never refreshes them, so values added to an enum later are rejected: on such databases an
-- App Logs integration (category APPLICATION) could not be created at all. The application validates
-- these values itself, and migration-built databases never had the constraints, so drop them.
-- chk_projects_environment is deliberate (V15) and is kept.

ALTER TABLE infrastructure_events DROP CONSTRAINT IF EXISTS infrastructure_events_event_type_check;
ALTER TABLE infrastructure_events DROP CONSTRAINT IF EXISTS infrastructure_events_provider_check;
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_category_check;
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_status_check;
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_provider_check;
