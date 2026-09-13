# OpsPilot Milestone 1 Progress Report (30% Scope Complete - Light Theme)

**Status**: Milestone 1 Complete (Updated with Light Theme)  
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
- [x] **Light Design System**: Main background `#F8FAFC`, card background `#FFFFFF`, borders `#E2E8F0`, primary accent `#0284C7` (Sky Blue), main text `#0F172A`, muted text `#64748B`, `rounded-lg` inputs/buttons, `rounded-xl` cards, Inter font, flat modern layout.
- [x] `/login` and `/signup` pages with role selector.
- [x] `/dashboard` with sidebar featuring active items (Dashboard, Projects, Deployments) and disabled "Coming Soon" nav items (Docker, Kubernetes, Monitoring, Logs, Notifications, AI Assistant, Settings).
- [x] `/projects` page with card grid, "New Project" modal, project detail view, deployment history table, and "Trigger Deployment" modal.

### 5. Infrastructure & Testing
- [x] `docker-compose.yml` for local PostgreSQL database.
- [x] Root `README.md` with complete setup and execution instructions.
- [x] 9 Unit Tests passing (`AuthServiceTest`, `ProjectServiceTest`).
- [x] Automated Playwright browser verification suite passed cleanly in Light Theme with screenshot artifacts captured.

## Developer Role Verification Session - 2026-09-13

- Completed the required pre-change audit in `DEVELOPER_ROLE_AUDIT.md`.
- Actual local execution was blocked because no OpsPilot service was listening on port 8080 and Docker Desktop's Linux engine was unavailable.
- Confirmed and fixed runtime authorization: project output, run, stop, status, stream, and proxy now require the authenticated owner or Administrator; the public security exemptions were removed.
- Confirmed and fixed profile ownership surface: Developers can read/update only their own name and email through `/api/v1/users/me`; role mutation remains unavailable to them.
- Confirmed and fixed Developer navigation: Dashboard, Projects, Add Project, Docker, Logs, and My Profile are directly reachable. Roadmap simulation entries were not removed or modified.
- Confirmed and fixed Docker lifecycle integration: user-scoped records now synchronize with the Docker daemon and lifecycle actions call Docker Java start/stop/restart commands. Final daemon execution remains blocked until Docker Desktop is running.
- Added `verify-developer-role.sh`, which exercises the eight real workflows plus cross-user project, runtime, log, and container checks and compares container state against `docker ps`.
- Verification script actual output: `PASS=0 FAIL=0 BLOCKED=9`, because `http://localhost:8080/api/v1` was unavailable.
- Scope boundary respected: Deployment Center status simulation, Kubernetes Management, CI/CD pipeline execution, and AI Assistant were not changed or exercised.
