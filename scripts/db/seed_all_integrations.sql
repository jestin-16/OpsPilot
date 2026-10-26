BEGIN;


-- GitHub Repository (GITHUB) for project 6
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  6, 'GITHUB', 'GitHub Repository', 'SOURCE_CONTROL', 'CONNECTED',
  '{"repo":"jestin-16/cafe","pollSeconds":30}', 'enc:v1:bzEgYkHzYHlTEazXXieUxmzi9QtlZNWWaraQKJym8AWnH+l02sLoNLeLi6lce2ve0XmGqq+Rc7mFQsH0p04t6lEp6OC2h0AcKHYhrTq60GpdKweIWOj3hcwI3g==',
  NULL, NULL,
  NOW() - INTERVAL '4 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '4 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 6 AND provider = 'GITHUB' AND name = 'GitHub Repository'
);

-- GitHub Actions CI/CD (CICD) for project 6
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  6, 'CICD', 'GitHub Actions CI/CD', 'CICD', 'CONNECTED',
  '{"provider":"GITHUB_ACTIONS","repo":"jestin-16/cafe","pollSeconds":30}', 'enc:v1:hY3+4l9GsYTJCxAXK7pd8ZLy5XwryQwRjocr7XuKaq052T19Jkwms81lDD7nuVynwtoGIjpxmv65bPIoBopu5R93ZbSGDTwUWxfcs8VOrKpS+7/xR/hrHkZIo5oiU6U=',
  NULL, NULL,
  NOW() - INTERVAL '3 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '3 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 6 AND provider = 'CICD' AND name = 'GitHub Actions CI/CD'
);

-- Cafe Order Stream Container (DOCKER) for project 6
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  6, 'DOCKER', 'Cafe Order Stream Container', 'CONTAINER', 'CONNECTED',
  '{"host":"https://cafe.containers.snapdeploy.app","containers":"cafe-order-stream"}', NULL,
  NULL, NULL,
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '5 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 6 AND provider = 'DOCKER' AND name = 'Cafe Order Stream Container'
);

-- Production K8s Cluster (cafe) (KUBERNETES) for project 6
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  6, 'KUBERNETES', 'Production K8s Cluster (cafe)', 'KUBERNETES', 'CONNECTED',
  '{"apiServer":"https://opspilot-k3s:6443","namespace":"production","podName":"cafe-order-processor","labelSelector":"app=cafe-order-processor"}', 'enc:v1:eeCSl/mRXmDB7kQbWcPA/j5e77chXl5sS79CI1lqPFU1IOJP7fsXSvfhURm+7jwt932yQaQSbaG58dbEKU5NDqZmv9k/nt4Dl5m3vcujpw1lFX4WUOiIp3BEGqJDKOtUDyJl4qv+EMCn0qLjYkvS/rRcelVKRZfntT18vELTXSlvgXrlyxLBs+V3IILMHkDzLVGTGEYHmAQWjJRJyylKBfOvL/eui++eAQXK83mDzhmh8q4z4eWcCjH6bWaiDz0tnQwN0KXVw1cs4uVGIzprM0gMHH5g9ti7K980aCxfmXBhdr03ZbNpF//Kdx3c4aE+OU9wqauU6LWBeTHyKCLvAbxqFk4kRZhLCPPU6J3yD0iJzF/JPZ4=',
  NULL, NULL,
  NOW() - INTERVAL '2 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 6 AND provider = 'KUBERNETES' AND name = 'Production K8s Cluster (cafe)'
);

-- Cafe Orders API Logs (APP_LOGS) for project 6
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  6, 'APP_LOGS', 'Cafe Orders API Logs', 'APPLICATION', 'CONNECTED',
  '{"app":"cafe-orders"}', NULL,
  'eb215359cadf3e05bb2a2b90d80e29c4fc1b664832a2f727a538863e5ed699c8', 'opl_cafe_ord',
  NOW() - INTERVAL '1 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 6 AND provider = 'APP_LOGS' AND name = 'Cafe Orders API Logs'
);

