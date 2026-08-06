# UPGRADE PLAN — OpsPilot Phase 1 Enterprise Hardening

**Date**: August 6, 2026  
**Target Module**: Phase 1 — Authentication & RBAC, Project Management Hardening  
**Hierarchy**: Security Gaps → Data-Layer Integrity → API Consistency → Testing Gaps → Frontend Polish

---

## 🚀 Prioritized Item Breakdown

### SECTION 1: SECURITY GAPS (Highest Risk)

#### Item 1.1: Password Strength & Bean Validation Rules
- **Category**: Security
- **Description**: Upgrade BCrypt encoder strength factor to 12. Add Bean Validation rules to `RegisterRequest` (`@Size(min=8)`, `@Pattern` requiring uppercase, lowercase, and digit).
- **Change Type**: Modifying existing code (`SecurityConfig.java`, `RegisterRequest.java`).
- **Breaking API Flag**: No (Additive server-side validation).

#### Item 1.2: Refresh Tokens & httpOnly Cookie Auth
- **Category**: Security
- **Description**: Implement dual-token architecture: short-lived JWT access token (~15 min) + separate refresh token (~7 days) stored in secure `httpOnly` cookie.
- **Change Type**: Additive + Modifying existing code (`JwtTokenProvider.java`, `AuthResponse.java`, `User.java` or `RefreshToken` entity).
- **Breaking API Flag**: No (Backwards-compatible access token handling).

#### Item 1.3: `POST /api/v1/auth/refresh` Endpoint
- **Category**: Security
- **Description**: Add dedicated endpoint to validate the refresh token from httpOnly cookie, rotate tokens, and return a fresh access token.
- **Change Type**: Additive (`AuthController.java`, `AuthService.java`).
- **Breaking API Flag**: No.

#### Item 1.4: Rate Limiting on Login & Register
- **Category**: Security
- **Description**: Add Bucket4j / in-memory rate limiting filter to `POST /api/v1/auth/login` and `POST /api/v1/auth/register` (max 5 requests per 15 min per IP).
- **Change Type**: Additive (`RateLimitingFilter.java` registered in `SecurityConfig.java`).
- **Breaking API Flag**: No.

#### Item 1.5: CORS Origin Configuration
- **Category**: Security
- **Description**: Replace wildcard `*` CORS origin pattern in `SecurityConfig.java` with explicit frontend origin (e.g. `http://localhost:5173`).
- **Change Type**: Modifying existing code (`SecurityConfig.java`).
- **Breaking API Flag**: No.

#### Item 1.6: Security Non-Leakage Test Assertion
- **Category**: Security
- **Description**: Create explicit unit/integration test confirming `password_hash` is never present in any JSON payload returned by Auth or User endpoints.
- **Change Type**: Additive (`SecurityPayloadTest.java`).
- **Breaking API Flag**: No.

---

### SECTION 2: DATA-LAYER INTEGRITY & AUTHORIZATION

#### Item 2.1: Flyway Schema Migrations (Replace `hibernate.ddl-auto`)
- **Category**: Data Layer
- **Description**: Add `flyway-core` & `flyway-database-postgresql` dependencies. Generate `V1__init_schema.sql` matching baseline database schema and disable `hibernate.ddl-auto` (`ddl-auto: validate`).
- **Change Type**: Additive + Modifying existing config (`pom.xml`, `application.yml`, `V1__init_schema.sql`).
- **Breaking API Flag**: No.

#### Item 2.2: Database Indexes
- **Category**: Data Layer
- **Description**: Add explicit indexes `idx_users_email`, `idx_projects_owner_id`, `idx_projects_status` in Flyway migration script `V2__add_indexes.sql` and JPA `@Index` annotations.
- **Change Type**: Additive (`V2__add_indexes.sql`, entity classes).
- **Breaking API Flag**: No.

#### Item 2.3: Decoupled Spring Event Listener for Audit Logs
- **Category**: Data Layer
- **Description**: Refactor `AuditLog` creation from inline service code to decoupled Spring `ApplicationEventPublisher` and `@EventListener` (`AuditEventPublisher`, `AuditEventListener`).
- **Change Type**: Additive + Modifying existing code (`AuthService.java`, `ProjectService.java`).
- **Breaking API Flag**: No.

