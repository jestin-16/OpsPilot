BEGIN;

-- 1. Ensure user Jestin Shaji exists with id 5
-- (Already id 5: jestinshajik@gmail.com)

-- 2. Add realistic commit logs
INSERT INTO commit_logs (author, branch_name, commit_sha, message, timestamp, project_id) VALUES
('jestin-16', 'main', '8f7a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2', 'feat(auth): add biometric device validation and sync heartbeat', NOW() - INTERVAL '3 hours', 4),
('jestin-16', 'main', '3e4a5b6c7d8e9f0112233445566778899aabbcc', 'perf(cache): implement Redis LRU cache for note search index', NOW() - INTERVAL '5 hours', 3),
('jestin-16', 'main', 'a1b2c3d4e5f67890123456789abcdef01234567', 'fix(checkout): address stripe webhook idempotency issue in cart sessions', NOW() - INTERVAL '1 day', 7),
('jestin-16', 'main', 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1', 'feat(pos): real-time kitchen display sync via web socket channels', NOW() - INTERVAL '2 days', 6),
('jestin-16', 'main', 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c2d', 'ci(pipeline): enable automated multi-arch docker image build & push', NOW() - INTERVAL '3 days', 9)
ON CONFLICT DO NOTHING;

-- 3. Add realistic pipeline runs
INSERT INTO pipeline_runs (author, branch, commit_message, commit_sha, created_at, duration_ms, event_type, exit_code, external_run_id, repo_url, status, project_id, source_id, build_logs) VALUES
('jestin-16', 'main', 'feat(auth): add biometric device validation and sync heartbeat', '8f7a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2', NOW() - INTERVAL '3 hours', 48200, 'push', 0, '4102948192', 'https://github.com/jestin-16/attendance-backend', 'SUCCESS', 4, 1, 'Build succeeded in 48.2s. 24 unit tests passed. Docker image pushed to registry.'),
('jestin-16', 'main', 'perf(cache): implement Redis LRU cache for note search index', '3e4a5b6c7d8e9f0112233445566778899aabbcc', NOW() - INTERVAL '5 hours', 53400, 'push', 0, '4102837190', 'https://github.com/jestin-16/notesapp', 'SUCCESS', 3, 1, 'Build succeeded in 53.4s. 18 integration tests passed.'),
('jestin-16', 'main', 'fix(checkout): address stripe webhook idempotency issue in cart sessions', 'a1b2c3d4e5f67890123456789abcdef01234567', NOW() - INTERVAL '1 day', 71200, 'push', 0, '4091827411', 'https://github.com/jestin-16/ecommerce', 'SUCCESS', 7, 1, 'Build completed successfully. Container deployed to production cluster.'),
('jestin-16', 'main', 'feat(pos): real-time kitchen display sync via web socket channels', 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1', NOW() - INTERVAL '2 days', 42100, 'push', 0, '4081729402', 'https://github.com/jestin-16/cafe', 'SUCCESS', 6, 1, 'Build succeeded. Lint checks: 0 warnings.'),
('jestin-16', 'main', 'ci(pipeline): enable automated multi-arch docker image build & push', 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c2d', NOW() - INTERVAL '3 days', 89000, 'push', 0, '4071829301', 'https://github.com/jestin-16/gemini-pipeline', 'SUCCESS', 9, 1, 'Multi-arch build [linux/amd64, linux/arm64] completed successfully.');

-- 4. Add realistic deployments
INSERT INTO deployments (deployed_at, environment, status, version, deployed_by_id, project_id, source, url, actor, updated_at) VALUES
(NOW() - INTERVAL '2 hours 45 minutes', 'production', 'Succeeded', 'v1.4.2', 5, 4, 'GITHUB_ACTIONS', 'https://attendance-backend-c0495.containers.snapdeploy.app', 'jestinshajik@gmail.com', NOW() - INTERVAL '2 hours 45 minutes'),
(NOW() - INTERVAL '4 hours 30 minutes', 'production', 'Succeeded', 'v2.4.1', 5, 3, 'GITHUB_ACTIONS', 'https://notesapp.jestin16.dev', 'jestinshajik@gmail.com', NOW() - INTERVAL '4 hours 30 minutes'),
(NOW() - INTERVAL '18 hours', 'production', 'Succeeded', 'v3.1.2', 5, 7, 'GITHUB_ACTIONS', 'https://shop.jestin16.dev', 'jestinshajik@gmail.com', NOW() - INTERVAL '18 hours'),
(NOW() - INTERVAL '1 day 12 hours', 'production', 'Succeeded', 'v1.2.0', 5, 6, 'GITHUB_ACTIONS', 'https://cafe.jestin16.dev', 'jestinshajik@gmail.com', NOW() - INTERVAL '1 day 12 hours'),
(NOW() - INTERVAL '2 days 4 hours', 'production', 'Succeeded', 'v2.0.0', 5, 9, 'GITHUB_ACTIONS', 'https://gemini-pipeline.jestin16.dev', 'jestinshajik@gmail.com', NOW() - INTERVAL '2 days 4 hours'),
(NOW() - INTERVAL '3 days', 'staging', 'Succeeded', 'v1.5.0-rc1', 5, 4, 'MANUAL', 'https://staging.attendance.jestin16.dev', 'jestinshajik@gmail.com', NOW() - INTERVAL '3 days');

-- 5. Add registered container records
INSERT INTO containers (container_status, created_at, image_name, deployment_id)
SELECT 'RUNNING', d.deployed_at, 'attendance-api:v1.4.2', d.id FROM deployments d WHERE d.project_id = 4 AND d.version = 'v1.4.2' LIMIT 1;

INSERT INTO containers (container_status, created_at, image_name, deployment_id)
SELECT 'RUNNING', d.deployed_at, 'notesapp-backend:v2.4.1', d.id FROM deployments d WHERE d.project_id = 3 AND d.version = 'v2.4.1' LIMIT 1;

INSERT INTO containers (container_status, created_at, image_name, deployment_id)
SELECT 'RUNNING', d.deployed_at, 'ecommerce-gateway:v3.1.2', d.id FROM deployments d WHERE d.project_id = 7 AND d.version = 'v3.1.2' LIMIT 1;

INSERT INTO containers (container_status, created_at, image_name, deployment_id)
SELECT 'RUNNING', d.deployed_at, 'cafe-order-processor:v1.2.0', d.id FROM deployments d WHERE d.project_id = 6 AND d.version = 'v1.2.0' LIMIT 1;

INSERT INTO containers (container_status, created_at, image_name, deployment_id)
SELECT 'RUNNING', d.deployed_at, 'gemini-pipeline-worker:v2.0.0', d.id FROM deployments d WHERE d.project_id = 9 AND d.version = 'v2.0.0' LIMIT 1;

-- 6. Add realistic operational incidents
INSERT INTO incidents (title, description, severity, status, alert_count, affected_service, affected_resources, started_at, resolved_at, created_at, created_by_id, project_id, timeline) VALUES
(
    'SnapDeploy Biometric Sync Webhook Timeout',
    'Biometric attendance check-in requests experienced a 2.4s latency increase due to an upstream rate limit on the SnapDeploy container bridge. Auto-retry mechanism buffered 14 records and flushed successfully after network route normalization.',
    'MEDIUM',
    'RESOLVED',
    3,
    'attendance-backend',
    'pod/attendance-api, snapdeploy-sync-daemon',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '4 hours 30 minutes',
    NOW() - INTERVAL '6 hours',
    5,
    4,
    '[{"time":"-6h","event":"Latency spike detected (>2000ms)"},{"time":"-5h 30m","event":"OpsPilot AI recommended TCP keepalive optimization"},{"time":"-4h 30m","event":"Resolved: Sync latency returned to 38ms baseline"}]'
),
(
    'Redis Cache Memory Pressure in NotesApp',
    'Note search indexing reached 85% of allocated cache threshold during morning user login rush. Memory policy automatically evicted expired sessions with zero customer impact.',
    'LOW',
    'RESOLVED',
    1,
    'notesapp-redis',
    'deployment/notesapp-redis',
    NOW() - INTERVAL '1 day 2 hours',
    NOW() - INTERVAL '1 day 1 hour',
    NOW() - INTERVAL '1 day 2 hours',
    5,
    3,
    '[{"time":"-26h","event":"Memory warning triggered at 85%"},{"time":"-25h","event":"Resolved: Cache memory stabilized at 54%"}]'
),
(
    'E-Commerce Cart Checkout Gateway Performance Anomaly',
    'Intermittent 502 Bad Gateway responses observed from downstream payment callback handler during flash sale test run. Scale-up of gateway pods resolved the queue backlog.',
    'HIGH',
    'RESOLVED',
    5,
    'ecommerce-gateway',
    'deployment/ecommerce-gateway',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day 20 hours',
    NOW() - INTERVAL '2 days',
    5,
    7,
    '[{"time":"-48h","event":"502 error rate exceeded 3% threshold"},{"time":"-46h","event":"Replicas increased from 1 to 2"},{"time":"-44h","event":"Resolved: Error rate dropped to 0.01%"}]'
);

-- 7. Add notifications for user 5
INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES
(5, 'DEPLOYMENT_SUCCESS', 'Deployment v1.4.2 of Attendance Backend successfully deployed to Production.', false, NOW() - INTERVAL '2 hours 45 minutes'),
(5, 'DEPLOYMENT_SUCCESS', 'Deployment v2.4.1 of NotesApp successfully deployed to Production.', false, NOW() - INTERVAL '4 hours 30 minutes'),
(5, 'INCIDENT_RESOLVED', 'Incident Resolved: SnapDeploy Biometric Sync Webhook Timeout (attendance-backend).', false, NOW() - INTERVAL '4 hours 30 minutes'),
(5, 'KUBERNETES_ALERT', 'Cluster Health: K3s node ffdad87fc733 is Ready with 15 healthy pods.', true, NOW() - INTERVAL '5 hours'),
(5, 'DEPLOYMENT_SUCCESS', 'Deployment v3.1.2 of E-Commerce Platform successfully deployed to Production.', true, NOW() - INTERVAL '18 hours');

-- 8. Add registered Log Sources
INSERT INTO log_sources (source_name, ingestion_mode, auth_method, is_active, poll_interval_seconds, poll_endpoint_url, created_at, field_mapping, project_id, public_id) VALUES
('SnapDeploy Container Poller', 'POLL', 'BEARER_TOKEN', true, 10, 'https://attendance-backend-c0495.containers.snapdeploy.app/health', NOW() - INTERVAL '2 days', '{"messageField":"message","levelField":"level","timestampField":"timestamp"}', 4, 'ls_snapdeploy_attendance_poller'),
('NotesApp Docker Stream', 'STREAM', 'NONE', true, 5, 'http://notesapp-worker:3000/logs', NOW() - INTERVAL '3 days', '{"messageField":"event","levelField":"level","timestampField":"timestamp"}', 3, 'ls_notesapp_docker_stream'),
('E-Commerce Gateway Access', 'POLL', 'API_KEY', true, 15, 'http://ecommerce-gateway/health', NOW() - INTERVAL '4 days', '{"messageField":"message","levelField":"status","timestampField":"time"}', 7, 'ls_ecommerce_gateway_logs');

COMMIT;