-- GitHub Repository (GITHUB) for project 7
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  7, 'GITHUB', 'GitHub Repository', 'SOURCE_CONTROL', 'CONNECTED',
  '{"repo":"jestin-16/ecommerce","pollSeconds":30}', 'enc:v1:fAz/05yp7HX82k/tXtR7+CaGV29wakw7Uxftu94aN4sJsDqAZJ8+voNrA6Ha0oQDXUD6d3Z2D2qJ+qRnk0DfHN8wXyRvY4OVIMxkhgSeNyMEFqXAyQq44OL7/A==',
  NULL, NULL,
  NOW() - INTERVAL '6 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '6 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 7 AND provider = 'GITHUB' AND name = 'GitHub Repository'
);

-- Storefront CI/CD Pipeline (CICD) for project 7
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  7, 'CICD', 'Storefront CI/CD Pipeline', 'CICD', 'CONNECTED',
  '{"provider":"GITHUB_ACTIONS","repo":"jestin-16/ecommerce","pollSeconds":30}', 'enc:v1:wzU0QPTluHeDILFKcbZinqG/6jNLS321vOLNW7GhRd/YbRIpMPB1SIlZW+X6a+OzVzuBJKgg3m+eBp7MwnRDg+4EJUYpGcG0eoui/sXZpPpf/9r9CLRUQHGchaoXu9U=',
  NULL, NULL,
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '5 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 7 AND provider = 'CICD' AND name = 'Storefront CI/CD Pipeline'
);

-- Redis Cache Worker Container (DOCKER) for project 7
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  7, 'DOCKER', 'Redis Cache Worker Container', 'CONTAINER', 'CONNECTED',
  '{"host":"https://ecommerce.containers.snapdeploy.app","containers":"ecommerce-cache-worker"}', NULL,
  NULL, NULL,
  NOW() - INTERVAL '7 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '7 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 7 AND provider = 'DOCKER' AND name = 'Redis Cache Worker Container'
);

-- Production K8s Cluster (ecommerce) (KUBERNETES) for project 7
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  7, 'KUBERNETES', 'Production K8s Cluster (ecommerce)', 'KUBERNETES', 'CONNECTED',
  '{"apiServer":"https://opspilot-k3s:6443","namespace":"production","podName":"ecommerce-gateway","labelSelector":"app=ecommerce-gateway"}', 'enc:v1:2JBHfrz22lbd5zf2bsh6qBzOpuSfuPiG5QPP01llfh7ao4NVwR6foyVZsvcyQIGG9EF9gw6ZOlxrJpSbVLXTEVhGXTTdC2bZfeMJulkQDNwhBB8nxdZhTDW0ntNHZ5Sa8h9Y0AuJTjhN2W36FKOxmf2h2Fwt1vhYr5ZYqKLGS8jUzWu3GXzTreTMD0VTg8cr0ALZfw7zyeYmfX3XdmIBSbYYTV4Y4FvX3f7L76UptzPsiEi9Xp/wYOpw8Dr49Aic41X/ZvQU6YOuro60474Y1pauCrfV+JeBe1CK1aOJAmj1EDBEzM6wiYIzrOj0NRztgtLHC+VLNMAgerJwQgBww2wPYEIs07JL/AAZlxvaL0brvrZqwwbeVNyypsoY',
  NULL, NULL,
  NOW() - INTERVAL '1 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 7 AND provider = 'KUBERNETES' AND name = 'Production K8s Cluster (ecommerce)'
);

-- Checkout & Cart Gateway Logs (APP_LOGS) for project 7
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  7, 'APP_LOGS', 'Checkout & Cart Gateway Logs', 'APPLICATION', 'CONNECTED',
  '{"app":"ecommerce-gateway"}', NULL,
  '73396c235b6cd8a27325e4b195b22234fd8fce5a68be8fbcd558f0dd3f469abb', 'opl_ecom_gw_',
  NOW() - INTERVAL '2 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 7 AND provider = 'APP_LOGS' AND name = 'Checkout & Cart Gateway Logs'
);

-- GitHub Repository (GITHUB) for project 8
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  8, 'GITHUB', 'GitHub Repository', 'SOURCE_CONTROL', 'CONNECTED',
  '{"repo":"jestin-16/Employee","pollSeconds":30}', 'enc:v1:fCNSMRhmbP02h4rHn5b1xhUavDbkjSwrJfLkBqCmICIyMhnGpRKYTGuHDqwJR9RaaHH4z+Ckb8dVrujke4cr+NF5gIQ4RHlSdpuJKcx3HPNBvnFUD8ryVIdG',
  NULL, NULL,
  NOW() - INTERVAL '8 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '8 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 8 AND provider = 'GITHUB' AND name = 'GitHub Repository'
);

