-- Demo Data for PersonalNotesApp (User ID: 5)

DO $$
DECLARE
    v_proj_id bigint;
    v_dep_id bigint;
    v_run_id bigint;
    i int;
    v_random_hours int;
    v_timestamp timestamp;
BEGIN
    -- 1. Create Project
    INSERT INTO projects (created_at, project_name, description, repository_url, status, owner_id, github_repo_name)
    VALUES (NOW() - INTERVAL '14 days', 'Personal Notes App', 'React and Spring Boot based notes application.', 'https://github.com/jestin-16/PersonalNotesApp.git', 'Active', 5, 'PersonalNotesApp')
    RETURNING id INTO v_proj_id;

    -- 2. Generate Deployments (5 total)
    FOR i IN 1..5 LOOP
        v_random_hours := floor(random() * 240);
        v_timestamp := NOW() - (v_random_hours || ' hours')::interval;
        
        INSERT INTO deployments (deployed_at, environment, status, version, deployed_by_id, project_id)
        VALUES (v_timestamp, CASE WHEN i = 1 THEN 'Production' ELSE 'Staging' END, 'Running', 'v1.' || i || '.0', 5, v_proj_id)
        RETURNING id INTO v_dep_id;
    END LOOP;

    -- 3. Generate Pipeline Runs (10 total)
    FOR i IN 1..10 LOOP
        v_random_hours := floor(random() * 120);
        v_timestamp := NOW() - (v_random_hours || ' hours')::interval;
        
        INSERT INTO pipeline_runs (author, branch, commit_message, commit_sha, created_at, duration_ms, event_type, exit_code, repo_url, status, project_id, build_logs)
        VALUES ('jestinshajik', 'main', 'Auto commit ' || i || ' for PersonalNotesApp', md5(random()::text), v_timestamp, (30000 + random() * 20000)::int, 'push', CASE WHEN i % 5 = 0 THEN 1 ELSE 0 END, 'https://github.com/jestin-16/PersonalNotesApp.git', CASE WHEN i % 5 = 0 THEN 'FAILED' ELSE 'SUCCESS' END, v_proj_id, '[INFO] Build output for PersonalNotesApp run ' || i)
        RETURNING run_id INTO v_run_id;
    END LOOP;

    -- 4. Generate Commits (20 total) to show GitHub Activity
    FOR i IN 1..20 LOOP
        v_random_hours := floor(random() * 168); -- Last 7 days
        v_timestamp := NOW() - (v_random_hours || ' hours')::interval;
        
        INSERT INTO commit_logs (author, branch_name, commit_sha, message, timestamp, project_id)
        VALUES ('jestinshajik', 'main', md5(random()::text), 'feat: updates to PersonalNotesApp ' || i, v_timestamp, v_proj_id);
    END LOOP;

    -- 5. Generate Logs
    FOR i IN 1..30 LOOP
        v_random_hours := floor(random() * 48);
        v_timestamp := NOW() - (v_random_hours || ' hours')::interval - (random() * 60 || ' minutes')::interval;
        
        INSERT INTO logs (log_level, message, source_service, timestamp, project_id, deployment_id)
        VALUES (
            CASE WHEN i % 10 = 0 THEN 'ERROR' WHEN i % 4 = 0 THEN 'WARN' ELSE 'INFO' END,
            'Log entry ' || i || ' for PersonalNotesApp',
            'PersonalNotesApp',
            v_timestamp,
            v_proj_id,
            NULL
        );
    END LOOP;

END $$;
