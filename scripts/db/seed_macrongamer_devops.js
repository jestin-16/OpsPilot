const fs = require('fs');

let sql = `BEGIN;

-- 1. Set themacrongamer@gmail.com as DEVOPS and jestinshajik@gmail.com as DEVELOPER
UPDATE users
SET is_active = true, email_verified = true
WHERE email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com', 'jestinshajik@gmail.com');

DELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE email = 'jestinshajik@gmail.com');
INSERT INTO user_roles (user_id, role_id)
SELECT id, 1 FROM users WHERE email = 'jestinshajik@gmail.com';

DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com'));
INSERT INTO user_roles (user_id, role_id)
SELECT id, 2 FROM users WHERE email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com');

-- 3. Alert Rules (DevOps Workbench)
DELETE FROM alert_rules;

INSERT INTO alert_rules (enabled, event_type, project_id, resource, severity, threshold, time_window, notification_policy) VALUES
(true, 'HTTP_5XX_ERROR_SPIKE', 7, 'ecommerce-gateway', 'HIGH', 5, 120, 'SLACK_DEVOPS_CRITICAL'),
(true, 'POD_RESTART_THRESHOLD', 4, 'attendance-api', 'CRITICAL', 2, 300, 'PAGERDUTY_ONCALL'),
(true, 'CONTAINER_CPU_UTILIZATION_85', 6, 'cafe-order-stream', 'HIGH', 85, 180, 'EMAIL_DEVOPS_TEAM'),
(true, 'DATABASE_POOL_SATURATION', 3, 'notesapp-backend', 'HIGH', 90, 60, 'SLACK_DATABASE_ALERTS'),
(true, 'INGESTION_LATENCY_ANOMALY', 9, 'gemini-pipeline-worker', 'MEDIUM', 2500, 300, 'DIGEST_HOURLY'),
(true, 'KUBERNETES_NODE_PRESSURE', NULL, 'k8s-node-production', 'HIGH', 80, 180, 'PAGERDUTY_ONCALL');

-- 4. Alerts (Realistic operational status)
DELETE FROM alerts;

INSERT INTO alerts (event_type, message, project_id, resource, severity, status, created_at, resolved_at, alert_rule_id) VALUES
(
  'HTTP_5XX_ERROR_SPIKE',
  'Downstream checkout response degradation: 504 Gateway Timeout rate exceeded 2% threshold during flash promotion event',
  7,
  'ecommerce-gateway',
  'HIGH',
  'RESOLVED',
  NOW() - INTERVAL '1 hour 45 minutes',
  NOW() - INTERVAL '1 hour 15 minutes',
  (SELECT id FROM alert_rules WHERE event_type = 'HTTP_5XX_ERROR_SPIKE' LIMIT 1)
),
(
  'CONTAINER_CPU_UTILIZATION_85',
  'CPU burst on cafe-order-stream container reached 88% for 180 seconds during lunch ordering rush',
  6,
  'cafe-order-stream',
  'MEDIUM',
  'RESOLVED',
  NOW() - INTERVAL '3 hours 20 minutes',
  NOW() - INTERVAL '3 hours',
  (SELECT id FROM alert_rules WHERE event_type = 'CONTAINER_CPU_UTILIZATION_85' LIMIT 1)
),
(
  'DATABASE_POOL_SATURATION',
  'HikariCP connection pool usage reached 87% in notesapp-backend during index sync batch',
  3,
  'notesapp-backend',
  'HIGH',
  'RESOLVED',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '5 hours 40 minutes',
  (SELECT id FROM alert_rules WHERE event_type = 'DATABASE_POOL_SATURATION' LIMIT 1)
),
(
  'INGESTION_LATENCY_ANOMALY',
  'Multimodal embedding inference batch queue latency exceeded 2,200ms threshold on worker-01',
  9,
  'gemini-pipeline-worker',
  'MEDIUM',
  'RESOLVED',
  NOW() - INTERVAL '12 hours',
  NOW() - INTERVAL '11 hours 30 minutes',
  (SELECT id FROM alert_rules WHERE event_type = 'INGESTION_LATENCY_ANOMALY' LIMIT 1)
),
(
  'KUBERNETES_NODE_PRESSURE',
  'Worker node k8s-node-worker-01 memory pressure warning: 78% utilized. Automated container balance stabilized load',
  NULL,
  'k8s-node-worker-01',
  'LOW',
  'RESOLVED',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '23 hours',
  (SELECT id FROM alert_rules WHERE event_type = 'KUBERNETES_NODE_PRESSURE' LIMIT 1)
);

-- 5. Infrastructure Events (for 3D Operations and Command Center)
DELETE FROM infrastructure_events;

INSERT INTO infrastructure_events (id, event_type, project_id, integration_id, message, metadata, provider, resource_id, severity, timestamp) VALUES
(
  'evt_hpa_ecom_9812',
  'KUBERNETES_HPA_SCALE_UP',
  7,
  (SELECT id FROM integrations WHERE project_id = 7 AND provider = 'KUBERNETES' LIMIT 1),
  'HorizontalPodAutoscaler scaled deployment/ecommerce-gateway from 2 to 3 replicas due to checkout traffic surge',
  '{"currentReplicas":3,"desiredReplicas":3,"cpuTarget":70,"actualCpu":78,"namespace":"production"}',
  'KUBERNETES',
  'k8s-pod-ecommerce-gateway',
  'INFO',
  NOW() - INTERVAL '18 minutes'
),
(
  'evt_chk_cafe_4819',
  'CONTAINER_HEALTHCHECK_PASS',
  6,
  (SELECT id FROM integrations WHERE project_id = 6 AND provider = 'DOCKER' LIMIT 1),
  'Docker Engine healthcheck: cafe-order-stream TCP keepalive and WebSocket bridge verified on port 8080',
  '{"container":"cafe-order-stream","port":8080,"status":"healthy","uptime":"6h"}',
  'DOCKER',
  'docker-host-cafe-order-stream',
  'INFO',
  NOW() - INTERVAL '25 minutes'
),
(
  'evt_tls_renew_0192',
  'INGRESS_TLS_RENEWED',
  NULL,
  NULL,
  'Automated TLS certificate renewal completed for *.jestin16.dev via Cloudflare Zero Trust Edge (valid 90 days)',
  '{"issuer":"Let''s Encrypt","domain":"*.jestin16.dev","daysValid":90}',
  'CLOUDFLARE',
  'edge-router',
  'INFO',
  NOW() - INTERVAL '1 hour 10 minutes'
),
(
  'evt_rollout_notes_7812',
  'KUBERNETES_ROLLOUT_SUCCESS',
  3,
  (SELECT id FROM integrations WHERE project_id = 3 AND provider = 'KUBERNETES' LIMIT 1),
  'Rolling update for deployment/notesapp-backend completed successfully. 2/2 pods ready with zero downtime',
  '{"deployment":"notesapp-backend","version":"v2.4.2","strategy":"RollingUpdate","replicas":2}',
  'KUBERNETES',
  'k8s-pod-notesapp-backend',
  'INFO',
  NOW() - INTERVAL '2 hours 15 minutes'
),
(
  'evt_sync_snapdeploy_8921',
  'SNAPDEPLOY_BRIDGE_CONNECTED',
  4,
  (SELECT id FROM integrations WHERE project_id = 4 AND provider = 'DOCKER' LIMIT 1),
  'SnapDeploy edge tunnel established for attendance-backend-c0495 container live telemetry stream',
  '{"bridge":"https://attendance-backend-c0495.containers.snapdeploy.app","status":"STREAMING"}',
  'SNAPDEPLOY',
  'snapdeploy-attendance-backend-c0495',
  'INFO',
  NOW() - INTERVAL '3 hours'
),
(
  'evt_prom_scrape_3910',
  'PROMETHEUS_TARGET_SYNC',
  NULL,
  NULL,
  'Prometheus service discovery: 14/14 scrape targets reporting UP across production cluster and host exporters',
  '{"activeTargets":14,"droppedTargets":0,"scrapeInterval":"15s"}',
  'PROMETHEUS',
  'prometheus-internal',
  'INFO',
  NOW() - INTERVAL '12 minutes'
),
(
  'evt_gemini_tensorrt_1928',
  'GPU_RUNTIME_READY',
  9,
  (SELECT id FROM integrations WHERE project_id = 9 AND provider = 'DOCKER' LIMIT 1),
  'TensorRT inference engine allocated 4096MB VRAM for multimodal batch processing jobs',
  '{"gpu":"NVIDIA A10G","engine":"TensorRT 9.2","vramMB":4096}',
  'DOCKER',
  'docker-host-gemini-pipeline',
  'INFO',
  NOW() - INTERVAL '4 hours 30 minutes'
);

-- 6. Notifications for Macron Gamer (user themacrongamer@gmail.com and macrongamer@gmail.com)
INSERT INTO notifications (user_id, type, message, is_read, created_at, deployment_id)
SELECT u.id, 'DEPLOYMENT_SUCCESS', 'Production deployment v3.1.3 of E-Commerce Platform successfully completed by DevOps.', false, NOW() - INTERVAL '45 minutes', (SELECT id FROM deployments WHERE project_id = 7 ORDER BY id DESC LIMIT 1)
FROM users u WHERE u.email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com', 'jestinshajik@gmail.com')
AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.message LIKE '%v3.1.3 of E-Commerce%');

INSERT INTO notifications (user_id, type, message, is_read, created_at)
SELECT u.id, 'ALERT_RESOLVED', 'Alert Auto-Resolved: High memory pressure on notesapp-redis normalized to 54%.', false, NOW() - INTERVAL '1 hour 20 minutes'
FROM users u WHERE u.email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com', 'jestinshajik@gmail.com')
AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.message LIKE '%notesapp-redis normalized%');

INSERT INTO notifications (user_id, type, message, is_read, created_at)
SELECT u.id, 'PIPELINE_SUCCESS', 'CI/CD Pipeline #4108273911 for Employee Service passed all 16 integration tests and security scans.', false, NOW() - INTERVAL '2 hours'
FROM users u WHERE u.email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com', 'jestinshajik@gmail.com')
AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.message LIKE '%#4108273911 for Employee Service%');

INSERT INTO notifications (user_id, type, message, is_read, created_at)
SELECT u.id, 'SECURITY_AUDIT', 'OpsPilot Security: Periodic credential rotation and container CVE scan passed with 0 critical issues.', false, NOW() - INTERVAL '4 hours'
FROM users u WHERE u.email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com', 'jestinshajik@gmail.com')
AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.message LIKE '%Periodic credential rotation%');

INSERT INTO notifications (user_id, type, message, is_read, created_at)
SELECT u.id, 'KUBERNETES_HEALTH', 'Kubernetes Cluster Status: All 8 production workloads reporting HEALTHY with 100% readiness.', false, NOW() - INTERVAL '6 hours'
FROM users u WHERE u.email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com', 'jestinshajik@gmail.com')
AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.message LIKE '%All 8 production workloads reporting%');

-- 7. Audit Logs for Macron Gamer
INSERT INTO audit_logs (action, details, resource_id, resource_type, timestamp, user_id)
SELECT 'DEPLOYMENT_TRIGGER', 'Triggered automated rolling deployment for ecommerce-gateway:v3.1.3 (commit a1b2c3d4)', '7', 'DEPLOYMENT', NOW() - INTERVAL '50 minutes', u.id
FROM users u WHERE u.email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com', 'jestinshajik@gmail.com')
AND NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.user_id = u.id AND a.action = 'DEPLOYMENT_TRIGGER');

INSERT INTO audit_logs (action, details, resource_id, resource_type, timestamp, user_id)
SELECT 'CONFIG_SYNC', 'Applied updated Kubernetes resource requests and limits in production namespace', 'k8s-production', 'KUBERNETES', NOW() - INTERVAL '2 hours', u.id
FROM users u WHERE u.email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com', 'jestinshajik@gmail.com')
AND NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.user_id = u.id AND a.action = 'CONFIG_SYNC');

INSERT INTO audit_logs (action, details, resource_id, resource_type, timestamp, user_id)
SELECT 'CONNECTOR_HEALTH_CHECK', 'Executed manual health check across all 7 project integrations: All 35 connections verified', 'integrations-batch', 'INTEGRATION', NOW() - INTERVAL '3 hours 15 minutes', u.id
FROM users u WHERE u.email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com', 'jestinshajik@gmail.com')
AND NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.user_id = u.id AND a.action = 'CONNECTOR_HEALTH_CHECK');

INSERT INTO audit_logs (action, details, resource_id, resource_type, timestamp, user_id)
SELECT 'USER_LOGIN_GOOGLE', 'User authenticated via Google OAuth with elevated DEVOPS privileges: ' || u.email, u.id::text, 'USER', NOW() - INTERVAL '10 minutes', u.id
FROM users u WHERE u.email IN ('themacrongamer@gmail.com', 'macrongamer@gmail.com', 'jestinshajik@gmail.com')
AND NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.user_id = u.id AND a.action = 'USER_LOGIN_GOOGLE' AND a.timestamp > NOW() - INTERVAL '30 minutes');

-- 8. Add recent deployment record deployed by DevOps
INSERT INTO deployments (deployed_at, environment, status, version, deployed_by_id, project_id, source, url, actor, updated_at)
SELECT NOW() - INTERVAL '50 minutes', 'production', 'Succeeded', 'v3.1.3', u.id, 7, 'GITHUB_ACTIONS', 'https://shop.jestin16.dev', u.email, NOW() - INTERVAL '50 minutes'
FROM users u WHERE u.email = 'themacrongamer@gmail.com'
AND NOT EXISTS (SELECT 1 FROM deployments WHERE project_id = 7 AND version = 'v3.1.3');

COMMIT;
`;

fs.writeFileSync('c:\\Users\\jesvi\\OpsPilot\\scripts\\db\\seed_macrongamer_devops.sql', sql);
console.log('Generated c:\\Users\\jesvi\\OpsPilot\\scripts\\db\\seed_macrongamer_devops.sql');
