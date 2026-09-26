# OpsPilot Technical Implementation Audit

## 1. Current Architecture
OpsPilot is an AI-Assisted Internal Developer Platform (IDP) designed using a microservices architecture. It integrates with Docker, Kubernetes, Kafka, Prometheus, Loki, and GitHub. 
The system enforces strict Third Normal Form (3NF) relational integrity and is built using:
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend Core**: Spring Boot 3, Java 17+, Spring Cloud Gateway (API Gateway)
- **Data & Event Persistence**: PostgreSQL (3NF Store), Redis (Cache/Sessions), Apache Kafka (Event Bus)

### Microservices:
1. `service-registry`: Eureka Server for service discovery.
2. `api-gateway`: Spring Cloud Gateway for routing and JWT Security.
3. `auth-service`: Authentication, Registration, Email Verification (OTP), and RBAC management.
4. `core-service`: Manages Projects, Deployments, Docker, Kubernetes, Admin Governance, and User profiles.
5. `observability-service`: Manages AI queries, Logs, Metrics, Monitoring, Notifications, and GitHub Webhooks (CI/CD sync).
6. `shared-lib`: Contains all Database Entities, DTOs, Repositories, Exceptions, and Utilities.

## 2. Existing Modules
- **Authentication & RBAC**: JWT-based auth, Google OAuth login, Email OTP verification, Role-based protection (`Admin`, `Developer`, `DevOps Engineer`).
- **Project Management**: CRUD operations for projects, repository tracking, and ownership authorization.
- **Deployment Engine**: Deployment history tracking and status simulation/execution.
- **Infrastructure (Docker/K8s)**: Container listing and lifecycle (start/stop/restart), Kubernetes pod querying and monitoring.
- **Observability**: Multi-project Actuator/Prometheus metrics, structured JSON logging, Blackbox monitoring, and AI-assisted root-cause diagnosis.
- **CI/CD Integration**: GitHub webhook listeners for pipeline runs and historical commit synchronization.

## 3. Existing APIs (Based on API Gateway / React Client)
- **Auth**: `/auth/register`, `/auth/login`, `/auth/verify-otp`, `/auth/resend-otp`, `/auth/google-login`, `/auth/refresh`, `/auth/logout`
- **Users**: `/users/me` (GET/PUT)
- **Projects**: `/projects` (GET/POST/PUT/DELETE), `/projects/{id}/deployments`, `/projects/{id}/log-sources`, `/projects/{id}/complete-setup`
- **Docker**: `/docker/containers`, `/docker/containers/{id}/start|stop|restart`
- **Kubernetes**: `/kubernetes/pods`
- **Logs**: `/logs` (GET/POST)
- **Commits**: `/commits`, `/commits/project/{id}`, `/commits/sync`, `/commits/project/{id}/sync`
- **Notifications**: `/notifications`, `/notifications/{id}/read`
- **Monitoring**: `/monitoring/metrics`, `/monitoring/integrations`, `/monitoring/cluster`, `/monitoring/probe`
- **CI/CD / Webhooks**: `/cicd/runs`, `/cicd/webhooks/github`
- **AI**: `/ai/query`
- **Admin**: `/admin/overview`, `/admin/audit-logs`, `/admin/integrations`, `/admin/settings`

## 4. Existing Frontend Pages & Components
- **Pages**: `LandingPage`, `Login`, `Signup`, `VerifyEmailOTP`, `Dashboard`, `Projects`, `ProjectWizard`, `LiveProjectDashboard`, `DeploymentsPage`, `DockerPage`, `BlackboxMonitoring`, `WhiteboxMonitoring`, `LogManagement`, `LogSources`, `NotificationCenter`, `PlatformGuide`, `ProfilePage`, `UserManagement`, `AdminDashboard`, `AdminGovernance`, `AdminProjectManagement`
- **Components**: `SidebarLayout`, `Button`, `Card`, `Input`, `LoginBackground3D`, `LoginTiltPanel`, `AlertProvider`, `Logo`, and numerous metric/chart components.

