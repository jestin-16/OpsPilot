BEGIN;

-- Realistic logs for Attendance Backend (project_id = 4)
INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp) VALUES
(4, (SELECT id FROM deployments WHERE project_id = 4 ORDER BY id DESC LIMIT 1), 'INFO', 'attendance-api', 'KUBERNETES', 'GET /api/v1/attendance/summary 200 OK - remote=10.42.0.1 duration=14ms', '{"endpoint":"/api/v1/attendance/summary","status":200,"method":"GET"}', NOW() - INTERVAL '2 minutes'),
(4, (SELECT id FROM deployments WHERE project_id = 4 ORDER BY id DESC LIMIT 1), 'INFO', 'attendance-sync-daemon', 'DOCKER', 'Biometric terminal heartbeats synchronized: 4 active terminals online', '{"terminals":["BR-01","BR-02","HQ-MAIN","EAST-WING"],"latency_ms":38}', NOW() - INTERVAL '3 minutes'),
(4, (SELECT id FROM deployments WHERE project_id = 4 ORDER BY id DESC LIMIT 1), 'INFO', 'attendance-api', 'KUBERNETES', '[SnapDeploySync] Verified attendance records. Active biometric nodes: 4. Checksum valid.', '{"checksum":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}', NOW() - INTERVAL '4 minutes'),
(4, (SELECT id FROM deployments WHERE project_id = 4 ORDER BY id DESC LIMIT 1), 'WARN', 'attendance-sync-daemon', 'DOCKER', 'Biometric terminal EAST-WING responded in 1840ms (> 1000ms threshold); retried and stabilized', '{"terminal":"EAST-WING","retryCount":1,"stabilized":true}', NOW() - INTERVAL '15 minutes'),
(4, (SELECT id FROM deployments WHERE project_id = 4 ORDER BY id DESC LIMIT 1), 'INFO', 'attendance-api', 'KUBERNETES', 'Employee clock-in event registered: emp_id=EMP-1049 timestamp=2026-10-25T16:30:12Z device=HQ-MAIN', '{"employeeId":"EMP-1049","department":"Engineering","verified":true}', NOW() - INTERVAL '20 minutes'),
(4, (SELECT id FROM deployments WHERE project_id = 4 ORDER BY id DESC LIMIT 1), 'INFO', 'attendance-api', 'KUBERNETES', 'Shift rotation report compiled for 42 scheduled personnel', '{"scheduled":42,"present":41,"on_leave":1}', NOW() - INTERVAL '35 minutes');

-- Realistic logs for NotesApp (project_id = 3)
INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp) VALUES
(3, (SELECT id FROM deployments WHERE project_id = 3 ORDER BY id DESC LIMIT 1), 'INFO', 'notesapp-backend', 'KUBERNETES', 'POST /api/notes 201 Created - user="jestin-16" title="OpsPilot Architecture v2"', '{"userId":"jestin-16","noteId":"nt_8921a","bytes":4200}', NOW() - INTERVAL '1 minute'),
(3, (SELECT id FROM deployments WHERE project_id = 3 ORDER BY id DESC LIMIT 1), 'INFO', 'notesapp-worker', 'DOCKER', 'Elasticsearch document indexing completed: 18 note entities updated', '{"index":"notes_production","docs":18,"tookMs":22}', NOW() - INTERVAL '3 minutes'),
(3, (SELECT id FROM deployments WHERE project_id = 3 ORDER BY id DESC LIMIT 1), 'INFO', 'notesapp-redis', 'KUBERNETES', 'DB 0: 421 keys (0 volatile) in 512 slots. 0 evicted in last 3600s.', '{"used_memory_human":"3.2M","connected_clients":8}', NOW() - INTERVAL '5 minutes'),
(3, (SELECT id FROM deployments WHERE project_id = 3 ORDER BY id DESC LIMIT 1), 'INFO', 'notesapp-backend', 'KUBERNETES', 'WebSocket client connected: session_id=ws_982b14 (jestinshajik@gmail.com)', '{"protocol":"wss","clientIp":"127.0.0.1"}', NOW() - INTERVAL '8 minutes'),
(3, (SELECT id FROM deployments WHERE project_id = 3 ORDER BY id DESC LIMIT 1), 'WARN', 'notesapp-backend', 'KUBERNETES', 'Note sync retry queue depth reached 12 items; drained in 140ms', '{"queue":"sync_retry","drained":12}', NOW() - INTERVAL '25 minutes'),
(3, (SELECT id FROM deployments WHERE project_id = 3 ORDER BY id DESC LIMIT 1), 'INFO', 'notesapp-backend', 'KUBERNETES', 'Automated nightly workspace backup snapshot archived to S3 storage bucket', '{"snapshotSizeMB":48.2,"durationMs":1240}', NOW() - INTERVAL '50 minutes');