-- Payroll & HR Service Pipeline (CICD) for project 8
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  8, 'CICD', 'Payroll & HR Service Pipeline', 'CICD', 'CONNECTED',
  '{"provider":"GITHUB_ACTIONS","repo":"jestin-16/Employee","pollSeconds":30}', 'enc:v1:BPldan/4u3V1tsNW1uZisuw3GEu2Q9smnWbZPEVFfnTsZC5VHjxp+QRXztyt9cPWsyl+LR4PcAAQI1KosfWKBdqNSW8Vp21szNisChGzjKY1JIXQLY1Iz94mNlAyGw==',
  NULL, NULL,
  NOW() - INTERVAL '7 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '7 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 8 AND provider = 'CICD' AND name = 'Payroll & HR Service Pipeline'
);

-- Employee Service Container (DOCKER) for project 8
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  8, 'DOCKER', 'Employee Service Container', 'CONTAINER', 'CONNECTED',
  '{"host":"https://employee.containers.snapdeploy.app","containers":"employee-service-api"}', NULL,
  NULL, NULL,
  NOW() - INTERVAL '9 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '9 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 8 AND provider = 'DOCKER' AND name = 'Employee Service Container'
);

-- Internal Services K8s Cluster (KUBERNETES) for project 8
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  8, 'KUBERNETES', 'Internal Services K8s Cluster', 'KUBERNETES', 'CONNECTED',
  '{"apiServer":"https://opspilot-k3s:6443","namespace":"production","podName":"employee-service-api","labelSelector":"app=employee-service"}', 'enc:v1:40DHp1d8mSEa7Ub51dC94g1LzVXLZJ/W27sy6pz81+jKkrZDL3Cd8+BQTOF6sY0R6pELDZknGsFpC5gVqt1UssR5FlmdJer/SHSWRfNmdPsswgEDOQY3xRsetSaFcQn5laZkujV8Mr5JSC1Ts5A3GrYHMJNpvlq0SBZa7WWUrCSZ+C018ypCGpQX0y4YrGYmDd2YmcUBnz/tCh5+dfDYqVEf/pUeT7RlDomqussOENb6UzO4Xa3RavnW/UEFesohJgV7MkODn6trD5W0Ta5mzsicT1WK8c31hVGgE5AgrwU7uZX49iPAFUG7A1MKjAiLZrL7zQU9HmniJN3emHWpQsXOjpL0T3GXiI+ysDgPKadbYJte2M3i/qcZqQ==',
  NULL, NULL,
  NOW() - INTERVAL '3 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '3 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 8 AND provider = 'KUBERNETES' AND name = 'Internal Services K8s Cluster'
);

-- Employee Directory Service Logs (APP_LOGS) for project 8
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  8, 'APP_LOGS', 'Employee Directory Service Logs', 'APPLICATION', 'CONNECTED',
  '{"app":"employee-service"}', NULL,
  '1ff8bb2e42ad7cc6ffc2ecfa46a5b4d3a701984b0bc93566e578e8ee1195d1a3', 'opl_emp_dir_',
  NOW() - INTERVAL '4 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '4 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 8 AND provider = 'APP_LOGS' AND name = 'Employee Directory Service Logs'
);

-- GitHub Repository (GITHUB) for project 9
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  9, 'GITHUB', 'GitHub Repository', 'SOURCE_CONTROL', 'CONNECTED',
  '{"repo":"jestin-16/gemini-pipeline","pollSeconds":30}', 'enc:v1:xaADpoSDC8vBhTXqY6uMcf7HdQBh9PXD4Y5W/1vD9gbJZxvtFJIsH5zE4jTQRa8T0oNqdwRQOaa9/jqG25CE3uCdwbfI9ttkeL1lIfTNPT8HUJWOFVuuiKn6ZS7R',
  NULL, NULL,
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '5 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 9 AND provider = 'GITHUB' AND name = 'GitHub Repository'
);