## 5. Existing Database Entities (shared-lib)
- `User`: user_id, name, email, password_hash, created_at
- `Role`: role_id, role_name, description
- `Project`: project_id, project_name, description, repository_url, owner_id, status, created_at
- `Deployment`: deployment_id, project_id, deployed_by, version, environment, status
- `ContainerEntity`: container_id, deployment_id, image_name, container_status
- `PodEntity`: pod_id, container_id, node_name, pod_status, cpu_usage, memory_usage
- `LogEntity`: log_id, deployment_id, source_service, log_level, message
- `NotificationEntity`: notification_id, user_id, deployment_id, message, type, is_read
- `PipelineRunEntity`: run_id, project_id, event_type, branch, commit_sha, status
- `CommitLogEntity`: commit_sha, branch_name, author, message, project_id
- `AuditLog`, `EmailVerificationOtp`, `LogSourceEntity`, `PlatformIntegration`, `PlatformSetting`, `RefreshToken`

## 6. Existing Verified Features
- Spring Boot Multi-module Maven setup successfully builds and runs.
- Authentication pipeline (Registration, Email OTP, JWT refresh, Google Auth) is active and verified.
- Project lifecycle and Developer/DevOps RBAC boundary restrictions are functional and verified.
- CI/CD execution pipeline uses sandboxed Docker (`docker run --rm alpine sh -c`).
- GitHub Commit synchronization and Webhooks are active.
- End-to-end multi-project Prometheus metrics parsing.

## 7. Features That Are Incomplete / To Be Built
- Advanced Kafka event streaming (infrastructure configured but deeply integrated event sourcing might be pending full use in all services).
- Kubernetes management might be limited to read-only pod listing (as opposed to full cluster provisioning).
- Full Loki log correlation UI/Backend integrations.
- Further AI Assistant depth (correlation across more varied data sets).

## 8. Features That Should Be Reused
- The `AuthContext` and JWT Axios interceptors in `frontend/src/services/api.ts` must be reused for all frontend requests.
- UI Design System: Stick strictly to the dark/light theme, glassmorphism, and Tailwind styling established in `index.css` and existing components.
- The `shared-lib` Entity/Repository structure must be used for any new data storage needs.
- The `AiAssistantController` and existing `AiDiagnosisResponse` interfaces for any AI expansions.

## 9. Files That Should Be Modified for Upcoming Work
Depending on the next feature:
- `backend/shared-lib/src/main/java/com/opspilot/entity/*` (For schema updates)
- `frontend/src/services/api.ts` (For new endpoints)
- `frontend/src/pages/*` (For new views)
- Service modules in `backend/core-service` or `backend/observability-service` depending on domain.

## 10. Potential Risks/Regressions
- **Database Schema**: Modifying `shared-lib` Entities requires recompiling all dependent microservices. 
- **Serialization Cycles**: Care must be taken (using `@JsonIgnore`) when adding relationships to prevent infinite JSON recursion (as addressed in `CommitLogEntity`).
- **Security Context**: Bypassing the Gateway or misconfiguring `SecurityConfig` could break the finely-tuned RBAC model (`isPrivileged` checks).
- **Rate Limits**: Calling GitHub APIs without cached fallbacks (already mitigated via `PipelineRunEntity` fallback) can lead to rate limiting.
- **Port Conflicts**: Running local test environments requires ports 5432, 8761, 8080-8083, 9090, 3000, 9115 to be available.

## Summary
OpsPilot is a sophisticated, functioning microservices platform with a highly polished React 18 UI. The backend heavily utilizes Spring Boot and separates concerns well via a `shared-lib` and API Gateway. The platform has robust baseline features for Auth, Projects, Commits, Deployments, and Docker monitoring. Moving forward, the focus should be on integrating cleanly with existing APIs and maintaining the established architectural boundaries and visual design system.
