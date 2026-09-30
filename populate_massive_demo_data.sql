-- Massive Demo Data Generator for jestinshajik@gmail.com (User ID: 5)
-- Generates a fully populated dashboard

DO $$
DECLARE
    v_proj_1 bigint;
    v_proj_2 bigint;
    v_proj_3 bigint;
    v_dep_id bigint;
    v_run_id bigint;
    v_container_id bigint;
    i int;
    v_random_days int;
    v_random_hours int;
    v_timestamp timestamp;
BEGIN
    -- 1. Create Projects
    INSERT INTO projects (created_at, project_name, description, repository_url, status, owner_id, github_repo_name)
    VALUES (NOW() - INTERVAL '30 days', 'Auth Service', 'Microservice for handling OAuth and JWT.', 'https://github.com/jestin-16/auth-service', 'Active', 5, 'auth-service')
    RETURNING id INTO v_proj_1;

    INSERT INTO projects (created_at, project_name, description, repository_url, status, owner_id, github_repo_name)
    VALUES (NOW() - INTERVAL '45 days', 'Payment Gateway Service', 'Stripe recurring billing processor.', 'https://github.com/jestin-16/payment-gateway-service', 'Active', 5, 'payment-gateway-service')
    RETURNING id INTO v_proj_2;

    INSERT INTO projects (created_at, project_name, description, repository_url, status, owner_id, github_repo_name)
    VALUES (NOW() - INTERVAL '15 days', 'Mobile App API', 'GraphQL API for mobile clients.', 'https://github.com/jestin-16/mobile-api', 'Active', 5, 'mobile-api')
    RETURNING id INTO v_proj_3;

    -- 2. Generate Deployments (15 total)
    FOR i IN 1..15 LOOP
        v_random_days := floor(random() * 14);
        v_timestamp := NOW() - (v_random_days || ' days')::interval;
        
        INSERT INTO deployments (deployed_at, environment, status, version, deployed_by_id, project_id)
        VALUES (v_timestamp, CASE WHEN i % 3 = 0 THEN 'Production' ELSE 'Staging' END, 'Running', 'v' || (1 + i/5) || '.' || (i%5) || '.0', 5, CASE WHEN i % 3 = 0 THEN v_proj_1 WHEN i % 3 = 1 THEN v_proj_2 ELSE v_proj_3 END)
        RETURNING id INTO v_dep_id;

        -- Containers & Pods for each deployment
        INSERT INTO containers (container_status, created_at, image_name, deployment_id)
        VALUES ('RUNNING', v_timestamp, 'opspilot/image:v' || i, v_dep_id)
        RETURNING container_id INTO v_container_id;

        INSERT INTO pods (cpu_usage, memory_usage, namespace, node_name, pod_name, pod_status, container_id)
        VALUES ((100 + random() * 200)::int || 'm', (256 + random() * 512)::int || 'Mi', 'default', 'worker-node-' || (1 + i%3), 'pod-' || md5(random()::text), 'Running', v_container_id);
    END LOOP;

    -- 3. Generate Pipeline Runs (30 total)
    FOR i IN 1..30 LOOP
        v_random_hours := floor(random() * 72);
        v_timestamp := NOW() - (v_random_hours || ' hours')::interval;
        
        INSERT INTO pipeline_runs (author, branch, commit_message, commit_sha, created_at, duration_ms, event_type, exit_code, repo_url, status, project_id, build_logs)
        VALUES ('jestinshajik', 'main', 'Auto commit ' || i, md5(random()::text), v_timestamp, (20000 + random() * 60000)::int, 'push', CASE WHEN i % 7 = 0 THEN 1 ELSE 0 END, 'https://github.com/jestin-16/repo', CASE WHEN i % 7 = 0 THEN 'FAILED' ELSE 'SUCCESS' END, CASE WHEN i % 3 = 0 THEN v_proj_1 WHEN i % 3 = 1 THEN v_proj_2 ELSE v_proj_3 END, '[INFO] Build output for run ' || i)
        RETURNING run_id INTO v_run_id;

        -- Create incidents for failed runs
        IF i % 7 = 0 THEN
            INSERT INTO incidents (affected_service, created_at, description, severity, status, title, project_id, pipeline_run_id, alert_count, started_at)
            VALUES ('CI/CD Pipeline', v_timestamp, 'Pipeline failed for build ' || i, 'HIGH', CASE WHEN i % 14 = 0 THEN 'Resolved' ELSE 'Investigating' END, 'Build Failure #' || v_run_id, CASE WHEN i % 3 = 0 THEN v_proj_1 WHEN i % 3 = 1 THEN v_proj_2 ELSE v_proj_3 END, v_run_id, 1, v_timestamp);
        END IF;
    END LOOP;

    -- 4. Generate Commits (40 total)
    FOR i IN 1..40 LOOP
        v_random_hours := floor(random() * 120);
        v_timestamp := NOW() - (v_random_hours || ' hours')::interval;
        
        INSERT INTO commit_logs (author, branch_name, commit_sha, message, timestamp, project_id)
        VALUES ('jestinshajik', 'main', md5(random()::text), 'feat: implement feature ' || i, v_timestamp, CASE WHEN i % 3 = 0 THEN v_proj_1 WHEN i % 3 = 1 THEN v_proj_2 ELSE v_proj_3 END);
    END LOOP;

    -- 5. Generate Logs (100 total)
    FOR i IN 1..100 LOOP
        v_random_hours := floor(random() * 24);
        v_timestamp := NOW() - (v_random_hours || ' hours')::interval - (random() * 60 || ' minutes')::interval;
        
        INSERT INTO logs (log_level, message, source_service, timestamp, project_id, deployment_id)
        VALUES (
            CASE WHEN i % 15 = 0 THEN 'ERROR' WHEN i % 5 = 0 THEN 'WARN' ELSE 'INFO' END,
            CASE WHEN i % 15 = 0 THEN 'Database connection lost while querying user data' WHEN i % 5 = 0 THEN 'High latency detected in payment API' ELSE 'Processed request successfully in ' || floor(random() * 100) || 'ms' END,
            CASE WHEN i % 3 = 0 THEN 'Auth Service' WHEN i % 3 = 1 THEN 'Payment Gateway Service' ELSE 'Mobile App API' END,
            v_timestamp,
            CASE WHEN i % 3 = 0 THEN v_proj_1 WHEN i % 3 = 1 THEN v_proj_2 ELSE v_proj_3 END,
            NULL
        );
    END LOOP;

    -- 6. Generate Notifications
    FOR i IN 1..10 LOOP
        INSERT INTO notifications (created_at, is_read, message, type, user_id)
        VALUES (NOW() - (i || ' hours')::interval, false, 'System notification ' || i, 'SYSTEM_ALERT', 5);
    END LOOP;

END $$;
