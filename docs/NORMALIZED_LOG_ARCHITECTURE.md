# Normalized Log Architecture

## Objective
The purpose of the normalized log architecture is to consolidate and normalize log messages produced by heterogeneous providers (e.g., Docker, Kubernetes, AWS, Vercel, Oracle Cloud) into a single, cohesive observability interface.

## Architecture

At the core of the normalized log architecture is the `LogRecord` model and the `LogCollector` abstraction.

### 1. `LogRecord` Model
The `LogRecord` class acts as the normalized representation of a single log statement, decoupling the source system's log structure from OpsPilot's UI and querying systems.

**Normalized Fields:**
- `id`: A unique identifier for the log record (typically a UUID).
- `timestamp`: The exact timestamp when the log event occurred (`LocalDateTime`).
- `projectId`: The ID of the project owning the resource.
- `integrationId`: The ID of the integration that sourced the log.
- `provider`: The `ProviderType` (e.g., `DOCKER`, `KUBERNETES`, `AWS`).
- `resourceId`: The unique provider-side resource identifier (e.g., container ID, pod name).
- `resourceType`: The classification of the resource (e.g., `CONTAINER`, `POD`, `FUNCTION`).
- `service`: An identifier linking the log to a broader service context (e.g., `docker-<id>`, `k8s-<namespace>-<pod>`).
- `level`: Log severity (e.g., `INFO`, `WARN`, `ERROR`).
- `message`: The raw text of the log.
- `traceId`: (Optional) Distributed tracing ID, if provided by the integration.
- `requestId`: (Optional) Request tracing ID, if provided.
- `metadata`: A catch-all JSON field to accommodate provider-specific log extensions or structured tags.

### 2. `LogCollector` Interface
The `LogCollector` abstraction specifies a standardized mechanism to pull logs from adapters that implement logging capabilities.

```java
public interface LogCollector {
    List<LogRecord> collect(Integration integration, Map<String, Object> params);
    List<LogRecord> query(Integration integration, Map<String, Object> queryParams);
    // Future: stream() support can be added for real-time WebSocket pushing.
}
```

Integration adapters (such as `DockerIntegrationAdapter` or `KubernetesIntegrationAdapter`) implement this interface in addition to the base `IntegrationAdapter`.

### 3. Pagination and Filtering
All implementations of `LogCollector` enforce safe pagination utilizing `limit` and `offset` values passed via the `params` map to ensure large-scale logs do not exhaust application memory.

## Security Constraints
- **Zero Secrets Policy**: Adapters fetching external logs must ensure that raw connection keys (e.g., SSH keys, kubeconfigs) used to establish log streams are never embedded in the `LogRecord` payload.
- **Access Control**: Users must verify project membership or appropriate `ADMIN`/`DEVOPS` roles to query provider logs.
- **Obfuscation**: Log masking utilities should intercept `LogRecord.message` assignments if known secret patterns are identified.

## Existing API Compatibility
The existing `LogController` endpoints continue to function without breaking changes. Going forward, new integration streams (AWS, Vercel, Oracle) will hook seamlessly into this architecture, avoiding the bloat of multiple provider-specific log parsers and REST endpoints.
