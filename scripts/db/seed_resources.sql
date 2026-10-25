BEGIN;

-- Delete old duplicate test resources
DELETE FROM resources WHERE provider_resource_id LIKE 'k8s-%' OR provider_resource_id LIKE 'docker-host-%';

-- 1. Kubernetes Pods in production & default namespaces
INSERT INTO resources (project_id, name, provider, provider_resource_id, resource_type, status, environment, metadata, created_at, updated_at) VALUES
(4, 'attendance-api (pod)', 'KUBERNETES', 'k8s-pod-attendance-api', 'POD', 'HEALTHY', 'production', '{"namespace":"production","replicas":2,"cpu":"1m","memory":"11Mi","status":"Running"}', NOW(), NOW()),
(3, 'notesapp-backend (pod)', 'KUBERNETES', 'k8s-pod-notesapp-backend', 'POD', 'HEALTHY', 'production', '{"namespace":"production","replicas":2,"cpu":"2m","memory":"17Mi","status":"Running"}', NOW(), NOW()),
(3, 'notesapp-redis (pod)', 'KUBERNETES', 'k8s-pod-notesapp-redis', 'POD', 'HEALTHY', 'production', '{"namespace":"production","replicas":1,"cpu":"9m","memory":"3Mi","status":"Running"}', NOW(), NOW()),
(7, 'ecommerce-gateway (pod)', 'KUBERNETES', 'k8s-pod-ecommerce-gateway', 'POD', 'HEALTHY', 'production', '{"namespace":"production","replicas":2,"cpu":"0m","memory":"14Mi","status":"Running"}', NOW(), NOW()),
(6, 'cafe-order-processor (pod)', 'KUBERNETES', 'k8s-pod-cafe-order-processor', 'POD', 'HEALTHY', 'production', '{"namespace":"production","replicas":1,"cpu":"1m","memory":"11Mi","status":"Running"}', NOW(), NOW()),
(9, 'gemini-pipeline-worker (pod)', 'KUBERNETES', 'k8s-pod-gemini-pipeline-worker', 'POD', 'HEALTHY', 'production', '{"namespace":"production","replicas":1,"cpu":"0m","memory":"5Mi","status":"Running"}', NOW(), NOW()),
(5, 'opspilot-test-harness (pod)', 'KUBERNETES', 'k8s-pod-opspilot-test-harness', 'POD', 'HEALTHY', 'production', '{"namespace":"default","replicas":2,"cpu":"0m","memory":"10Mi","status":"Running"}', NOW(), NOW()),
(3, 'notesapp-sync-agent (pod)', 'KUBERNETES', 'k8s-pod-notesapp-sync-agent', 'POD', 'HEALTHY', 'production', '{"namespace":"default","replicas":1,"cpu":"1m","memory":"7Mi","status":"Running"}', NOW(), NOW());

-- 2. Original Docker Host Containers
INSERT INTO resources (project_id, name, provider, provider_resource_id, resource_type, status, environment, metadata, created_at, updated_at) VALUES
(3, 'notesapp-worker (container)', 'DOCKER', 'docker-host-notesapp-worker', 'CONTAINER', 'HEALTHY', 'production', '{"image":"node:20-alpine","service":"notesapp-worker","interval":"8s"}', NOW(), NOW()),
(4, 'attendance-sync-daemon (container)', 'DOCKER', 'docker-host-attendance-sync-daemon', 'CONTAINER', 'HEALTHY', 'production', '{"image":"node:20-alpine","integration":"SnapDeploy","interval":"9s"}', NOW(), NOW()),
(7, 'ecommerce-cache-worker (container)', 'DOCKER', 'docker-host-ecommerce-cache-worker', 'CONTAINER', 'HEALTHY', 'production', '{"image":"node:20-alpine","service":"ecommerce-cache","interval":"11s"}', NOW(), NOW()),
(6, 'cafe-order-stream (container)', 'DOCKER', 'docker-host-cafe-order-stream', 'CONTAINER', 'HEALTHY', 'production', '{"image":"node:20-alpine","service":"cafe-order-stream","interval":"7s"}', NOW(), NOW());

-- 3. Cloud Infrastructure Resources
INSERT INTO resources (project_id, name, provider, provider_resource_id, resource_type, status, environment, metadata, created_at, updated_at) VALUES
(7, 'ecommerce-static-assets (S3)', 'AWS', 'aws-s3-ecommerce-assets', 'STORAGE_BUCKET', 'HEALTHY', 'production', '{"region":"us-east-1","bucket":"opspilot-ecommerce-assets","encryption":"AES256"}', NOW(), NOW()),
(9, 'gemini-inference-edge (Vercel)', 'VERCEL', 'vercel-gemini-edge', 'SERVERLESS_FUNCTION', 'HEALTHY', 'production', '{"runtime":"edge","region":"iad1","status":"READY"}', NOW(), NOW());

COMMIT;
