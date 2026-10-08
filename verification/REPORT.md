# Security and Verification Report - Docker Push Monitoring

## 1. Summary Table

| ID   | Check                                             | Status    | Evidence / Snippet                                                               |
|------|---------------------------------------------------|-----------|----------------------------------------------------------------------------------|
| S0   | HANDOFF CROSS-CHECK                               | FAIL      | `HANDOFF.md` does not exist.                                                     |
| S1   | No `docker.sock` / `docker-java` in OpsPilot      | FAIL      | `docker-compose.yml` mounts `docker.sock` in `core-service`; `DockerService.java` uses `docker-java`. |
| S2   | Tokens handled securely                           | PASS      | `IngestTokenService.java` uses SHA-256 and constant-time comparison. Tokens not returned in GET APIs. |
| S3   | Flyway V14 / V15                                  | PASS      | V14 exists. `project_id` BIGINT matches `projects.id` BIGSERIAL. V15 not needed yet. |
| S4   | Log label enforcement                             | PASS      | `LogLabelEnforcer.java` overwrites labels and correctly truncates/validates inputs. |
| S5   | Metrics label rewrite                             | FAIL      | `PrometheusPushRewriter.java` appends labels but does not sort them lexicographically, which Prometheus will reject (`out of order label names`). |
| S6   | Query building (LogQL/PromQL)                     | FAIL      | `LogQlBuilder.java` is safe, but NO PromQL builder was found. Metrics UI and alerting are not implemented. |
| S7   | SecurityConfig limits / public endpoints          | FAIL      | `/api/v1/ingest/**` is marked `permitAll()` in `SecurityConfig.java`. The `IngestTokenFilter` falls through for missing tokens. Metrics push is exposed publicly at gateway level. |
| S8   | Docker Compose Loki/Prometheus isolation          | PASS      | `docker-compose.yml` does not publish ports for `prometheus` or `loki`. Remote write enabled. |
| S9   | Ingest limits                                     | FAIL      | Size, series, and time limits exist, but **per-source rate limit** is completely missing. |
| S10  | Alert evaluator rules                             | BLOCKED   | Alert Evaluator is not implemented for the push-model (Phase 5 missing). |
| S11  | Agent config endpoints                            | PASS      | `DockerAgentConfigService.java` behaves correctly (token only returned on create/rotate). |
| S12  | Tenant checks                                     | PASS      | `LogQueryService.java` correctly asserts project access by ID before fetching logs. |
| S13  | No mock/fake data                                 | FAIL      | `DockerView.tsx` has hardcoded mock data for terminal logs (`[Log streaming for individual containers requires the container logs API endpoint — coming in a future session.]`). |

## 2. Findings Ranked

### Critical (Security / Feature Broken)
1. **Public Metrics Endpoint (S7)**: `SecurityConfig.java` has `.requestMatchers("/api/ingest/**", "/api/v1/ingest/**").permitAll()`, meaning `/api/v1/ingest/metrics/push` is exposed if no token is sent. The controller returns 401, but the gateway doesn't block it.
2. **Prometheus Payload Rejected (S5)**: `PrometheusPushRewriter.java` appends injected labels to the end of the label list without sorting them alphabetically. Prometheus requires `TimeSeries.labels` to be strictly sorted, so it will reject all rewritten payloads with an HTTP 400 (`out of order label names`).
3. **No Per-Source Rate Limits (S9)**: `LokiPushController` and `PrometheusPushController` implement size and series limits but lack rate limiting. This allows a single compromised token to overwhelm the ingest pipeline.
4. **OpsPilot Mounts `docker.sock` (S1)**: `core-service` mounts `/var/run/docker.sock` and uses `docker-java` in `DockerService.java`, violating the strict security rule that OpsPilot must never read the socket.

### High (Feature Missing / BLOCKED)
5. **Missing Alert Evaluator & PromQL Builder (S10, S6)**: The alert evaluation engine for LOG/METRIC rules (Phase 5) is completely missing.
6. **Hardcoded Mock Logs (S13)**: The frontend `DockerView.tsx` uses mock text for terminal logs instead of implementing a real backend fetch.

### Medium / Low
7. **Missing HANDOFF.md (S0)**: The `HANDOFF.md` file does not exist, violating documentation requirements.

## 3. Contradicted Claims
- `PROGRESS.md` claims "Implemented Docker Push Monitoring Phase 3". While partially true, the implementation fails critical constraints (Prometheus labels unsorted, rate limits absent, public endpoint flaw, mock data left in UI).
- `PROGRESS.md` and commit messages do not mention that the metrics label rewrite is fundamentally incompatible with Prometheus due to ordering.

## 4. Coverage Gaps
- **Label Sorting Test**: `PrometheusPushRewriterTest` checks if the label value is replaced but does not verify lexicographical sorting of the resulting label list. This is a false positive test.

## 5. Final Verdict
**DO NOT SHIP**

### Minimum Fix List:
1. Fix `SecurityConfig.java` to require `IngestTokenFilter.AUTHORITY` for `/api/v1/ingest/metrics/**`.
2. Fix `PrometheusPushRewriter.java` to sort the label list lexicographically by label name before serializing.
3. Remove `/var/run/docker.sock` from `docker-compose.yml` and remove `docker-java` usage in `DockerService.java`.
4. Implement a per-source rate limit using a bucket strategy or Spring RateLimiter in the push controllers.
5. Implement real container logs fetching in `DockerView.tsx` (remove mock).
6. Implement the Alert Evaluator (Phase 5) for LOG/METRIC rules.
