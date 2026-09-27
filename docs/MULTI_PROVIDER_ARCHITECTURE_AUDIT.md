# Multi-Provider Architecture Audit

## 1. Current Architecture
OpsPilot is currently built on a microservices architecture based on Spring Boot, with a React-based frontend. It consists of the following key backend services:
- **api-gateway**: Routes traffic and handles central access.
- **service-registry**: Eureka server for service discovery.
- **auth-service**: JWT-based authentication and user management.
- **core-service**: Manages projects, deployments, CI/CD pipelines, Docker, Kubernetes, and Incidents.
- **observability-service**: Collects logs, metrics, handles webhooks, and GitHub commit synchronization.

The current architecture is highly functional but exhibits tight coupling to specific local or single-provider tools in several core areas (e.g., local Docker socket, local Kubernetes cluster configuration, specific GitHub API integrations).

## 2. Existing Provider-Specific Code
- **Docker**: `DockerService` directly uses `docker-java` to communicate with the local Docker daemon.
- **Kubernetes**: `KubernetesService` directly uses `kubernetes-client-java` configured for the local/default cluster.
- **CI/CD**: `CiCdService` executes pipelines locally using `ProcessBuilder` and `docker run`.
- **GitHub**: `GithubSyncService` interacts directly with the GitHub API for commits and webhooks.
- **Observability**: There is already a rudimentary multi-provider pattern in place. Interfaces like `LogProvider` and `MetricsProvider` exist, with concrete implementations like `AwsCloudWatchProvider`, `LokiLogProvider`, and `PrometheusProvider`.

## 3. Existing APIs
The system has a rich set of REST APIs consumed by the frontend (via `api.ts`), including:
- **Docker**: `/docker/containers`, `/docker/containers/{id}/start|stop|restart`
- **Kubernetes**: `/kubernetes/pods`, `/kubernetes/overview`, `/kubernetes/nodes`, `/kubernetes/services`, `/kubernetes/namespaces`
- **CI/CD**: `/cicd/runs`, `/cicd/runs/{id}/logs`, `/cicd/webhooks/github`
- **Integrations**: `/integrations`, `/admin/integrations`
- **Monitoring**: `/monitoring/metrics`, `/monitoring/cluster`, `/monitoring/integrations`

## 4. Existing Database Models
The database already has tables designed for integrations, meaning the schema foundation for multi-provider support is present:
- **`PlatformIntegration`**: Stores `providerType`, `name`, `configJson`, and `active` status.
- **`PlatformSetting`**: Key-value pairs for global configurations.
- **`LogSource`**: Dynamically mapped ingestion sources.
- **Domain Entities**: `Project`, `Deployment`, `ContainerEntity`, `PodEntity`, `PipelineRunEntity`, `Incident`, etc.

## 5. Existing Frontend Integration Surfaces
The React frontend leverages `api.ts` for all communications and heavily features integration surfaces:
- **Settings/Admin**: `IntegrationSettings` interfaces, saving and loading integration configurations.
- **Dashboards**: `KubernetesDashboard`, `DeploymentDetail`, `Pipelines`, `GithubActivity`, `IncidentManagement`.
- **API calls**: Specific endpoints like `getIntegrations`, `saveIntegration`, `getAdminIntegrations`.

## 6. Existing Observability Implementation
The observability layer is the most mature in terms of the multi-provider pattern. It defines `LogProvider` and `MetricsProvider` interfaces. The `LogController` and `MetricsIngestController` delegate to these providers based on the project's configuration (e.g., AWS CloudWatch vs. Loki).

## 7. Existing Authorization Model
- JWT-based authentication via `JwtTokenProvider`.
- Role-based access control (RBAC). For example, `DockerService` checks `isPrivileged(currentUser)` (ADMIN or DEVOPS) versus project owner (`container.getDeployment().getProject().getOwner()`).
- The API gateway routes and filters requests based on these roles.

