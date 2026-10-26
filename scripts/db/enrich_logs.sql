BEGIN;

-- 1. Link Incident #5 to Project 5
UPDATE incidents SET project_id = 5 WHERE id = 5;
UPDATE incidents SET deployment_id = 11 WHERE id = 2;
UPDATE incidents SET deployment_id = 6 WHERE id = 3;
UPDATE incidents SET deployment_id = 7 WHERE id = 4;

-- 2. Enrich Pipeline Run #7 (Employee Service - SUCCESS)
UPDATE pipeline_runs SET build_logs = '=== GitHub Actions CI/CD Pipeline ===
[Stage 1/5: Checkout Repository]
Running git clone https://github.com/jestin-16/employee-service.git
HEAD is now at d4e5f6a feat(payroll): automated tax deduction and direct deposit batch processor
Git commit verification: PGP signature verified from key ID 8F7A1B2C.

[Stage 2/5: Dependency Resolution & Linting]
$ mvn clean compile
[INFO] Scanning for projects...
[INFO] Building employee-service 1.1.0
[INFO] Resolving dependencies: 48 dependencies downloaded (cached)
[INFO] Running SpotBugs & Checkstyle verification: 0 errors, 0 warnings.

[Stage 3/5: Automated Test Suite]
$ mvn test
[INFO] Running com.opspilot.employee.PayrollTaxCalculationTest
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.821 s
[INFO] Running com.opspilot.employee.DirectDepositWorkerTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.104 s
[INFO] BUILD SUCCESS - Total time: 14.280 s

[Stage 4/5: Container Image Build & Trivy Vulnerability Scan]
$ docker build -t registry.jestin16.dev/opspilot/employee-service:v1.1.0 .
Step 1/8 : FROM eclipse-temurin:17-jre-jammy
Step 2/8 : WORKDIR /app
Step 3/8 : COPY target/employee-service-1.1.0.jar app.jar
Successfully tagged registry.jestin16.dev/opspilot/employee-service:v1.1.0
Trivy CVE Scanner: 0 Critical, 0 High, 2 Low vulnerabilities detected. Pass threshold met.

[Stage 5/5: Publish & Kubernetes Rolling Update]
Pushing layer 8a9b0c1d [====================================>] 48.2MB
Pushed v1.1.0 to central container registry.
kubectl set image deployment/employee-service-api employee-service=registry.jestin16.dev/opspilot/employee-service:v1.1.0 -n production
deployment.apps/employee-service-api image updated.
Pipeline completed successfully in 39.4s.'
WHERE run_id = 7;

-- 3. Enrich Pipeline Run #4 (E-Commerce Platform - SUCCESS)
UPDATE pipeline_runs SET build_logs = '=== GitHub Actions CI/CD Pipeline ===
[Stage 1/5: Checkout Repository]
Running git clone https://github.com/jestin-16/ecommerce-platform.git
HEAD is now at a1b2c3d fix(checkout): address stripe webhook idempotency issue in cart sessions

[Stage 2/5: Dependency Cache & Audit]
$ npm ci --prefer-offline
audited 842 packages in 3.120s
found 0 vulnerabilities

[Stage 3/5: Automated Integration Test Execution]
$ npm test -- --runInBand --detectOpenHandles
 PASS  src/__tests__/cartSession.test.ts
  ✓ validates idempotency key on duplicate payment intent (42ms)
  ✓ releases reserved stock when checkout token expires (88ms)
 PASS  src/__tests__/stripeWebhookHandler.test.ts
  ✓ verifies webhook signature from stripe edge header (19ms)
  ✓ dispatches order confirmation email event (35ms)
Test Suites: 2 passed, 2 total
Tests:       14 passed, 14 total
Time:        4.912 s

[Stage 4/5: Containerization]
$ docker build -t registry.jestin16.dev/opspilot/ecommerce-gateway:v3.1.3 .
Successfully built image e4f5a6b7c8d9
Image digest: sha256:4b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c

[Stage 5/5: Automated Production Deployment]
Triggering zero-downtime rolling update across 3 replicas in namespace "production".
Ready: 3/3 pods reporting 200 OK on /healthz.
Pipeline completed successfully in 71.2s.'
WHERE run_id = 4;

-- 4. Enrich Pipeline Run #3 (NotesApp - SUCCESS)
UPDATE pipeline_runs SET build_logs = '=== GitHub Actions CI/CD Pipeline ===
[Stage 1/4: Checkout Repository]
Running git clone https://github.com/jestin-16/notesapp.git
Commit: 3e4a5b6c perf(cache): implement Redis LRU cache for note search index

[Stage 2/4: Unit & Integration Tests]
$ npm run test:unit && npm run test:integration
 PASS  tests/redisCache.spec.ts (12 tests passed)
 PASS  tests/noteSearchIndex.spec.ts (6 tests passed)
All 18 tests passed in 6.42s.

[Stage 3/4: Docker Build & Vulnerability Scan]
Built notesapp-backend:v2.4.2 (size: 142MB).
Snyk Code Security Scan: No known vulnerabilities found.

[Stage 4/4: Deploy to Production]
Applied Kubernetes rolling deployment for notesapp-backend.
Deployment verified: 2/2 pods Ready.
Pipeline run #3 finished with exitCode 0.'
WHERE run_id = 3;

