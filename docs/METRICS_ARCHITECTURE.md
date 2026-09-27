# Normalized Metrics Architecture

## Purpose
The purpose of the Normalized Metrics Architecture is to provide a single, unified abstraction over metrics collected from various distinct infrastructure and deployment providers (Docker, Kubernetes, AWS, Vercel, Oracle, etc.). 

Since each provider defines its own terminology, collection mechanisms, and semantics for metrics (e.g., "Pod Restarts" in Kubernetes vs "Container Restarts" in Docker, "CPU Utilization" in AWS vs "CPU Usage" in local container runtimes), OpsPilot introduces a unified `MetricRecord` format. This allows the system to monitor resources irrespective of their actual provider.

## Design

### 1. Unified `MetricRecord` Model
All provider-specific metrics are converted into a standardized model containing the following fields:
- `timestamp`: The moment the metric was collected.
- `projectId`: References the project.
- `integrationId`: References the integration connection.
- `provider`: The type of provider (e.g., `DOCKER`, `KUBERNETES`, `AWS`).
- `resourceId`: The identifier of the monitored resource (e.g., container ID, pod name).
- `metricName`: Standardized metric names (e.g., `CPU`, `Memory`, `Network`, `RequestCount`).
- `value`: The actual numeric metric value.
- `unit`: Standard units of measurement (e.g., `%`, `bytes`, `ms`, `count`).
- `dimensions`: Additional contextual metadata (e.g., region, namespace, tags) stored as a key-value mapping.

### 2. The `MetricCollector` Interface
A core interface exposes metric collection for all adapters that support metrics capabilities:
```java
public interface MetricCollector {
    List<MetricRecord> collectMetrics(Integration integration, Map<String, Object> queryParams);
}
```
Any `IntegrationAdapter` can optionally implement `MetricCollector`.

### 3. Capability-Driven Routing
Before attempting to collect metrics from a given provider, the platform checks its capabilities. 
Only providers declaring `IntegrationCapability.METRICS` can serve metric queries.

### 4. Integration with Existing `MonitoringService`
The existing `MonitoringService` and `KubernetesMonitoringService` handle legacy monitoring mechanisms and dashboard summaries. The new API endpoints (e.g., `/api/v1/projects/{projectId}/metrics`) are integrated directly through the `IntegrationController` and `IntegrationProviderRegistry` in `core-service`, seamlessly interoperating with the existing stack without forcibly rewriting prior robust implementations. 

## Best Practices
- **Never expose secrets**: Metric values or dimensions must never contain sensitive credentials.
- **Fail Gracefully**: If a provider metric is unavailable (e.g., metrics-server not deployed in a cluster), the adapter should return an empty list or cached data, rather than failing the entire request.
