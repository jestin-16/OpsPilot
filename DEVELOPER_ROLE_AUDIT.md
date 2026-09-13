# Developer Role End-to-End Audit

Date: 2026-09-13
Scope: Developer-owned real features only. Deployment Center status simulation, Kubernetes Management, CI/CD pipeline execution, and AI Assistant were not exercised or modified.

## Execution environment

- Repository: `d:\OpsPilot`
- Docker check: `docker compose ps` failed because Docker Desktop Linux engine is not running: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`
- Listening-service check: no process was listening on ports 8080, 8081, 8082, 8083, 8761, 5432, 5173.
- Therefore a live HTTP login/API execution against the local stack and Docker-dependent verification could not be completed in this environment. Results below distinguish executable observations from blocked checks.

## Pre-change findings

| # | Feature | Developer-role execution result | Evidence / exact failure |
|---|---|---|---|
| 1 | Register/login and own profile | BLOCKED | No local auth service was running. Seeded Developer fixture is documented in `backend/shared-lib/src/main/java/com/opspilot/config/DataInitializer.java` as `developer@opspilot.io` / `Password123!`, but no HTTP login was possible. |
| 2 | Own project CRUD | BLOCKED | No local core service was running, so create/view/update/delete could not be executed. Existing service path calls owner checks for item access and mutation. |
| 3 | Link GitHub repository URL | BLOCKED | No local core service was running, so project create/update through the wizard could not be executed. |
| 4 | Start/stop/restart own Docker containers | BLOCKED / FAILS AGAINST SCOPE | Docker daemon unavailable. Static pre-change inspection found `DockerService` only changes `containerStatus` in the database; it does not invoke the Docker daemon, so this cannot be verified as real Docker integration from this checkout. |
| 5 | Real-time Docker status matching independent `docker ps` | BLOCKED / FAILS AGAINST SCOPE | Docker daemon unavailable. `DockerService.getContainersForUser` reads `ContainerRepository`; no `docker ps` or Docker client integration was available in the executable path inspected. |
| 6 | Add Project log source, webhook secret, first event | BLOCKED | No observability service was running, so wizard/API creation and webhook delivery could not be executed. Ownership checks are present in `LogSourceController`; webhook authentication is header-secret based. |
| 7 | Own centralized logs and SSE | BLOCKED; authorization risk identified | No observability service was running. `LogService.searchLogs` uses `searchLogsForOwner` for local logs, but SSE runtime access is in core project endpoints. |
| 8 | Live ProjectRunner clone/run and stdout/stderr | BLOCKED | No core service was running. Runner implementation is present, but execution could not be triggered. |

## Required negative-case checks

These could not be sent to a live API because no service was running. The following pre-change authorization defects were identified and must be verified after repair:

- Cross-user project CRUD: `ProjectService` has owner/admin checks for direct project operations.
- Cross-user Docker container actions: `DockerService.getContainerForUser` has owner/admin checks.
- Cross-user logs: local log search uses owner-scoped repository queries for non-admin users.
- Cross-user ProjectRunner/runtime access: `ProjectController.stopProject`, `projectStatus`, `streamLogs`, `proxyRequest`, and `getProjectOutput` do not accept/authenticate the current user; `SecurityConfig` permits these paths publicly. `getProjectOutput` explicitly calls `projectService.getProjectById(id, null)`. This is a confirmed authorization gap by code path, pending live API confirmation when the stack is available.

## Pre-change dashboard finding

Developer navigation currently exposes Projects but not Docker or Logs, and the dashboard’s primary Developer CTA is New Project. Docker and Logs are role-restricted to DevOps/Admin in `frontend/src/components/SidebarLayout.tsx`, so the required Developer surfaces are not reachable as specified.

## Audit conclusion

The audit cannot claim end-to-end passes because the required local services and Docker daemon were unavailable. Confirmed gaps to close are runtime endpoint authorization and Developer navigation/role exposure. Docker daemon integration remains an environment-blocked verification item and requires a running Docker Desktop engine for final evidence.

## Post-change verification

- Backend compile after runtime authorization, self-profile, and Docker daemon changes: `BUILD SUCCESS` for `shared-lib` and `core-service`.
- Frontend build: still fails on 27 pre-existing TypeScript errors in `frontend/src/components/views/LogsView.tsx`, `frontend/src/pages/BlackboxMonitoring.tsx`, and `frontend/src/pages/LogSources.tsx`; the Developer changes no longer add an error.
- `verify-developer-role.sh` actual run on 2026-09-13:

	```text
	OpsPilot Developer E2E verification
	API: http://localhost:8080/api/v1

	BLOCKED  Live API unavailable: curl: (7) Failed to connect to localhost:8080 after 2261 ms: Could not connect to server
	BLOCKED  1 Register/login and own profile
	BLOCKED  2 Own project CRUD and GitHub URL
	BLOCKED  3 Own Docker lifecycle and docker ps status
	BLOCKED  4 Cross-user project/container access blocked
	BLOCKED  5 Log-source wizard and first webhook event
	BLOCKED  6 Own centralized logs and SSE
	BLOCKED  7 Cross-user logs blocked
	BLOCKED  8 Live ProjectRunner output stream

	Summary: PASS=0 FAIL=0 BLOCKED=9
	```

- The script exits nonzero when live prerequisites are unavailable and reports `BLOCKED`; it does not claim end-to-end success without actual execution.
