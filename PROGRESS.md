# OpsPilot Codebase & Progress Report (AI Hand-Off Document)

**Status**: Active Development & Continuous Verification
**Last Updated**: September 30, 2026

---

## 🚀 Executive Summary

OpsPilot is an enterprise-grade DevOps automation platform that has recently transitioned from a mocked prototype to a system powered by live, sandboxed integrations. 

This document serves as a complete architectural map, progress report, and context file for further AI-assisted development. It covers the microservices architecture, frontend stack, database schema, and the newly implemented multi-cloud integration framework.

---

## 🏗️ Architecture & Technology Stack

### Backend Stack (Microservices Architecture)
- **Language**: Java 26
- **Framework**: Spring Boot 3.x (Aggregator POM with 6 microservices)
  - `shared-lib`: Common entities, DTOs, and utilities.
  - `service-registry`: Eureka Service Registry (Port: 8761).
  - `api-gateway`: Spring Cloud Gateway (Port: 8080). Routes `/api/v1/**` to underlying services.
  - `auth-service`: Authentication, JWT issuance, and User/Role management (Port: 8081).
  - `core-service`: Projects, Deployments, CI/CD, Kubernetes, Integrations, Incidents (Port: 8082).
  - `observability-service`: Logs, Metrics, Global Commits (Port: 8083).
- **Database**: PostgreSQL 15 (managed via Flyway migrations).
- **Security**: Spring Security, BCrypt (strength 12), dual-token JWT (Access Token in header, Refresh Token in `httpOnly` cookie).
- **Testing**: JUnit 5, Testcontainers (PostgreSQL integration tests).

### Frontend Stack
- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with a modern, glassmorphic UI (Inter font, dark/light design tokens).
- **State & Data Fetching**: TanStack Query (React Query) and Axios (with automatic 401 interceptor token refresh).
- **Validation**: Zod client-side schemas matching backend Bean Validation rules.
- **Auth Integration**: `@react-oauth/google` for SSO.

---

## 🛠️ Completed Scope & Modules

### 1. Multi-Cloud Integration Framework
A massive architectural upgrade introduced the `IntegrationProviderRegistry` and dedicated adapters inside `core-service/src/main/java/com/opspilot/integration/adapters/`:
- **AWS**: `AwsIntegrationAdapter`
- **Oracle Cloud**: `OracleCloudIntegrationAdapter`
- **Vercel**: `VercelIntegrationAdapter`
- **Docker**: `DockerIntegrationAdapter` (Replaced mocked status strings with real daemon interactions using `ZerodepDockerHttpClient`).
- **Kubernetes**: `KubernetesIntegrationAdapter` (Replaced mocked pod data with official `io.kubernetes:client-java` calling `CoreV1Api.listPodForAllNamespaces()`).
- **GitHub**: `GitHubIntegrationAdapter` (Historical commits sync, webhook payload parsing).

### 2. Sandboxed CI/CD Engine (`CiCdService.java`)
- **Execution Engine**: Replaced `Thread.sleep()` simulations with genuine `docker run --rm alpine` sandbox executions. Pipeline tasks take real time, output real standard logs/errors, and return authentic exit codes (0 for SUCCESS, 1 for FAILED).
- **Security & Authorization**: Strict allowlists reject unauthorized GitHub repositories with `HTTP 403 Forbidden`.
- **Event-Driven Resilience**: Handles failure elegantly without hanging runner threads, automatically spawning `Incident` tickets on failure.

### 3. Event-Driven Alerting & Observability
- **Alerting Engine**: Configurable notification channels broadcast critical pipeline failures, infrastructure degradations, and deployment statuses via `NotificationService`.
- **Live Logs**: `GenericWebhookIngestController` accepts incoming NDJSON/JSON arrays asynchronously. Logs are streamed to the frontend via Server-Sent Events (SSE) in `ProjectRunnerService`.

### 4. Authentication, RBAC & Hardening
- **User Models**: `User` and `Role` (Developer, DevOps Engineer, Administrator).
- **Security Layers**: Rate limiting (5 attempts / 15 min), strict CORS policy locking origins to frontend, custom `@ControllerAdvice` envelope returning structured errors.
- **Project Isolation**: Strict JPA queries and service checks verify that a user can only access, mutate, or trigger pipelines for projects they own (unless they are a privileged DevOps/Admin role).

### 5. Frontend UI & Dashboards
- **ProjectWizard**: A guided multi-step onboarding flow for repositories and cloud connections.
- **Operations Center**:
  - `Dashboard.tsx`: Overview telemetry.
  - `DeploymentsPage.tsx` / `DeploymentDetail.tsx`: Live deployment history.
  - `Pipelines.tsx` / `PipelineDetail.tsx`: Live CI/CD logs.
  - `KubernetesDashboard.tsx`: Cluster node topology and pod drill-downs.
  - `IncidentManagement.tsx`: Triage and severity assignment.
  - `SecuritySettings.tsx` & `ProfilePage.tsx`: Credential management.

---

## 🗄️ Database Schema Summary
- **Users / Roles**: `users`, `roles`, `user_roles`.
- **Projects**: `projects` (mapped to `owner_id`).
- **Deployments**: `deployments` (mapped to `project_id`).
- **Infrastructure**: `containers`, `pods`.
- **CI/CD & Events**: `pipeline_runs`, `incidents`, `logs`, `commit_logs`, `notifications`.

---

## 🧪 Verification & Audit History

- **DevOps Engineer Role (2026-09-20)**: Verified that DevOps roles can successfully fetch containers across multiple projects (bypassing the standard Developer constraint) and interact with live Kubernetes clusters.
- **Developer Role (2026-09-19)**: Verified proper HTTP 403 blocks when attempting to alter other tenants' projects or execute unauthorized pipelines.
- **CI/CD Reliability (2026-09-21)**: Verified that failing tests inside the Docker sandbox accurately halt the pipeline and capture the `assertFalse(true)` logs without crashing the worker pool.
- **Database Restoration (2026-09-27)**: Cleaned the `DataInitializer.java` to remove fake test data, ensuring demo flows run on clean state.

---

## 🎯 Next Steps & Priorities for Claude

If you are picking up this project, prioritize the following tasks:

1. **Frontend-to-Backend Cloud Bridging**:
   - The backend integration adapters (AWS, Oracle, Vercel) are built, but the frontend `ProjectWizard` needs to be fully wired up to these APIs to allow users to authenticate and select live resources during onboarding.
   
2. **AI Copilot Implementation**:
   - The current `AiAssistantService.java` relies on hardcoded string matching and regex (e.g., returning "94% confidence"). 
   - **Task**: Replace this with an actual LLM integration (OpenAI API or Gemini API), feeding the sandboxed CI/CD logs or Kubernetes pod logs into the prompt to generate authentic root-cause analysis.

3. **Automated Frontend Testing**:
   - The backend has solid JUnit / Testcontainer coverage, but the frontend lacks a configured test runner.
   - **Task**: Configure Vitest and React Testing Library in the frontend, and add baseline coverage for the critical Auth, ProjectWizard, and Dashboard components.

4. **Integration Tests for Multi-Cloud Adapters**:
   - Ensure complete automated test coverage exists for `AwsIntegrationAdapter` and `VercelIntegrationAdapter` using mocking frameworks (like WireMock or Mockito) so they don't break during refactors.
