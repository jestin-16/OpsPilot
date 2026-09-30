-- Demo Data for jestinshajik@gmail.com (User ID: 5)
-- We will insert a project, a deployment, and a pipeline run.

DO $$
DECLARE
    v_project_id bigint;
    v_deployment_id bigint;
BEGIN

    -- 1. Insert a mock project
    INSERT INTO projects (
        created_at, project_name, description, repository_url, status, owner_id, github_repo_name
    ) VALUES (
        NOW(),
        'Payment Gateway Service',
        'Demo microservice for processing Stripe payments.',
        'https://github.com/jestin-16/payment-gateway',
        'Active',
        5,
        'payment-gateway'
    ) RETURNING id INTO v_project_id;

    -- 2. Insert a deployment for the project
    INSERT INTO deployments (
        deployed_at, environment, status, version, deployed_by_id, project_id
    ) VALUES (
        NOW() - INTERVAL '2 hours',
        'Production',
        'Running',
        'v2.4.1',
        5,
        v_project_id
    ) RETURNING id INTO v_deployment_id;

    -- 3. Insert a pipeline run for the project
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
        v_project_id,
        '[INFO] Building Payment Gateway\n[INFO] Tests passed\n[INFO] SUCCESS'
    );

    -- 4. Insert some commits
    INSERT INTO commit_logs (
        author, branch_name, commit_sha, message, timestamp, project_id
    ) VALUES (
        'jestinshajik', 'main', 'a1b2c3d4e5f6g7h8', 'fix: resolve race condition in payment webhook', NOW() - INTERVAL '3 hours', v_project_id
    ), (
        'jestinshajik', 'main', 'f8e7d6c5b4a3', 'feat: integrate Stripe API v3', NOW() - INTERVAL '1 day', v_project_id
    );

END $$;
