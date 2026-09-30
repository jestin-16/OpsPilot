-- Cleanup script for extended demo data (owner_id = 5)

DO $$
BEGIN
    -- Delete pods & containers
    DELETE FROM pods WHERE container_id IN (
        SELECT container_id FROM containers WHERE deployment_id IN (
            SELECT id FROM deployments WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = 5 AND project_name IN ('Payment Gateway Service', 'Frontend Portal', 'Personal Notes App')
            )
        )
    );
    DELETE FROM containers WHERE deployment_id IN (
        SELECT id FROM deployments WHERE project_id IN (
            SELECT id FROM projects WHERE owner_id = 5 AND project_name IN ('Payment Gateway Service', 'Frontend Portal', 'Personal Notes App')
        )
    );

    -- Delete notifications
    DELETE FROM notifications WHERE user_id = 5;

    -- Delete incidents
    DELETE FROM incidents WHERE project_id IN (
        SELECT id FROM projects WHERE owner_id = 5 AND project_name IN ('Payment Gateway Service', 'Frontend Portal', 'Personal Notes App')
    );

    -- Delete logs
    DELETE FROM logs WHERE project_id IN (
        SELECT id FROM projects WHERE owner_id = 5 AND project_name IN ('Payment Gateway Service', 'Frontend Portal', 'Personal Notes App')
    );

    -- Delete commit logs
    DELETE FROM commit_logs WHERE project_id IN (
        SELECT id FROM projects WHERE owner_id = 5 AND project_name IN ('Payment Gateway Service', 'Frontend Portal', 'Personal Notes App')
    );

    -- Delete pipeline runs
    DELETE FROM pipeline_runs WHERE project_id IN (
        SELECT id FROM projects WHERE owner_id = 5 AND project_name IN ('Payment Gateway Service', 'Frontend Portal', 'Personal Notes App')
    );

    -- Delete deployments
    DELETE FROM deployments WHERE project_id IN (
        SELECT id FROM projects WHERE owner_id = 5 AND project_name IN ('Payment Gateway Service', 'Frontend Portal', 'Personal Notes App')
    );

    -- Delete projects
    DELETE FROM projects WHERE owner_id = 5 AND project_name IN ('Payment Gateway Service', 'Frontend Portal', 'Personal Notes App');

    RAISE NOTICE 'Full demo data deleted successfully.';
END $$;