## 8. What Can Be Reused
- **Observability Interfaces**: The `LogProvider` and `MetricsProvider` interfaces and their registry pattern can serve as a template for other domains.
- **Database Schema**: `PlatformIntegration` and `PlatformSetting` are perfectly suited to store credentials and configurations for new providers (e.g., AWS EKS, GCP GKE, GitLab CI).
- **Frontend Components**: Reusable UI components (`Modal`, `Table`, `Tabs`, `ConfirmDialog`) can be used to build the new Provider configuration screens.
- **Domain Entities**: `Project`, `Deployment`, `PipelineRunEntity`, etc., do not need to change; they simply represent the abstract concept regardless of the provider.

## 9. What Should Be Extended
- **CI/CD Provider Abstraction**: Introduce a `CiCdProvider` interface. The existing `CiCdService` logic should be refactored into a `LocalDockerCiCdProvider`. New providers (e.g., `GitHubActionsProvider`, `GitLabProvider`) can then be added.
- **Container/Cluster Provider Abstraction**: Introduce a `KubernetesProvider` (and potentially a `ContainerRuntimeProvider`). Move the existing `kubernetes-client-java` logic into a `LocalKubernetesProvider`.
- **Integration Factory/Registry**: A centralized service (e.g., `IntegrationRegistry`) to instantiate and retrieve the correct provider implementation based on the `PlatformIntegration` configuration linked to a specific `Project`.

## 10. What Must NOT Be Rewritten
- **Core Entity Relationships**: Do not alter how `Project`, `Deployment`, and `User` relate to one another.
- **Security Context**: Do not change the JWT authentication flow or the role-based checks.
- **Existing Frontend Routes**: Do not break existing paths like `/projects/:id` or `/kubernetes`. The multi-provider logic should be handled mostly on the backend, or cleanly integrated into the existing UI tabs.
- **API Gateway & Service Registry**: The microservice boundaries (Eureka, Gateway routing) must remain intact.

## 11. Recommended Files to Modify
- `backend/core-service/src/main/java/com/opspilot/service/CiCdService.java` -> Refactor to use interfaces.
- `backend/core-service/src/main/java/com/opspilot/service/KubernetesService.java` -> Refactor to use interfaces.
- `backend/core-service/src/main/java/com/opspilot/service/DockerService.java` -> Refactor to use interfaces.
- `backend/shared-lib/src/main/java/com/opspilot/entity/PlatformIntegration.java` (Optional: add relation to Project if project-level integrations are needed).
- New interfaces: `CiCdProvider.java`, `KubernetesProvider.java` in `shared-lib` or within `core-service`.
- Frontend: `frontend/src/pages/SecuritySettings.tsx` or an `Integrations.tsx` to handle provider setup forms.

## 12. Potential Risks
- **Backward Compatibility**: Existing projects assume local Docker/Kubernetes. We must ensure a default "Local" provider is automatically assigned or inferred so existing deployments do not break.
- **Credential Management**: Storing API keys for AWS, GCP, or GitHub in `PlatformIntegration.configJson` requires careful handling (encryption at rest is recommended).
- **Asynchronous Execution**: External providers (like GitHub Actions) are heavily asynchronous. Our current `CiCdService` waits synchronously (up to 60s) for local Docker builds. Integrating external CI requires shifting to a fully webhook/polling based async state machine for `PipelineRunEntity`.

---

## Implementation Plan

1. **Define Provider Interfaces**: Create `CiCdProvider`, `KubernetesProvider`, and `ContainerProvider` interfaces outlining the essential capabilities (e.g., `startPipeline()`, `getPods()`, `getContainers()`).
2. **Refactor Existing Services to Local Providers**: Extract the current logic from `CiCdService`, `KubernetesService`, and `DockerService` into `LocalDockerCiCdProvider`, `LocalKubernetesProvider`, and `LocalDockerProvider` respectively.
3. **Implement Provider Registry**: Create a factory/registry service that reads `PlatformIntegration` from the database and returns the correct provider instance.
4. **Update Core Services**: Modify `CiCdService`, `KubernetesService`, etc., to delegate calls to the correct provider retrieved from the registry, rather than executing the logic directly.
5. **Frontend Integration UI**: Extend the frontend Admin/Settings pages to allow users to add new `PlatformIntegration` records with specific `providerType` and `configJson` payloads.