-- Realistic logs for E-Commerce Platform (project_id = 7)
INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp) VALUES
(7, (SELECT id FROM deployments WHERE project_id = 7 ORDER BY id DESC LIMIT 1), 'INFO', 'ecommerce-gateway', 'KUBERNETES', '10.42.0.1 - [25/Oct/2026:16:48:12 +0000] "POST /api/v1/cart/checkout HTTP/1.1" 200 482 "https://shop.jestin16.dev" 24ms', '{"status":200,"path":"/api/v1/cart/checkout","method":"POST"}', NOW() - INTERVAL '2 minutes'),
(7, (SELECT id FROM deployments WHERE project_id = 7 ORDER BY id DESC LIMIT 1), 'INFO', 'ecommerce-cache-worker', 'DOCKER', 'Session cleanup daemon: purged 3 expired shopping cart allocations', '{"purged":3,"active_sessions":128}', NOW() - INTERVAL '4 minutes'),
(7, (SELECT id FROM deployments WHERE project_id = 7 ORDER BY id DESC LIMIT 1), 'INFO', 'ecommerce-gateway', 'KUBERNETES', 'Stripe payment intent pi_3P8a192bc9 confirmed: $148.50 USD captured', '{"orderId":"ORD-98214","currency":"USD","amount":148.50}', NOW() - INTERVAL '7 minutes'),
(7, (SELECT id FROM deployments WHERE project_id = 7 ORDER BY id DESC LIMIT 1), 'INFO', 'ecommerce-inventory', 'KUBERNETES', 'Inventory reserved: SKU-PRO-HEADSET qty=1 warehouse=LOC-CENTRAL', '{"sku":"SKU-PRO-HEADSET","quantity":1,"availableStock":43}', NOW() - INTERVAL '11 minutes');

-- Realistic logs for Cafe Management (project_id = 6)
INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp) VALUES
(6, (SELECT id FROM deployments WHERE project_id = 6 ORDER BY id DESC LIMIT 1), 'INFO', 'cafe-order-processor', 'KUBERNETES', '{"timestamp":"2026-10-25T16:48:00Z","level":"INFO","service":"cafe-orders","orderId":"ORD-482190","item":"Espresso","status":"FULFILLED","durationMs":380}', '{"orderId":"ORD-482190","item":"Espresso","duration":380}', NOW() - INTERVAL '2 minutes'),
(6, (SELECT id FROM deployments WHERE project_id = 6 ORDER BY id DESC LIMIT 1), 'INFO', 'cafe-order-stream', 'DOCKER', 'Kitchen display bar node #2 acknowledged order ORD-482190 for preparation', '{"terminal":2,"orderId":"ORD-482190"}', NOW() - INTERVAL '5 minutes'),
(6, (SELECT id FROM deployments WHERE project_id = 6 ORDER BY id DESC LIMIT 1), 'INFO', 'cafe-order-processor', 'KUBERNETES', '{"timestamp":"2026-10-25T16:40:00Z","level":"INFO","service":"cafe-orders","orderId":"ORD-482188","item":"Cold Brew","status":"FULFILLED","durationMs":410}', '{"orderId":"ORD-482188","item":"Cold Brew","duration":410}', NOW() - INTERVAL '10 minutes');

-- Realistic logs for Gemini Image Pipeline (project_id = 9)
INSERT INTO logs (project_id, deployment_id, log_level, source_service, source_type, message, metadata, timestamp) VALUES
(9, (SELECT id FROM deployments WHERE project_id = 9 ORDER BY id DESC LIMIT 1), 'INFO', 'gemini-pipeline-worker', 'KUBERNETES', '[GeminiWorker] Processed multimodal embedding batch 89102: 3200 tokens, latency 280ms', '{"batchId":89102,"tokens":3200,"latencyMs":280}', NOW() - INTERVAL '1 minute'),
(9, (SELECT id FROM deployments WHERE project_id = 9 ORDER BY id DESC LIMIT 1), 'INFO', 'gemini-pipeline-worker', 'KUBERNETES', '[GeminiWorker] Vector similarity search indexed in FAISS store: 48 items inserted', '{"indexed":48,"dimension":768}', NOW() - INTERVAL '6 minutes');

COMMIT;