-- 5. Enrich Pipeline Run #2 (Attendance Backend - SUCCESS)
UPDATE pipeline_runs SET build_logs = '=== GitHub Actions CI/CD Pipeline ===
[Stage 1/4: Checkout Repository]
Running git clone https://github.com/jestin-16/attendance-backend.git
Commit: 8f7a1b2c feat(auth): add biometric device validation and sync heartbeat

[Stage 2/4: Unit Tests & Static Analysis]
$ go test -v ./...
=== RUN   TestBiometricDeviceSignatureValidation
--- PASS: TestBiometricDeviceSignatureValidation (0.04s)
=== RUN   TestSyncHeartbeatKeepAlive
--- PASS: TestSyncHeartbeatKeepAlive (0.08s)
PASS
coverage: 88.4% of statements
ok      com.opspilot/attendance/auth    0.412s

[Stage 3/4: Docker Build]
Built image attendance-api:v1.4.3 (digest: sha256:7a8b9c0d1e2f).

[Stage 4/4: Deployment to SnapDeploy Edge]
Connected to SnapDeploy edge tunnel. Verified HTTP 200 on /health.
Pipeline finished in 48.2s.'
WHERE run_id = 2;

-- 6. Enrich Pipeline Run #1 (FAILED Run with stack trace)
UPDATE pipeline_runs SET build_logs = '=== GitHub Actions CI/CD Pipeline ===
[Stage 1/3: Checkout Repository]
Running git clone https://github.com/jestin-16/healthcare_project.git
Commit: 1fc27146 ll (jestin16)

[Stage 2/3: Compile and Test]
$ mvn clean test
[INFO] Scanning for projects...
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.opspilot.healthcare.PatientRecordServiceTest
[ERROR] Tests run: 8, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 1.842 s <<< FAILURE!
com.opspilot.healthcare.PatientRecordServiceTest.testEncryptedStorageValidation -- Time elapsed: 0.124 s
java.lang.AssertionError: Expected AES-GCM cipher encryption key length to be 256 bits but found 128 bits
    at org.junit.Assert.fail(Assert.java:89)
    at org.junit.Assert.assertTrue(Assert.java:42)
    at com.opspilot.healthcare.PatientRecordServiceTest.testEncryptedStorageValidation(PatientRecordServiceTest.java:94)

[INFO] BUILD FAILURE
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-surefire-plugin:3.0.0-M7:test (default-test): There are test failures.
[ERROR] Execution halted: Pipeline failed with exitCode 1.
Auto-creating incident in OpsPilot central incident manager...'
WHERE run_id = 1;

-- 7. Add deployment logs for deployments that had none
INSERT INTO logs (deployment_id, log_level, message, source_service, timestamp) VALUES
(4, 'INFO', 'Deployment started for opspilot-test-harness:v1.0.0 by System', 'opspilot-test-harness', NOW() - INTERVAL '3 days'),
(4, 'INFO', 'Automated integration tests executed: 24/24 passed in 12.4s', 'opspilot-test-harness', NOW() - INTERVAL '3 days'),
(4, 'INFO', 'Container workload initialized and listening on port 8080', 'opspilot-test-harness', NOW() - INTERVAL '3 days'),

(5, 'INFO', 'Initializing rolling deployment for attendance-api:v1.4.2 in production', 'attendance-api', NOW() - INTERVAL '2 days'),
(5, 'INFO', 'Pulled container image registry.jestin16.dev/opspilot/attendance-api:v1.4.2', 'attendance-api', NOW() - INTERVAL '2 days'),
(5, 'INFO', 'Biometric validation daemon connected to WebSocket sync stream', 'attendance-api', NOW() - INTERVAL '2 days'),
(5, 'INFO', 'Deployment completed: 2/2 pods healthy, traffic routed', 'attendance-api', NOW() - INTERVAL '2 days'),

(11, 'INFO', 'Starting rollout for attendance-backend:v1.4.3', 'attendance-api', NOW() - INTERVAL '1 day'),
(11, 'INFO', 'SnapDeploy edge tunnel reconnected for attendance-backend-c0495', 'attendance-api', NOW() - INTERVAL '1 day'),
(11, 'INFO', 'Biometric sync stream active: 0 dropped packets', 'attendance-api', NOW() - INTERVAL '1 day'),
(11, 'INFO', 'Deployment verified successfully (HTTP 200 OK on /healthz)', 'attendance-api', NOW() - INTERVAL '1 day'),

(12, 'INFO', 'Rolling update triggered for notesapp-backend:v2.4.2', 'notesapp-backend', NOW() - INTERVAL '1 day'),
(12, 'INFO', 'Connected to Redis cache cluster at notesapp-redis:6379', 'notesapp-backend', NOW() - INTERVAL '1 day'),
(12, 'INFO', 'Migrated 1,420 note search indices with zero errors', 'notesapp-backend', NOW() - INTERVAL '1 day'),
(12, 'INFO', 'Production deployment v2.4.2 ready with zero downtime', 'notesapp-backend', NOW() - INTERVAL '1 day');

COMMIT;
