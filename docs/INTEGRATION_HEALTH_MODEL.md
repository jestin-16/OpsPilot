# Integration Health Model

This document describes the architectural approach to calculating the overall system health in OpsPilot. The core philosophy is to distinguish between **Critical Core Services** and **Optional Integrations**, ensuring that a failure in a secondary integration (e.g., Kubernetes, Prometheus) does not artificially induce a system-wide critical alert.

## Integration States

Integrations and services report their status using the following enumerated states:

- **CONNECTED**: The integration is enabled and reachable. It is actively responding to health checks.
- **DISCONNECTED**: The integration is enabled but unreachable (e.g., connection refused, timeout).
- **DISABLED**: The integration is explicitly disabled via configuration. It is ignored during health calculations.
- **DEGRADED**: The integration is partially working (e.g., responding slowly or returning partial data).
- **ERROR**: The integration is enabled but returning an unexpected internal error or exception during health checks.

## Core vs Optional Dependencies

Dependencies are strictly categorized into two tiers:

### 1. Critical Core Services
Services required for OpsPilot to function at all.
- **Examples**: PostgreSQL Database, Authentication Service, API Gateway.
- **Failure Impact**: If any core service is unhealthy, the overall system state becomes **CRITICAL**.

### 2. Optional Integrations
Services that provide additional capabilities but whose absence does not prevent the core platform from functioning.
- **Examples**: Kubernetes, Prometheus, Loki, Docker, GitHub.
- **Failure Impact**: If an optional integration is unhealthy, it transitions to `DISCONNECTED`, `DEGRADED`, or `ERROR`, and the overall system state is marked as **OPERATIONAL_WITH_WARNINGS**.

## Overall Health Calculation

The `IntegrationHealthService` computes a single `overallStatus` string that the frontend utilizes to represent the system visually. The hierarchy of resolution is as follows:

1. **System Critical**: If `isDatabaseHealthy()` or other core checks fail -> `CRITICAL`.
2. **System Operational with Warnings**: If all core services are healthy, but `hasOptionalErrors` evaluates to true (any enabled integration != `CONNECTED`) -> `OPERATIONAL_WITH_WARNINGS`.
3. **System Operational**: If all core services are healthy and all enabled integrations are `CONNECTED` (or disabled) -> `OPERATIONAL`.

*(A fourth status, `DEGRADED`, is reserved for scenarios where core services are under heavy load but not fully offline).*

## Configuration Behavior

Optional integrations default to either true or false via `application.yml` properties:

```yaml
monitoring:
  kubernetes:
    enabled: ${KUBERNETES_ENABLED:true}
  prometheus:
    enabled: ${PROMETHEUS_ENABLED:true}
  loki:
    enabled: ${LOKI_ENABLED:false}
```

If a user does not intend to use an integration (e.g., they aren't monitoring a local Kubernetes cluster), they should set the respective environment variable to `false`. This sets the status to `DISABLED` and suppresses the warning in the dashboard.

## Failure Handling

When a dependency fails:
- The system captures the specific underlying cause (e.g., "Connection refused") and exposes it in the `message` property of the `IntegrationStatus` object.
- The UI exposes this explicitly without logging raw credentials or sensitive endpoints to the end-user.

## How a New Provider Should Integrate With This Health Model

To add a new provider (e.g., "Datadog" or "AWS CloudWatch"):

1. Add a feature flag in `application.yml` (e.g., `monitoring.datadog.enabled`).
2. Implement a specialized service (e.g., `DatadogMonitoringService`) that exposes an `isAvailable()` method wrapping the client ping.
3. Inject the flag and service into `IntegrationHealthService`.
4. In `getHealth()`, evaluate the status and message logically as shown above.
5. Append the resulting `IntegrationStatus` to the `integrations` list in the `IntegrationHealthResponse`. The overall status will automatically account for it if it returns anything other than `CONNECTED`.
