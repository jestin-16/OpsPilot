# OpsPilot Milestone 1 Progress Report (30% Scope Complete)

**Status**: Milestone 1 Complete  
**Date**: August 5, 2026  

---

## Completed Scope Summary

### 1. Authentication & RBAC Module
- [x] **User Entity**: `id`, `name`, `email` (unique), `password_hash`, `is_active`, `created_at`.
- [x] **Role Entity**: `id`, `role_name` (`Developer`, `DevOps Engineer`, `Administrator`), `description`.
- [x] **User_Roles Join Table**: Many-to-many relationship mapping users to roles.
- [x] `POST /api/auth/register` - Creates user with selected role and hashes password with BCrypt.
- [x] `POST /api/auth/login` - Validates credentials and returns JWT bearer token.
- [x] **JWT Validation Filter**: `JwtAuthenticationFilter` protecting all routes except `/api/auth/**`.
- [x] **Role Protection**: Method-level & Service-level security checks using Spring Security.

### 2. Project Management Module
- [x] **Project Entity**: `id`, `project_name`, `description`, `repository_url`, `owner_id` (FK to User), `status` (`Active`/`Archived`), `created_at`.
- [x] **CRUD REST Endpoints**:
  - `GET /api/projects` - List current user's accessible projects.
  - `GET /api/projects/{id}` - Retrieve project by ID.
  - `POST /api/projects` - Create project.
  - `PUT /api/projects/{id}` - Update project details.
  - `DELETE /api/projects/{id}` - Delete project.
- [x] **Ownership Authorization**: Only the owner or an Administrator can update or delete a project (non-owner/non-admin receives HTTP 403 Forbidden).

### 3. Basic Deployment Center
- [x] **Deployment Entity**: `id`, `project_id` (FK), `deployed_by` (FK), `version`, `environment` (`Dev`/`Staging`/`Production`), `status` (`Draft`/`Building`/`Deploying`/`Running`/`Failed`/`RolledBack`), `deployed_at`.
- [x] `POST /api/projects/{projectId}/deployments` - Creates a deployment record with status `Draft`, then simulates status progression (`Draft` → `Building` → `Deploying` → `Running`) via background task.
- [x] `GET /api/projects/{projectId}/deployments` - Retrieves deployment history for a project.

### 4. Frontend Application (React 18 + TypeScript + Tailwind CSS)
- [x] **Dark Design System**: Background `#060B18`, card `#0F1B2E`, borders `#1E2D45`, primary cyan `#38BDF8`, text `#F8FAFC` / muted `#94A3B8`, `rounded-lg` inputs/buttons, `rounded-xl` cards, Inter font, flat design.
- [x] `/login` and `/signup` pages with role selector.
- [x] `/dashboard` with sidebar featuring active items (Dashboard, Projects, Deployments) and disabled "Coming Soon" nav items (Docker, Kubernetes, Monitoring, Logs, Notifications, AI Assistant, Settings).
- [x] `/projects` page with card grid, "New Project" modal, project detail view, deployment history table, and "Trigger Deployment" modal.

### 5. Infrastructure & Testing
- [x] `docker-compose.yml` for local PostgreSQL database.
- [x] Root `README.md` with complete setup and execution instructions.
- [x] 9 Unit Tests passing (`AuthServiceTest`, `ProjectServiceTest`).
- [x] Full automated Playwright browser verification suite passed cleanly with screenshot artifacts captured.

---

## Out of Scope for Milestone 1 (Planned for Future Milestones)
- Docker & Container orchestration integration
- Kubernetes cluster management
- Prometheus / Grafana monitoring dashboards
- Centralized log viewing (Elasticsearch / Loki)
- CI/CD & Jenkins integration
- AI Operational Assistant & Incident Analysis