#### Item 2.4: Fix Strict Non-Admin Project Scoping Leak
- **Category**: Data Layer / Authorization
- **Description**: Remove `projects = projectRepository.findAll()` fallback in `ProjectService.java` for non-admin users with 0 projects to strictly enforce scoping.
- **Change Type**: Modifying existing code (`ProjectService.java`).
- **Breaking API Flag**: No.

---

### SECTION 3: API CONSISTENCY & DESIGN

#### Item 3.1: API Endpoint Versioning (`/api/v1/`)
- **Category**: API Design
- **Description**: Prefix all controllers (`/api/v1/auth`, `/api/v1/projects`, etc.) and update `SecurityConfig` permits and frontend `api.ts` routes.
- **Change Type**: Modifying existing code (`AuthController.java`, `ProjectController.java`, `SecurityConfig.java`, frontend `api.ts`).
- **Breaking API Flag**: ⚠️ **Yes — Path Modification** (Requires simultaneous frontend route update in `api.ts`).

#### Item 3.2: Pagination & Sorting Envelopes for List Endpoints
- **Category**: API Design
- **Description**: Update `GET /api/v1/projects` to accept `Pageable` (`page`, `size`, `sort`) and return `PagedResponse<ProjectResponse>` envelope.
- **Change Type**: Modifying existing code (`ProjectController.java`, `ProjectService.java`, frontend `api.ts`).
- **Breaking API Flag**: ⚠️ **Yes — Response Shape Change** (Requires simultaneous frontend update in `api.ts` and `Projects.tsx`).

#### Item 3.3: OpenAPI / Swagger Documentation
- **Category**: API Design
- **Description**: Add `springdoc-openapi-starter-webmvc-ui` dependency and annotate controllers with `@Operation`, `@ApiResponse`, `@Tag`.
- **Change Type**: Additive (`pom.xml`, `OpenApiConfig.java`, controller annotations).
- **Breaking API Flag**: No.

---

### SECTION 4: TESTING GAPS

#### Item 4.1: Testcontainers with Real PostgreSQL
- **Category**: Testing
- **Description**: Add `org.testcontainers:postgresql` and `org.testcontainers:junit-jupiter` dependencies to `pom.xml`. Write `AbstractIntegrationTest` running real PostgreSQL container.
- **Change Type**: Additive (`pom.xml`, test classes).
- **Breaking API Flag**: No.

#### Item 4.2: Unit Test Expansion & Security Assertion Tests
- **Category**: Testing
- **Description**: Add comprehensive unit tests covering token refresh, rate limiting triggers, 403 forbidden assertions, and audit event dispatching.
- **Change Type**: Additive (`AuthServiceTest.java`, `ProjectServiceTest.java`, `SecurityIntegrationTest.java`).
- **Breaking API Flag**: No.

---

### SECTION 5: FRONTEND POLISH

#### Item 5.1: Axios Interceptor with Auto-Refresh & Token Attachment
- **Category**: Frontend
- **Description**: Install `axios`, replace native `fetch` wrappers in `api.ts` with configured Axios instance featuring request token injection and 401 response auto-refresh interceptor.
- **Change Type**: Modifying existing code (`api.ts`).
- **Breaking API Flag**: No.

#### Item 5.2: Zod Client Validation Matching Backend Rules
- **Category**: Frontend
- **Description**: Install `zod`, create client-side Zod validation schemas matching backend Bean Validation rules (`RegisterSchema`, `ProjectSchema`), and integrate into forms.
- **Change Type**: Additive + Modifying existing code (`Signup.tsx`, `Projects.tsx`).
- **Breaking API Flag**: No.

#### Item 5.3: TanStack Query (React Query) Server State Integration
- **Category**: Frontend
- **Description**: Install `@tanstack/react-query`, wrap `App.tsx` with `QueryClientProvider`, and migrate `Projects.tsx` and `Dashboard.tsx` state management to `useQuery` / `useMutation`.
- **Change Type**: Modifying existing code (`App.tsx`, `Projects.tsx`, `Dashboard.tsx`).
- **Breaking API Flag**: No.

---

## 🛠️ Step 2 Execution Workflow Strategy

Per **STEP 2** rules, every single item above will be executed **one at a time**:
1. Make the specific change.
2. Re-run backend unit tests (`./mvnw test`) and frontend build (`npm run build`).
3. Verify zero regressions.
4. Commit to Git with a message referencing the exact item (e.g. `security: upgrade BCrypt strength to 12 and add password validation`).
5. Proceed to the next item in sequence.
