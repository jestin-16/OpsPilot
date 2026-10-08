# OpsPilot - Handoff Document

## Current Branch
`feature/docker-monitoring`

## Project Status
We have successfully implemented the Docker Push Monitoring architecture for OpsPilot. The previous architecture, which relied on mounting `docker.sock` and actively querying the daemon via `docker-java`, has been fully replaced with a more secure **push-based model**.

## Completed QA Fixes (2026-10-08)
During the independent QA pass, several defects were discovered and subsequently fixed:
1. **Metrics Ingest Security (S7):** The Prometheus and Loki ingest paths (`/api/v1/ingest/**`) are now properly secured at the Spring Security config level, requiring the `IngestTokenFilter.AUTHORITY`.
2. **Prometheus Label Rewrite (S5):** Labels injected into Prometheus payload streams are now lexicographically sorted, preventing Prometheus from dropping payloads due to "out of order label names".
3. **Ingest Rate Limiting (S9):** `bucket4j` was integrated into the shared library to provide robust, per-source rate limiting for metrics and log ingestion, protecting the backend from abusive agents.
4. **Alert Engine (S10):** The `LogMetricAlertEvaluator` scheduler was implemented to dynamically query Prometheus and Loki to evaluate Log and Metric rules (e.g., `HIGH_CPU`, `HIGH_MEMORY`, `REPEATED_ERROR_LOGS`) and trigger `AlertEvaluator`.
5. **Legacy Docker Code (S1):** `/var/run/docker.sock` has been entirely removed from the OpsPilot backend (`docker-compose.yml`), and all `docker-java` usages in `core-service` have been ripped out to strictly enforce the push-model isolation.

## Outstanding Known Issues (To be picked up next)
- **Hardcoded Mock Logs (S13):** The frontend UI (`DockerView.tsx`) currently renders hardcoded text for container logs ("Log streaming for individual containers requires the container logs API endpoint — coming in a future session"). This needs to be replaced with a live fetch against the Loki backend via `LogQueryService`.

## How to Test
1. Build the backend modules via `./mvnw.cmd clean package -DskipTests`
2. Start the stack with `docker-compose up -d --build`
3. Use the frontend to configure a new Docker Log Source.
4. Use the generated Grafana Alloy snippet on a host to push logs/metrics into OpsPilot securely.
