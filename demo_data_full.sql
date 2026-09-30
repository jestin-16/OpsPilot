-- Extended Demo Data for jestinshajik@gmail.com (User ID: 5)
-- We will insert projects, deployments, pipeline runs, logs, incidents, containers, and pods.

DO $$
DECLARE
    v_project_id_1 bigint;
    v_project_id_2 bigint;
    v_deployment_id_1 bigint;
    v_deployment_id_2 bigint;
    v_run_id_1 bigint;
    v_run_id_2 bigint;
    v_container_id bigint;
BEGIN

    -- 1. Insert Projects
    INSERT INTO projects (
        created_at, project_name, description, repository_url, status, owner_id, github_repo_name
    ) VALUES (
        NOW() - INTERVAL '10 days',
        'Payment Gateway Service',
        'Demo microservice for processing Stripe payments.',
        'https://github.com/jestin-16/payment-gateway',
        'Active',
        5,
        'payment-gateway'
    ) RETURNING id INTO v_project_id_1;

    INSERT INTO projects (
        created_at, project_name, description, repository_url, status, owner_id, github_repo_name
    ) VALUES (
        NOW() - INTERVAL '5 days',
        'Frontend Portal',
        'React SPA for user dashboard.',
        'https://github.com/jestin-16/frontend-portal',
        'Active',
        5,
        'frontend-portal'
    ) RETURNING id INTO v_project_id_2;

    -- 2. Insert Deployments
    INSERT INTO deployments (
        deployed_at, environment, status, version, deployed_by_id, project_id
    ) VALUES (
        NOW() - INTERVAL '2 hours',
        'Production',
        'Running',
        'v2.4.1',
        5,
        v_project_id_1
    ) RETURNING id INTO v_deployment_id_1;

    INSERT INTO deployments (
        deployed_at, environment, status, version, deployed_by_id, project_id
    ) VALUES (
        NOW() - INTERVAL '1 day',
        'Staging',
        'Running',
        'v1.0.5',
        5,
        v_project_id_2
    ) RETURNING id INTO v_deployment_id_2;

    -- 3. Insert Pipeline Runs
    INSERT INTO pipeline_runs (
        author, branch, commit_message, commit_sha, created_at, duration_ms, event_type, exit_code, repo_url, status, project_id, build_logs
    ) VALUES (
        'jestinshajik',
        'main',
        'fix: resolve race condition in payment webhook',
        'a1b2c3d4e5f6g7h8',
        NOW() - INTERVAL '3 hours',
        45000,
        'push',
        0,
        'https://github.com/jestin-16/payment-gateway',
        'SUCCESS',
        v_project_id_1,
        '[INFO] Building Payment Gateway\n[INFO] Tests passed\n[INFO] SUCCESS'
    ) RETURNING run_id INTO v_run_id_1;

    INSERT INTO pipeline_runs (
        author, branch, commit_message, commit_sha, created_at, duration_ms, event_type, exit_code, repo_url, status, project_id, build_logs
    ) VALUES (
        'jestinshajik',
        'main',
        'test: failing test for checkout',
        'f8e7d6c5b4a3',
        NOW() - INTERVAL '1 day',
        22000,
        'push',
        1,
        'https://github.com/jestin-16/frontend-portal',
        'FAILED',
        v_project_id_2,
        '[INFO] Building Frontend Portal\n[ERROR] Tests run: 1, Failures: 1\n[ERROR] BUILD FAILURE'
    ) RETURNING run_id INTO v_run_id_2;

    -- 4. Insert Commits
    INSERT INTO commit_logs (
        author, branch_name, commit_sha, message, timestamp, project_id
    ) VALUES (
        'jestinshajik', 'main', 'a1b2c3d4e5f6g7h8', 'fix: resolve race condition in payment webhook', NOW() - INTERVAL '3 hours', v_project_id_1
    ), (
        'jestinshajik', 'main', 'f8e7d6c5b4a3', 'feat: integrate Stripe API v3', NOW() - INTERVAL '4 hours', v_project_id_1
    ), (
        'jestinshajik', 'main', 'c1d2e3f4g5h6', 'chore: update react dependencies', NOW() - INTERVAL '1 day', v_project_id_2
    );

    -- 5. Insert Logs
    INSERT INTO logs (
        log_level, message, source_service, timestamp, project_id, deployment_id
    ) VALUES (
        'INFO', 'Application started on port 8080', 'payment-gateway', NOW() - INTERVAL '2 hours', v_project_id_1, v_deployment_id_1
    ), (
        'INFO', 'Connecting to database...', 'payment-gateway', NOW() - INTERVAL '1 hour 59 minutes', v_project_id_1, v_deployment_id_1
    ), (
        'WARN', 'Slow query detected on payments table', 'payment-gateway', NOW() - INTERVAL '30 minutes', v_project_id_1, v_deployment_id_1
    ), (
        'ERROR', 'Stripe API connection timeout', 'payment-gateway', NOW() - INTERVAL '5 minutes', v_project_id_1, v_deployment_id_1
    ), (
        'INFO', 'Frontend server listening on port 3000', 'frontend-portal', NOW() - INTERVAL '1 day', v_project_id_2, v_deployment_id_2
    );

    -- 6. Insert Incidents
    INSERT INTO incidents (
        affected_service, created_at, description, severity, status, title, project_id, deployment_id, pipeline_run_id, alert_count, started_at
    ) VALUES (
        'Payment Gateway', NOW() - INTERVAL '5 minutes', 'Stripe API is timing out repeatedly.', 'HIGH', 'Investigating', 'Payment API Timeout', v_project_id_1, v_deployment_id_1, NULL, 5, NOW() - INTERVAL '5 minutes'
    ), (
        'Frontend CI', NOW() - INTERVAL '1 day', 'Build failed due to broken checkout tests.', 'LOW', 'Resolved', 'Frontend Build Failure', v_project_id_2, NULL, v_run_id_2, 1, NOW() - INTERVAL '1 day'
    );

    -- 7. Insert Notifications
    INSERT INTO notifications (
        created_at, is_read, message, type, deployment_id, user_id
    ) VALUES (
        NOW() - INTERVAL '2 hours', false, 'Deployment #1 for Payment Gateway Service succeeded.', 'DEPLOYMENT_SUCCESS', v_deployment_id_1, 5
    ), (
        NOW() - INTERVAL '5 minutes', false, 'Incident: Payment API Timeout has been created.', 'INCIDENT_CREATED', v_deployment_id_1, 5
    );

    -- 8. Insert Containers and Pods
    INSERT INTO containers (
        container_status, created_at, image_name, deployment_id
    ) VALUES (
        'RUNNING', NOW() - INTERVAL '2 hours', 'opspilot/payment-gateway:v2.4.1', v_deployment_id_1
    ) RETURNING container_id INTO v_container_id;

    INSERT INTO pods (
        cpu_usage, memory_usage, namespace, node_name, pod_name, pod_status, container_id
    ) VALUES (
        '150m', '256Mi', 'default', 'minikube-node-1', 'payment-gateway-pod-abc', 'Running', v_container_id
    );

END $$;
