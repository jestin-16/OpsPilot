-- Cleanup script to delete demo data for Payment Gateway Service (owner_id = 5)

DO $$
DECLARE
    v_project_id bigint;
BEGIN
    -- Find the project ID
    SELECT id INTO v_project_id
    FROM projects
    WHERE owner_id = 5 AND project_name = 'Payment Gateway Service'
    LIMIT 1;

    IF v_project_id IS NOT NULL THEN
        -- Delete commit logs
        DELETE FROM commit_logs WHERE project_id = v_project_id;
        
        -- Delete pipeline runs
        DELETE FROM pipeline_runs WHERE project_id = v_project_id;
        
        -- Delete deployments
        DELETE FROM deployments WHERE project_id = v_project_id;
        
        -- Finally delete the project
        DELETE FROM projects WHERE id = v_project_id;
        
        RAISE NOTICE 'Demo data deleted successfully.';
    ELSE
        RAISE NOTICE 'Demo project not found.';
    END IF;
END $$;