-- Multimodal Inference Build Pipeline (CICD) for project 9
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  9, 'CICD', 'Multimodal Inference Build Pipeline', 'CICD', 'CONNECTED',
  '{"provider":"GITHUB_ACTIONS","repo":"jestin-16/gemini-pipeline","pollSeconds":30}', 'enc:v1:Ka42ICT2OKEKy5BuxcEw6O1ZEMW2UIU9WaszFZVaF7vwaI88otAndNUN0s8S7l1YtVxTQxVAYCIxD9YD0zDhIGG2sEyYm237agbajx8sOdfiu4OvTpXFV+KToNY6Yu70vA==',
  NULL, NULL,
  NOW() - INTERVAL '4 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '4 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 9 AND provider = 'CICD' AND name = 'Multimodal Inference Build Pipeline'
);

-- Batch Inference GPU Container (DOCKER) for project 9
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  9, 'DOCKER', 'Batch Inference GPU Container', 'CONTAINER', 'CONNECTED',
  '{"host":"https://gemini-pipeline.containers.snapdeploy.app","containers":"gemini-pipeline-worker"}', NULL,
  NULL, NULL,
  NOW() - INTERVAL '6 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '6 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 9 AND provider = 'DOCKER' AND name = 'Batch Inference GPU Container'
);

-- AI Processing K8s Namespace (KUBERNETES) for project 9
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  9, 'KUBERNETES', 'AI Processing K8s Namespace', 'KUBERNETES', 'CONNECTED',
  '{"apiServer":"https://opspilot-k3s:6443","namespace":"production","podName":"gemini-pipeline-worker","labelSelector":"app=gemini-pipeline-worker"}', 'enc:v1:VWF1h8p+0OK++IlD9gk7lp1h0VxrkERO5oAl79Grd1e4f+af7OG1lExJAlRJPV1/Ms37JJwwJnwxX9aATGMGb0aZ3pdE31EnSRKJ1GYN+GyKLewAa9+8zwcDWrKVUjabNgdEauKD4q3ELkak3RAXH+GsUklKHSHQxNIVq+srxZC+iKZ4KixuNxq3ItKHemx3kQzbu4PXq4KvRl3aJaPt5/nDw1lSde1wQkKIV6FjJ4nwabYygII6y164Uv9hw5NT97GdWVW8cxvjmsuGuRgJdmEghKtVu/mbtx85HhFzbf+GEgCAOrKTSrbWtA3uLi4cGRkQ3YIRAkw7SBmtlhjR05ehtW5o0Xl79YJUf5h0MftsqICgWJRr',
  NULL, NULL,
  NOW() - INTERVAL '2 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 9 AND provider = 'KUBERNETES' AND name = 'AI Processing K8s Namespace'
);

-- Gemini Worker Telemetry & Ingest (APP_LOGS) for project 9
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  9, 'APP_LOGS', 'Gemini Worker Telemetry & Ingest', 'APPLICATION', 'CONNECTED',
  '{"app":"gemini-pipeline-worker"}', NULL,
  '8b7a3e23f57974adbd6b3947065edbfce123475399443cbabfa88d20ca06c21e', 'opl_gemini_p',
  NOW() - INTERVAL '3 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '3 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 9 AND provider = 'APP_LOGS' AND name = 'Gemini Worker Telemetry & Ingest'
);

-- NotesApp Worker Container (DOCKER) for project 3
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  3, 'DOCKER', 'NotesApp Worker Container', 'CONTAINER', 'CONNECTED',
  '{"host":"https://notesapp.containers.snapdeploy.app","containers":"notesapp-worker"}', NULL,
  NULL, NULL,
  NOW() - INTERVAL '4 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '4 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 3 AND provider = 'DOCKER' AND name = 'NotesApp Worker Container'
);

-- GitHub Actions CI/CD (CICD) for project 3
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  3, 'CICD', 'GitHub Actions CI/CD', 'CICD', 'CONNECTED',
  '{"provider":"GITHUB_ACTIONS","repo":"jestin-16/notesapp","pollSeconds":30}', 'enc:v1:jRqwZozCvdZjmRnHnLul/3uSyzGSWt895TSjeCmgXXObGp3r0MWrJu3aR4a99D7mOtk7IQmbYw2YZVxqdo7OFE+JZG3vmgWM7JldHoZ8BvSnYVZ7oWb+t9eut7Yatf4K',
  NULL, NULL,
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '5 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 3 AND provider = 'CICD' AND name = 'GitHub Actions CI/CD'
);

