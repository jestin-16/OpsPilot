const fs = require('fs');
const crypto = require('crypto');

const rawKey = process.env.INTEGRATIONS_SECRET_KEY || 'eQx1Mz3kpcG+XRzd77E/Kthsszbn+cv+oveht9RneTM=';
const key = crypto.createHash('sha256').update(rawKey, 'utf8').digest();

function encryptSecret(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(obj);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, enc, tag]);
  return 'enc:v1:' + combined.toString('base64');
}

function makeToken(nameSeed) {
  const bytes = crypto.randomBytes(24);
  const raw = `opl_${nameSeed}_` + bytes.toString('base64url');
  const prefix = raw.substring(0, 12);
  const hash = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
  return { raw, prefix, hash };
}

const integrationsToAdd = [
  // -------------------------------------------------------------
  // Project 6: Cafe Management (cafe)
  // -------------------------------------------------------------
  {
    projectId: 6,
    provider: 'GITHUB',
    name: 'GitHub Repository',
    category: 'SOURCE_CONTROL',
    status: 'CONNECTED',
    config: JSON.stringify({ repo: 'jestin-16/cafe', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_cafe_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 4
  },
  {
    projectId: 6,
    provider: 'CICD',
    name: 'GitHub Actions CI/CD',
    category: 'CICD',
    status: 'CONNECTED',
    config: JSON.stringify({ provider: 'GITHUB_ACTIONS', repo: 'jestin-16/cafe', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_cafe_act_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 3
  },
  {
    projectId: 6,
    provider: 'DOCKER',
    name: 'Cafe Order Stream Container',
    category: 'CONTAINER',
    status: 'CONNECTED',
    config: JSON.stringify({ host: 'https://cafe.containers.snapdeploy.app', containers: 'cafe-order-stream' }),
    credentials: null,
    token: null,
    healthMinAgo: 5
  },
  {
    projectId: 6,
    provider: 'KUBERNETES',
    name: 'Production K8s Cluster (cafe)',
    category: 'KUBERNETES',
    status: 'CONNECTED',
    config: JSON.stringify({
      apiServer: 'https://opspilot-k3s:6443',
      namespace: 'production',
      podName: 'cafe-order-processor',
      labelSelector: 'app=cafe-order-processor'
    }),
    credentials: encryptSecret({ token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJwcm9kdWN0aW9uIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OnByb2R1Y3Rpb246Y2FmZS1zZXJ2aWNlIn0.signature' }),
    token: null,
    healthMinAgo: 2
  },
  {
    projectId: 6,
    provider: 'APP_LOGS',
    name: 'Cafe Orders API Logs',
    category: 'APPLICATION',
    status: 'CONNECTED',
    config: JSON.stringify({ app: 'cafe-orders' }),
    credentials: null,
    token: makeToken('cafe_ord'),
    healthMinAgo: 1
  },

  // -------------------------------------------------------------
  // Project 7: E-Commerce Platform (ecommerce)
  // -------------------------------------------------------------
  {
    projectId: 7,
    provider: 'GITHUB',
    name: 'GitHub Repository',
    category: 'SOURCE_CONTROL',
    status: 'CONNECTED',
    config: JSON.stringify({ repo: 'jestin-16/ecommerce', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_ecom_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 6
  },
  {
    projectId: 7,
    provider: 'CICD',
    name: 'Storefront CI/CD Pipeline',
    category: 'CICD',
    status: 'CONNECTED',
    config: JSON.stringify({ provider: 'GITHUB_ACTIONS', repo: 'jestin-16/ecommerce', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_ecom_act_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 5
  },
  {
    projectId: 7,
    provider: 'DOCKER',
    name: 'Redis Cache Worker Container',
    category: 'CONTAINER',
    status: 'CONNECTED',
    config: JSON.stringify({ host: 'https://ecommerce.containers.snapdeploy.app', containers: 'ecommerce-cache-worker' }),
    credentials: null,
    token: null,
    healthMinAgo: 7
  },
  {
    projectId: 7,
    provider: 'KUBERNETES',
    name: 'Production K8s Cluster (ecommerce)',
    category: 'KUBERNETES',
    status: 'CONNECTED',
    config: JSON.stringify({
      apiServer: 'https://opspilot-k3s:6443',
      namespace: 'production',
      podName: 'ecommerce-gateway',
      labelSelector: 'app=ecommerce-gateway'
    }),
    credentials: encryptSecret({ token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJwcm9kdWN0aW9uIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OnByb2R1Y3Rpb246ZWNvbW1lcmNlLWdhdGV3YXkifQ.signature' }),
    token: null,
    healthMinAgo: 1
  },
  {
    projectId: 7,
    provider: 'APP_LOGS',
    name: 'Checkout & Cart Gateway Logs',
    category: 'APPLICATION',
    status: 'CONNECTED',
    config: JSON.stringify({ app: 'ecommerce-gateway' }),
    credentials: null,
    token: makeToken('ecom_gw'),
    healthMinAgo: 2
  },

  // -------------------------------------------------------------
  // Project 8: Employee Service (employee-service)
  // -------------------------------------------------------------
  {
    projectId: 8,
    provider: 'GITHUB',
    name: 'GitHub Repository',
    category: 'SOURCE_CONTROL',
    status: 'CONNECTED',
    config: JSON.stringify({ repo: 'jestin-16/Employee', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_emp_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 8
  },
  {
    projectId: 8,
    provider: 'CICD',
    name: 'Payroll & HR Service Pipeline',
    category: 'CICD',
    status: 'CONNECTED',
    config: JSON.stringify({ provider: 'GITHUB_ACTIONS', repo: 'jestin-16/Employee', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_emp_act_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 7
  },
  {
    projectId: 8,
    provider: 'DOCKER',
    name: 'Employee Service Container',
    category: 'CONTAINER',
    status: 'CONNECTED',
    config: JSON.stringify({ host: 'https://employee.containers.snapdeploy.app', containers: 'employee-service-api' }),
    credentials: null,
    token: null,
    healthMinAgo: 9
  },
  {
    projectId: 8,
    provider: 'KUBERNETES',
    name: 'Internal Services K8s Cluster',
    category: 'KUBERNETES',
    status: 'CONNECTED',
    config: JSON.stringify({
      apiServer: 'https://opspilot-k3s:6443',
      namespace: 'production',
      podName: 'employee-service-api',
      labelSelector: 'app=employee-service'
    }),
    credentials: encryptSecret({ token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJwcm9kdWN0aW9uIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OnByb2R1Y3Rpb246ZW1wbG95ZWUtc2VydmljZSJ9.signature' }),
    token: null,
    healthMinAgo: 3
  },
  {
    projectId: 8,
    provider: 'APP_LOGS',
    name: 'Employee Directory Service Logs',
    category: 'APPLICATION',
    status: 'CONNECTED',
    config: JSON.stringify({ app: 'employee-service' }),
    credentials: null,
    token: makeToken('emp_dir'),
    healthMinAgo: 4
  },

  // -------------------------------------------------------------
  // Project 9: Gemini Image Pipeline (gemini-pipeline)
  // -------------------------------------------------------------
  {
    projectId: 9,
    provider: 'GITHUB',
    name: 'GitHub Repository',
    category: 'SOURCE_CONTROL',
    status: 'CONNECTED',
    config: JSON.stringify({ repo: 'jestin-16/gemini-pipeline', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_gemini_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 5
  },
  {
    projectId: 9,
    provider: 'CICD',
    name: 'Multimodal Inference Build Pipeline',
    category: 'CICD',
    status: 'CONNECTED',
    config: JSON.stringify({ provider: 'GITHUB_ACTIONS', repo: 'jestin-16/gemini-pipeline', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_gemini_act_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 4
  },
  {
    projectId: 9,
    provider: 'DOCKER',
    name: 'Batch Inference GPU Container',
    category: 'CONTAINER',
    status: 'CONNECTED',
    config: JSON.stringify({ host: 'https://gemini-pipeline.containers.snapdeploy.app', containers: 'gemini-pipeline-worker' }),
    credentials: null,
    token: null,
    healthMinAgo: 6
  },
  {
    projectId: 9,
    provider: 'KUBERNETES',
    name: 'AI Processing K8s Namespace',
    category: 'KUBERNETES',
    status: 'CONNECTED',
    config: JSON.stringify({
      apiServer: 'https://opspilot-k3s:6443',
      namespace: 'production',
      podName: 'gemini-pipeline-worker',
      labelSelector: 'app=gemini-pipeline-worker'
    }),
    credentials: encryptSecret({ token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJwcm9kdWN0aW9uIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OnByb2R1Y3Rpb246Z2VtaW5pLXdvcmtlciJ9.signature' }),
    token: null,
    healthMinAgo: 2
  },
  {
    projectId: 9,
    provider: 'APP_LOGS',
    name: 'Gemini Worker Telemetry & Ingest',
    category: 'APPLICATION',
    status: 'CONNECTED',
    config: JSON.stringify({ app: 'gemini-pipeline-worker' }),
    credentials: null,
    token: makeToken('gemini_p'),
    healthMinAgo: 3
  },

  // -------------------------------------------------------------
  // Round out Project 3 (notesapp)
  // -------------------------------------------------------------
  {
    projectId: 3,
    provider: 'DOCKER',
    name: 'NotesApp Worker Container',
    category: 'CONTAINER',
    status: 'CONNECTED',
    config: JSON.stringify({ host: 'https://notesapp.containers.snapdeploy.app', containers: 'notesapp-worker' }),
    credentials: null,
    token: null,
    healthMinAgo: 4
  },
  {
    projectId: 3,
    provider: 'CICD',
    name: 'GitHub Actions CI/CD',
    category: 'CICD',
    status: 'CONNECTED',
    config: JSON.stringify({ provider: 'GITHUB_ACTIONS', repo: 'jestin-16/notesapp', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_notes_act_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 5
  },
  {
    projectId: 3,
    provider: 'KUBERNETES',
    name: 'Production K8s Cluster (notesapp)',
    category: 'KUBERNETES',
    status: 'CONNECTED',
    config: JSON.stringify({
      apiServer: 'https://opspilot-k3s:6443',
      namespace: 'production',
      podName: 'notesapp-backend,notesapp-redis',
      labelSelector: 'app=notesapp-backend'
    }),
    credentials: encryptSecret({ token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OnByb2R1Y3Rpb246bm90ZXNhcHAifQ.sig' }),
    token: null,
    healthMinAgo: 2
  },

  // -------------------------------------------------------------
  // Round out Project 4 (attendance-backend)
  // -------------------------------------------------------------
  {
    projectId: 4,
    provider: 'GITHUB',
    name: 'GitHub Repository',
    category: 'SOURCE_CONTROL',
    status: 'CONNECTED',
    config: JSON.stringify({ repo: 'jestin-16/attendance-backend', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_att_git_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 3
  },
  {
    projectId: 4,
    provider: 'CICD',
    name: 'GitHub Actions CI/CD',
    category: 'CICD',
    status: 'CONNECTED',
    config: JSON.stringify({ provider: 'GITHUB_ACTIONS', repo: 'jestin-16/attendance-backend', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_att_act_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 4
  },
  {
    projectId: 4,
    provider: 'KUBERNETES',
    name: 'Production K8s Cluster (attendance-backend)',
    category: 'KUBERNETES',
    status: 'CONNECTED',
    config: JSON.stringify({
      apiServer: 'https://opspilot-k3s:6443',
      namespace: 'production',
      podName: 'attendance-api',
      labelSelector: 'app=attendance-api'
    }),
    credentials: encryptSecret({ token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OnByb2R1Y3Rpb246YXR0ZW5kYW5jZSJ9.sig' }),
    token: null,
    healthMinAgo: 1
  },

  // -------------------------------------------------------------
  // Round out Project 5 (opspilot-test-harness)
  // -------------------------------------------------------------
  {
    projectId: 5,
    provider: 'GITHUB',
    name: 'GitHub Repository',
    category: 'SOURCE_CONTROL',
    status: 'CONNECTED',
    config: JSON.stringify({ repo: 'jestin-16/Opspilot-test-harness', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_th_git_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 5
  },
  {
    projectId: 5,
    provider: 'CICD',
    name: 'Test Harness CI/CD Workflow',
    category: 'CICD',
    status: 'CONNECTED',
    config: JSON.stringify({ provider: 'GITHUB_ACTIONS', repo: 'jestin-16/Opspilot-test-harness', pollSeconds: 30 }),
    credentials: encryptSecret({ webhookSecret: 'whsec_th_act_' + crypto.randomBytes(16).toString('hex') }),
    token: null,
    healthMinAgo: 4
  },
  {
    projectId: 5,
    provider: 'DOCKER',
    name: 'Live Workload Container',
    category: 'CONTAINER',
    status: 'CONNECTED',
    config: JSON.stringify({ host: 'https://testharness.containers.snapdeploy.app', containers: 'opspilot-live-workload' }),
    credentials: null,
    token: null,
    healthMinAgo: 2
  },
  {
    projectId: 5,
    provider: 'KUBERNETES',
    name: 'Test Harness K8s Deployment',
    category: 'KUBERNETES',
    status: 'CONNECTED',
    config: JSON.stringify({
      apiServer: 'https://opspilot-k3s:6443',
      namespace: 'default',
      podName: 'opspilot-test-harness',
      labelSelector: 'app=opspilot-test-harness'
    }),
    credentials: encryptSecret({ token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmRlZmF1bHQ6dGVzdC1oYXJuZXNzIn0.sig' }),
    token: null,
    healthMinAgo: 1
  }
];

let sql = `BEGIN;\n\n`;

for (const item of integrationsToAdd) {
  const credVal = item.credentials ? `'${item.credentials.replace(/'/g, "''")}'` : 'NULL';
  const confVal = item.config ? `'${item.config.replace(/'/g, "''")}'` : 'NULL';
  const tokenHash = item.token ? `'${item.token.hash}'` : 'NULL';
  const tokenPrefix = item.token ? `'${item.token.prefix}'` : 'NULL';

  sql += `
-- ${item.name} (${item.provider}) for project ${item.projectId}
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  ${item.projectId}, '${item.provider}', '${item.name}', '${item.category}', '${item.status}',
  ${confVal}, ${credVal},
  ${tokenHash}, ${tokenPrefix},
  NOW() - INTERVAL '${item.healthMinAgo} minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '${item.healthMinAgo} minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = ${item.projectId} AND provider = '${item.provider}' AND name = '${item.name}'
);
`;
}

// Ensure Project 8 (Employee Service) has deployments, containers, commits, pipeline runs and resources
sql += `
-- Add deployment for Employee Service (project 8) if missing
INSERT INTO deployments (deployed_at, environment, status, version, deployed_by_id, project_id, source, url, actor, updated_at)
SELECT NOW() - INTERVAL '1 day 4 hours', 'production', 'Succeeded', 'v1.1.0', 5, 8, 'GITHUB_ACTIONS', 'https://employee.jestin16.dev', 'jestinshajik@gmail.com', NOW() - INTERVAL '1 day 4 hours'
WHERE NOT EXISTS (SELECT 1 FROM deployments WHERE project_id = 8);

-- Add container for Employee Service if missing
INSERT INTO containers (container_status, created_at, image_name, deployment_id)
SELECT 'RUNNING', d.deployed_at, 'employee-service:v1.1.0', d.id
FROM deployments d WHERE d.project_id = 8 AND d.version = 'v1.1.0'
AND NOT EXISTS (SELECT 1 FROM containers c WHERE c.deployment_id = d.id);

-- Add commit log for Employee Service
INSERT INTO commit_logs (author, branch_name, commit_sha, message, timestamp, project_id)
SELECT 'jestin-16', 'main', 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3', 'feat(payroll): automated tax deduction and direct deposit batch processor', NOW() - INTERVAL '1 day 5 hours', 8
WHERE NOT EXISTS (SELECT 1 FROM commit_logs WHERE project_id = 8);

-- Add pipeline run for Employee Service
INSERT INTO pipeline_runs (author, branch, commit_message, commit_sha, created_at, duration_ms, event_type, exit_code, external_run_id, repo_url, status, project_id, source_id, build_logs)
SELECT 'jestin-16', 'main', 'feat(payroll): automated tax deduction and direct deposit batch processor', 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3', NOW() - INTERVAL '1 day 5 hours', 39400, 'push', 0, '4108273911', 'https://github.com/jestin-16/Employee', 'SUCCESS', 8, 1, 'Build succeeded in 39.4s. 16 tests passed. Security scan: 0 vulnerabilities. Image pushed to registry.'
WHERE NOT EXISTS (SELECT 1 FROM pipeline_runs WHERE project_id = 8);

-- Add resources for Employee Service
INSERT INTO resources (project_id, name, provider, provider_resource_id, resource_type, status, environment, metadata, created_at, updated_at)
SELECT 8, 'employee-service-api (container)', 'DOCKER', 'docker-host-employee-service', 'CONTAINER', 'HEALTHY', 'production', '{"image":"openjdk:17-alpine","service":"employee-service","interval":"10s"}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE project_id = 8 AND provider_resource_id = 'docker-host-employee-service');

INSERT INTO resources (project_id, name, provider, provider_resource_id, resource_type, status, environment, metadata, created_at, updated_at)
SELECT 8, 'employee-service-api (pod)', 'KUBERNETES', 'k8s-pod-employee-service-api', 'POD', 'HEALTHY', 'production', '{"namespace":"production","replicas":2,"cpu":"1m","memory":"18Mi","status":"Running"}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE project_id = 8 AND provider_resource_id = 'k8s-pod-employee-service-api');

-- Link resources to integrations
UPDATE resources r
SET integration_id = i.id
FROM integrations i
WHERE r.project_id = i.project_id AND r.provider = i.provider
AND (r.integration_id IS NULL OR r.integration_id != i.id);

-- Realistic operational logs for Employee Service (project 8)
INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 8, (SELECT id FROM deployments WHERE project_id = 8 ORDER BY id DESC LIMIT 1), 'INFO', 'employee-service', 'APPLICATION', 'Spring Boot 3.2.4 microservice initialized in 2.34s (JVM running for 3.12s)', '{"service":"employee-service","port":8080}', NOW() - INTERVAL '1 hour', (SELECT id FROM integrations WHERE project_id = 8 AND provider = 'APP_LOGS' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 8 AND message LIKE 'Spring Boot 3.2.4 microservice initialized%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 8, (SELECT id FROM deployments WHERE project_id = 8 ORDER BY id DESC LIMIT 1), 'INFO', 'employee-service', 'APPLICATION', 'Processed monthly salary computation for 154 employees in batch #BATCH-202610-A', '{"batchId":"BATCH-202610-A","employees":154,"durationMs":842}', NOW() - INTERVAL '35 minutes', (SELECT id FROM integrations WHERE project_id = 8 AND provider = 'APP_LOGS' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 8 AND message LIKE 'Processed monthly salary computation%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 8, (SELECT id FROM deployments WHERE project_id = 8 ORDER BY id DESC LIMIT 1), 'INFO', 'employee-service-api', 'KUBERNETES', 'GET /api/v1/departments/engineering/roster 200 OK - remote=10.42.0.1 duration=18ms', '{"endpoint":"/api/v1/departments/engineering/roster","status":200,"method":"GET"}', NOW() - INTERVAL '12 minutes', (SELECT id FROM integrations WHERE project_id = 8 AND provider = 'KUBERNETES' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 8 AND message LIKE 'GET /api/v1/departments/engineering/roster%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 8, (SELECT id FROM deployments WHERE project_id = 8 ORDER BY id DESC LIMIT 1), 'INFO', 'employee-service-api', 'DOCKER', 'Direct deposit disbursement verification checksum OK (bank ACH batch id: ACH-981023)', '{"achBatch":"ACH-981023","status":"VERIFIED"}', NOW() - INTERVAL '8 minutes', (SELECT id FROM integrations WHERE project_id = 8 AND provider = 'DOCKER' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 8 AND message LIKE 'Direct deposit disbursement%');

-- Link existing logs to matching integrations for projects 6, 7, 9
UPDATE logs l
SET integration_id = i.id
FROM integrations i
WHERE l.project_id = i.project_id AND l.source_type = i.provider::text AND l.integration_id IS NULL;

-- Also add fresh operational logs for each integration so their log views have rich data
-- Cafe Management (project 6)
INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 6, (SELECT id FROM deployments WHERE project_id = 6 ORDER BY id DESC LIMIT 1), 'INFO', 'cafe-orders', 'APPLICATION', '{"timestamp":"2026-10-26T14:15:00Z","level":"INFO","event":"order_created","orderId":"ORD-492104","table":4,"items":["Cold Brew","Avocado Toast"],"total":18.50}', '{"orderId":"ORD-492104","table":4,"total":18.50}', NOW() - INTERVAL '14 minutes', (SELECT id FROM integrations WHERE project_id = 6 AND provider = 'APP_LOGS' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 6 AND message LIKE '%ORD-492104%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 6, (SELECT id FROM deployments WHERE project_id = 6 ORDER BY id DESC LIMIT 1), 'INFO', 'cafe-order-stream', 'DOCKER', 'WebSocket connection established from Barista POS Terminal #1 (192.168.1.104:52190)', '{"terminalId":"POS-01","ip":"192.168.1.104"}', NOW() - INTERVAL '7 minutes', (SELECT id FROM integrations WHERE project_id = 6 AND provider = 'DOCKER' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 6 AND message LIKE 'WebSocket connection established from Barista POS%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 6, (SELECT id FROM deployments WHERE project_id = 6 ORDER BY id DESC LIMIT 1), 'INFO', 'cafe-order-processor', 'KUBERNETES', 'Healthcheck probe /health succeeded with HTTP 200 (order queue depth: 0)', '{"endpoint":"/health","queueDepth":0}', NOW() - INTERVAL '3 minutes', (SELECT id FROM integrations WHERE project_id = 6 AND provider = 'KUBERNETES' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 6 AND message LIKE 'Healthcheck probe /health succeeded with HTTP 200 (order queue depth: 0)%');

-- E-Commerce Platform (project 7)
INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 7, (SELECT id FROM deployments WHERE project_id = 7 ORDER BY id DESC LIMIT 1), 'INFO', 'ecommerce-gateway', 'APPLICATION', 'User checkout completed: order #ORD-98301 total=$249.00 payment_method=card_stripe', '{"orderId":"ORD-98301","amount":249.00,"currency":"USD"}', NOW() - INTERVAL '15 minutes', (SELECT id FROM integrations WHERE project_id = 7 AND provider = 'APP_LOGS' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 7 AND message LIKE 'User checkout completed: order #ORD-98301%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 7, (SELECT id FROM deployments WHERE project_id = 7 ORDER BY id DESC LIMIT 1), 'INFO', 'ecommerce-cache-worker', 'DOCKER', 'Redis cluster sync: 1,420 product catalog keys re-indexed into local cache pool', '{"keys":1420,"durationMs":48}', NOW() - INTERVAL '6 minutes', (SELECT id FROM integrations WHERE project_id = 7 AND provider = 'DOCKER' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 7 AND message LIKE 'Redis cluster sync: 1,420 product catalog%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 7, (SELECT id FROM deployments WHERE project_id = 7 ORDER BY id DESC LIMIT 1), 'INFO', 'ecommerce-gateway', 'KUBERNETES', 'HTTP/2 200 GET /api/v1/products/featured from 10.42.0.1 (latency 9ms)', '{"status":200,"path":"/api/v1/products/featured","method":"GET"}', NOW() - INTERVAL '2 minutes', (SELECT id FROM integrations WHERE project_id = 7 AND provider = 'KUBERNETES' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 7 AND message LIKE 'HTTP/2 200 GET /api/v1/products/featured%');

-- Gemini Image Pipeline (project 9)
INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 9, (SELECT id FROM deployments WHERE project_id = 9 ORDER BY id DESC LIMIT 1), 'INFO', 'gemini-pipeline-worker', 'APPLICATION', '[GeminiWorker] Multimodal prompt inference finished for image batch [img_49102, img_49103] - 2.1s duration', '{"batchSize":2,"durationMs":2100,"model":"gemini-1.5-pro"}', NOW() - INTERVAL '18 minutes', (SELECT id FROM integrations WHERE project_id = 9 AND provider = 'APP_LOGS' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 9 AND message LIKE '[GeminiWorker] Multimodal prompt inference finished%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 9, (SELECT id FROM deployments WHERE project_id = 9 ORDER BY id DESC LIMIT 1), 'INFO', 'gemini-pipeline-worker', 'DOCKER', 'CUDA worker runtime allocated 4096MB VRAM for TensorRT image embeddings', '{"vramAllocatedMB":4096,"engine":"TensorRT"}', NOW() - INTERVAL '8 minutes', (SELECT id FROM integrations WHERE project_id = 9 AND provider = 'DOCKER' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 9 AND message LIKE 'CUDA worker runtime allocated%');

COMMIT;
`;

fs.writeFileSync('c:\\Users\\jesvi\\OpsPilot\\scripts\\db\\seed_all_integrations.sql', sql);
console.log('Successfully generated c:\\Users\\jesvi\\OpsPilot\\scripts\\db\\seed_all_integrations.sql');
