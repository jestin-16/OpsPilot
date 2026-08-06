# GAP ANALYSIS — OpsPilot Phase 1 Enterprise Hardening

**Date**: August 6, 2026  
**Target Module**: Phase 1 — Authentication & RBAC, Project Management  
**Baseline Test Results**: 
- **Backend (`./mvnw test`)**: 9/9 Tests Passing (`BUILD SUCCESS`)
- **Frontend (`npm run build`)**: 0 TypeScript Compilation Errors (`built in 886ms`)

---

## 📋 Enterprise Standards Audit & Gap Matrix

| Category | Enterprise Requirement | Status | Current Implementation Notes & Gaps |
|---|---|---|---|
| **Security** | BCrypt strength 12+, min 8 chars, upper/lower/digit Bean Validation | ⚠️ **Needs Upgrade** | BCrypt defaults to strength 10. `RegisterRequest` lacks `@Pattern` / `@Size(min=8)` validation for password complexity. |
| **Security** | Short-lived access token (~15 min) + separate refresh token (~7 days) httpOnly cookie | ❌ **Missing Entirely** | Currently single 24-hour JWT stored in `localStorage`. No refresh token or httpOnly cookie mechanism. |
| **Security** | `POST /auth/refresh` endpoint for token rotation | ❌ **Missing Entirely** | No refresh endpoint exists in `AuthController`. |
| **Security** | Rate limiting on login/register (max 5 attempts / 15 min / IP) | ❌ **Missing Entirely** | No rate-limiting filter or bucket algorithm configured. |
| **Security** | CORS configured for specific frontend origin (no wildcard `*`) | ⚠️ **Needs Upgrade** | `SecurityConfig` allows `*` wildcard origin patterns (`setAllowedOriginPatterns(List.of("*"))`). |
| **Security** | `password_hash` never present in API response + explicit automated test | ⚠️ **Needs Upgrade** | DTOs hide password hash, but no explicit automated unit/integration test verifies json response exclusion. |
| **Security** | All endpoints except register/login/refresh require valid JWT | ✅ **Already Meets** | `SecurityConfig` restricts non-public endpoints to authenticated JWT holders. |
| **API Design** | All endpoints versioned under `/api/v1/` | ❌ **Missing Entirely** | Endpoints are currently mapped under `/api/auth` and `/api/projects` without `/v1/`. |
| **API Design** | No JPA entities exposed in request/response bodies (dedicated DTOs) | ✅ **Already Meets** | Controllers strictly accept and return dedicated DTOs (`AuthResponse`, `ProjectResponse`, etc.). |
| **API Design** | Single global `@ControllerAdvice` with consistent error response envelope | ✅ **Already Meets** | `GlobalExceptionHandler` handles exceptions with consistent timestamp, status, error, and fieldErrors format. |
| **API Design** | List endpoints support pagination + sorting with standard envelope | ❌ **Missing Entirely** | `GET /api/projects` returns flat `List<ProjectResponse>` without `Pageable` parameters or paginated wrapper. |
| **API Design** | OpenAPI/Swagger documentation present and accurate | ❌ **Missing Entirely** | `springdoc-openapi-starter-webmvc-ui` dependency and OpenAPI annotations are missing. |
| **Data Layer** | Schema version-controlled via Flyway migrations (no `ddl-auto`) | ❌ **Missing Entirely** | Uses `hibernate.ddl-auto: update`. Flyway dependency and migration SQL files (`V1__init_schema.sql`) are missing. |
| **Data Layer** | Database indexes on `users(email)`, `projects(owner_id)`, `projects(status)` | ⚠️ **Needs Upgrade** | `users(email)` has unique index, but composite/foreign key indexes on `projects(owner_id)` and `status` are missing. |
| **Data Layer** | Decoupled Spring Event Listener for Audit Logs (no inline business writes) | ⚠️ **Needs Upgrade** | `AuditLog` entity exists, but audit events are written manually/inline instead of using `@EventListener`. |
| **Authorization** | Centralized ownership & role rules | ✅ **Already Meets** | `ProjectService` centralizes `verifyOwnerOrAdmin` checks. |
| **Authorization** | Strict project scoping for `DEVELOPER`/`DEVOPS_ENGINEER` | ⚠️ **Needs Upgrade** | `ProjectService` contains a fallback `projects = projectRepository.findAll()` for non-admins with 0 projects, leaking projects. |
| **Testing** | Unit tests for every service method (happy + failure paths) | ⚠️ **Needs Upgrade** | 9 unit tests pass, but new security features (refresh tokens, rate limiting, audit events) require tests. |
| **Testing** | Integration tests with Testcontainers & real PostgreSQL | ❌ **Missing Entirely** | Tests rely on H2 in-memory database (`application-h2.yml`) instead of Testcontainers PostgreSQL. |
| **Testing** | Explicit tests for rate limiting, 403 forbidden access, `password_hash` leak prevention | ❌ **Missing Entirely** | No automated tests exist for rate limiting, security 403 access control, or payload safety. |
| **Frontend** | Server state managed via TanStack Query (React Query) | ❌ **Missing Entirely** | Hand-rolled `useEffect` + `useState` fetch calls in frontend pages. |
| **Frontend** | Explicit loading/error/empty UI states across all async views | ✅ **Already Meets** | All pages render explicit loading indicators, error banners, and empty state cards. |
| **Frontend** | Axios interceptor with auto-token attachment and 401 auto-refresh | ❌ **Missing Entirely** | Frontend uses native `fetch` wrappers without Axios interceptor or token refresh loop. |
| **Frontend** | Client-side validation (Zod) mirroring backend validation rules | ❌ **Missing Entirely** | Forms use standard HTML5 validation without Zod schemas. |

---

## 📊 Gap Summary Statistics

- ✅ **Already Meets Standard**: 5 items (20.8%)
- ⚠️ **Partially Meets / Needs Upgrade**: 7 items (29.2%)
- ❌ **Missing Entirely**: 12 items (50.0%)

---

## 🛑 MANDATORY CHECKPOINT

Per **STEP 0** instructions, execution is **PAUSED** awaiting user review and approval of `GAP_ANALYSIS.md`. 
Upon your approval, I will generate `UPGRADE_PLAN.md` prioritizing risk-ordered incremental changes.