-- Production K8s Cluster (notesapp) (KUBERNETES) for project 3
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  3, 'KUBERNETES', 'Production K8s Cluster (notesapp)', 'KUBERNETES', 'CONNECTED',
  '{"apiServer":"https://opspilot-k3s:6443","namespace":"production","podName":"notesapp-backend,notesapp-redis","labelSelector":"app=notesapp-backend"}', 'enc:v1:XzG4mKPbSxz5MPy8FiMI2+5w2dy5AFk5umXwMk4oG1n8UfLzCxJTetXhgf3PyTUld717K3bpCQ2YSkXXjRVen1RQzB2XWJYfAgGF6Nt/NMxgvjOGV3mtdECkwQtP//YaEDfxmrsJ9vcCdikgXLkVtOCmccn+V1UYa9sOdlMRt5xjLiWDVBRdiEfMqoVYUCBY6ey6qOIki/RPMUrQFUegb6htX3rVv8Oxk8Dj0v25LZJNrUCgo7dt4N5f/Nv3/Bm1C8nU',
  NULL, NULL,
  NOW() - INTERVAL '2 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 3 AND provider = 'KUBERNETES' AND name = 'Production K8s Cluster (notesapp)'
);

-- GitHub Repository (GITHUB) for project 4
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  4, 'GITHUB', 'GitHub Repository', 'SOURCE_CONTROL', 'CONNECTED',
  '{"repo":"jestin-16/attendance-backend","pollSeconds":30}', 'enc:v1:UfT0ehSNI0CJrPLbHGyqPNooD4ePjCz/qlbfh93Gbj8p0nWeD3joYMPaO86KTBGa/Ff3waOtq2ceeFDHwP3mu9diEUn/tc59sBo9AOgcgieIIfS3D15dhoAHsZhiRg==',
  NULL, NULL,
  NOW() - INTERVAL '3 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '3 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 4 AND provider = 'GITHUB' AND name = 'GitHub Repository'
);

-- GitHub Actions CI/CD (CICD) for project 4
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  4, 'CICD', 'GitHub Actions CI/CD', 'CICD', 'CONNECTED',
  '{"provider":"GITHUB_ACTIONS","repo":"jestin-16/attendance-backend","pollSeconds":30}', 'enc:v1:qmtivE+6Tj6x8fL2E3l7G6thIu2wYx5OEGePCuAVRSzdNYpx4Fc6lfi9cQtg2rB5gHz2W9KdNgjzoLDO5qAOEYq0smB8DsKt3Bnk6J+I2LAFgzxLdOWI7rr7rgMC1w==',
  NULL, NULL,
  NOW() - INTERVAL '4 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '4 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 4 AND provider = 'CICD' AND name = 'GitHub Actions CI/CD'
);

-- Production K8s Cluster (attendance-backend) (KUBERNETES) for project 4
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  4, 'KUBERNETES', 'Production K8s Cluster (attendance-backend)', 'KUBERNETES', 'CONNECTED',
  '{"apiServer":"https://opspilot-k3s:6443","namespace":"production","podName":"attendance-api","labelSelector":"app=attendance-api"}', 'enc:v1:EAc12kn7DvEl9RkW+VgD1s5OqE2Qmt77mJ8lH6EjlvwG3eCvY1Cqr6m1QfA0TnnFk2RWptvafOog8iH1+ZyDYuXy0SrSdZ9hZ7iI/f4xHllMV1X4dx4sIzWV+Bo7CcSNJEogC8oxkMl2wsFROMyXeRkK9SV+fVau69mVjJNHj97v4AmaFi7unV4+rBNSOUvHO6MmCSkZXSZKStpOwGSoss84pv5dqQq3R29kocweytwakhoGucekQdvFmhkg1BR3LMrFoxI=',
  NULL, NULL,
  NOW() - INTERVAL '1 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 4 AND provider = 'KUBERNETES' AND name = 'Production K8s Cluster (attendance-backend)'
);

-- GitHub Repository (GITHUB) for project 5
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  5, 'GITHUB', 'GitHub Repository', 'SOURCE_CONTROL', 'CONNECTED',
  '{"repo":"jestin-16/Opspilot-test-harness","pollSeconds":30}', 'enc:v1:YeynS4xmR1GnFNoSpSqc2SNe7FF91ZxhlPiOnDWK/DW8tMfMw3LBqcwWCHSWRYl4TOkX8ziYKsji/cI+5QzzTPTVP2Lv+S4liNQsCvbWnsGoDvCu8tOlRPA+10jN',
  NULL, NULL,
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '5 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 5 AND provider = 'GITHUB' AND name = 'GitHub Repository'
);

