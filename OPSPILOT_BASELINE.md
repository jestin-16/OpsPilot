# OpsPilot Baseline Status Report

## Commands Executed
- `git status`
- `npm run build` (in `frontend/`)
- `.\mvnw.cmd clean test` (in `backend/`)
- `netstat -ano | findstr LISTENING`
- `& "C:\Program Files\Git\bin\bash.exe" verify-developer-role.sh`
- `& "C:\Program Files\Git\bin\bash.exe" verify-devops-role.sh`

## Checks Summary

### Successful Checks
- **Git Status**: Branch is up to date with `origin/main`. Several uncommitted modifications related to recent features.
- **Frontend Build (`npm run build`)**: Vite and TypeScript compilation succeeded flawlessly. 2,587 modules transformed, built in ~652ms (or 11.91s earlier).

### Failed Checks
- **Backend Tests (`.\mvnw.cmd clean test`)**: Failed during the `core-service` test execution.
  - **Diagnosis**: The failure was caused by `NotesAppTest.testValidationDeliberatelyFailing:14` which threw `AssertionFailedError: expected: <false> but was: <true>`. According to the project history (`PROGRESS.md`), this is a deliberately broken test injected to verify the CI/CD pipeline's ability to handle test failures. 

### Blocked Checks
- **Developer Verification Script (`verify-developer-role.sh`)**: Blocked (`BLOCKED=9`).
- **DevOps Verification Script (`verify-devops-role.sh`)**: Blocked (`BLOCKED=1`).
  - **Diagnosis**: Both scripts failed immediately because the live API is unavailable. Connection to `http://localhost:8080/api/v1` was refused. The backend microservices and databases are currently offline.

## Port Configuration & Active Services

### Current Ports Listening
None of the required application ports are currently listening. The output of `netstat -ano` shows only standard system services and unrelated background tasks.

### Services Required to Run the Application
Based on the architecture and `docker-compose.yml`, the following services and ports are required to be running for full E2E verification:
1. **Infrastructure/Databases**:
   - `postgres` (port 5432)
   - `prometheus` (port 9090)
   - `grafana` (port 3000)
   - `blackbox-exporter` (port 9115)
2. **Spring Boot Backend Microservices**:
   - `service-registry` (Eureka - port 8761)
   - `api-gateway` (Spring Cloud Gateway - port 8080)
   - `auth-service` (port 8081)
   - `core-service` (port 8082)
   - `observability-service` (port 8083)
3. **Frontend Application**:
   - React Vite dev server (port 5173)

## Conclusion
The repository codebase compiles successfully in the frontend, but backend test compilation is currently failing intentionally due to a CI/CD test fixture. Verification scripts are blocked because the local environment infrastructure and Spring Boot microservices are not running. The baseline is successfully established.