-- Test Harness CI/CD Workflow (CICD) for project 5
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  5, 'CICD', 'Test Harness CI/CD Workflow', 'CICD', 'CONNECTED',
  '{"provider":"GITHUB_ACTIONS","repo":"jestin-16/Opspilot-test-harness","pollSeconds":30}', 'enc:v1:m3wvXmKsqqbgukutC+C6bNAX4nlggX//ZAhUq3YdxmUpHKNd1n02xysyiM9a/gUclAKlS4k+4qAeJgrsVGvIKXNeLj+21rL3iuVgQjYEKLj3JI8Q2HgMCtEawPwQ',
  NULL, NULL,
  NOW() - INTERVAL '4 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '4 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 5 AND provider = 'CICD' AND name = 'Test Harness CI/CD Workflow'
);

-- Live Workload Container (DOCKER) for project 5
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  5, 'DOCKER', 'Live Workload Container', 'CONTAINER', 'CONNECTED',
  '{"host":"https://testharness.containers.snapdeploy.app","containers":"opspilot-live-workload"}', NULL,
  NULL, NULL,
  NOW() - INTERVAL '2 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 5 AND provider = 'DOCKER' AND name = 'Live Workload Container'
);

-- Test Harness K8s Deployment (KUBERNETES) for project 5
INSERT INTO integrations (
  project_id, provider, name, category, status,
  configuration, credential_reference,
  ingest_token_hash, ingest_token_prefix,
  last_health_check_at, created_at, updated_at
)
SELECT
  5, 'KUBERNETES', 'Test Harness K8s Deployment', 'KUBERNETES', 'CONNECTED',
  '{"apiServer":"https://opspilot-k3s:6443","namespace":"default","podName":"opspilot-test-harness","labelSelector":"app=opspilot-test-harness"}', 'enc:v1:ACOCAOehcMk2Mx+ejxCu3XoUgsAmMDrjUtcINHXA+C+J9zBD5l5g0JmAMGdUz/I2VHnktspx2zHR6x/3Gmm1lpaeiuQzu5yEx1jaY7sjAAA9h0Kk95iXNqJQKk+bdddRENF5/kyarrXS9gcDZoMcjJ5CgbsAv6S1IbxCc78qARlz812F3BW58wvjmCb15kcaX81b06B9tMw1h0k1TuVxJPlYhGMvOR95TfBpbKKPOJeCSWlTtu6mc6+LgBiIBVhFDQ5o5Q==',
  NULL, NULL,
  NOW() - INTERVAL '1 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM integrations
  WHERE project_id = 5 AND provider = 'KUBERNETES' AND name = 'Test Harness K8s Deployment'
);

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
SELECT 8, (SELECT id FROM deployments WHERE project_id = 8 ORDER BY id DESC LIMIT 1), 'INFO', 'employee-service', 'APP_LOGS', 'Spring Boot 3.2.4 microservice initialized in 2.34s (JVM running for 3.12s)', '{"service":"employee-service","port":8080}', NOW() - INTERVAL '1 hour', (SELECT id FROM integrations WHERE project_id = 8 AND provider = 'APP_LOGS' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 8 AND message LIKE 'Spring Boot 3.2.4 microservice initialized%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 8, (SELECT id FROM deployments WHERE project_id = 8 ORDER BY id DESC LIMIT 1), 'INFO', 'employee-service', 'APP_LOGS', 'Processed monthly salary computation for 154 employees in batch #BATCH-202610-A', '{"batchId":"BATCH-202610-A","employees":154,"durationMs":842}', NOW() - INTERVAL '35 minutes', (SELECT id FROM integrations WHERE project_id = 8 AND provider = 'APP_LOGS' LIMIT 1)
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
SELECT 6, (SELECT id FROM deployments WHERE project_id = 6 ORDER BY id DESC LIMIT 1), 'INFO', 'cafe-orders', 'APP_LOGS', '{"timestamp":"2026-10-26T14:15:00Z","level":"INFO","event":"order_created","orderId":"ORD-492104","table":4,"items":["Cold Brew","Avocado Toast"],"total":18.50}', '{"orderId":"ORD-492104","table":4,"total":18.50}', NOW() - INTERVAL '14 minutes', (SELECT id FROM integrations WHERE project_id = 6 AND provider = 'APP_LOGS' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 6 AND message LIKE '%ORD-492104%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 6, (SELECT id FROM deployments WHERE project_id = 6 ORDER BY id DESC LIMIT 1), 'INFO', 'cafe-order-stream', 'DOCKER', 'WebSocket connection established from Barista POS Terminal #1 (192.168.1.104:52190)', '{"terminalId":"POS-01","ip":"192.168.1.104"}', NOW() - INTERVAL '7 minutes', (SELECT id FROM integrations WHERE project_id = 6 AND provider = 'DOCKER' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 6 AND message LIKE 'WebSocket connection established from Barista POS%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 6, (SELECT id FROM deployments WHERE project_id = 6 ORDER BY id DESC LIMIT 1), 'INFO', 'cafe-order-processor', 'KUBERNETES', 'Healthcheck probe /health succeeded with HTTP 200 (order queue depth: 0)', '{"endpoint":"/health","queueDepth":0}', NOW() - INTERVAL '3 minutes', (SELECT id FROM integrations WHERE project_id = 6 AND provider = 'KUBERNETES' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 6 AND message LIKE 'Healthcheck probe /health succeeded with HTTP 200 (order queue depth: 0)%');

-- E-Commerce Platform (project 7)
INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 7, (SELECT id FROM deployments WHERE project_id = 7 ORDER BY id DESC LIMIT 1), 'INFO', 'ecommerce-gateway', 'APP_LOGS', 'User checkout completed: order #ORD-98301 total=$249.00 payment_method=card_stripe', '{"orderId":"ORD-98301","amount":249.00,"currency":"USD"}', NOW() - INTERVAL '15 minutes', (SELECT id FROM integrations WHERE project_id = 7 AND provider = 'APP_LOGS' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 7 AND message LIKE 'User checkout completed: order #ORD-98301%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 7, (SELECT id FROM deployments WHERE project_id = 7 ORDER BY id DESC LIMIT 1), 'INFO', 'ecommerce-cache-worker', 'DOCKER', 'Redis cluster sync: 1,420 product catalog keys re-indexed into local cache pool', '{"keys":1420,"durationMs":48}', NOW() - INTERVAL '6 minutes', (SELECT id FROM integrations WHERE project_id = 7 AND provider = 'DOCKER' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 7 AND message LIKE 'Redis cluster sync: 1,420 product catalog%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 7, (SELECT id FROM deployments WHERE project_id = 7 ORDER BY id DESC LIMIT 1), 'INFO', 'ecommerce-gateway', 'KUBERNETES', 'HTTP/2 200 GET /api/v1/products/featured from 10.42.0.1 (latency 9ms)', '{"status":200,"path":"/api/v1/products/featured","method":"GET"}', NOW() - INTERVAL '2 minutes', (SELECT id FROM integrations WHERE project_id = 7 AND provider = 'KUBERNETES' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 7 AND message LIKE 'HTTP/2 200 GET /api/v1/products/featured%');

-- Gemini Image Pipeline (project 9)
INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 9, (SELECT id FROM deployments WHERE project_id = 9 ORDER BY id DESC LIMIT 1), 'INFO', 'gemini-pipeline-worker', 'APP_LOGS', '[GeminiWorker] Multimodal prompt inference finished for image batch [img_49102, img_49103] - 2.1s duration', '{"batchSize":2,"durationMs":2100,"model":"gemini-1.5-pro"}', NOW() - INTERVAL '18 minutes', (SELECT id FROM integrations WHERE project_id = 9 AND provider = 'APP_LOGS' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 9 AND message LIKE '[GeminiWorker] Multimodal prompt inference finished%');

INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp, integration_id)
SELECT 9, (SELECT id FROM deployments WHERE project_id = 9 ORDER BY id DESC LIMIT 1), 'INFO', 'gemini-pipeline-worker', 'DOCKER', 'CUDA worker runtime allocated 4096MB VRAM for TensorRT image embeddings', '{"vramAllocatedMB":4096,"engine":"TensorRT"}', NOW() - INTERVAL '8 minutes', (SELECT id FROM integrations WHERE project_id = 9 AND provider = 'DOCKER' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM logs WHERE project_id = 9 AND message LIKE 'CUDA worker runtime allocated%');

COMMIT;
