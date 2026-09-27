# Normalized Resource Model

The Normalized Resource Model is designed to provide a unified, provider-neutral representation of resources across different environments and platforms. By utilizing a common entity structure, OpsPilot can seamlessly integrate resources from Docker, Kubernetes, AWS, Vercel, and Oracle Cloud into a single dashboard.

## Overview

The goal of this architecture is to avoid forcing provider-specific properties into a rigid, fixed-column schema. Instead, the model defines core fields common to any resource (ID, Project, Integration, Status) and stores provider-specific attributes in a flexible JSON `metadata` column.

## Entity Structure

The `Resource` entity contains the following normalized fields:
- `id` (Long): The internal OpsPilot identifier.
- `projectId` (Long): The OpsPilot project this resource belongs to.
- `integrationId` (Long): The specific provider integration mapping.
- `provider` (ProviderType): The provider hosting the resource (e.g., `DOCKER`, `KUBERNETES`, `AWS`, `VERCEL`, `ORACLE_CLOUD`).
- `providerResourceId` (String): The unique identifier of the resource within the provider (e.g., Docker container ID, AWS ARN).
- `resourceType` (String): The type/kind of resource (e.g., `Container`, `Pod`, `Lambda`, `EC2`).
- `name` (String): A human-readable name for the resource.
- `status` (String): The operational state of the resource (e.g., `running`, `stopped`, `failed`).
- `region` (String): (Optional) The geographical region or zone.
- `environment` (String): (Optional) The target environment (e.g., `production`, `staging`).
- `createdAt` / `updatedAt` (LocalDateTime): Timestamps for auditing.
- `metadata` (TEXT): A JSON string containing any provider-specific information (e.g., exposed ports, image names, instance types).

## Workflows

1. **Discovery:**
   - The `ResourceService` invokes the `discoverResources(Integration)` method on the corresponding `IntegrationAdapter`.
   - The adapter interacts with the provider API and returns a `List<Map<String, Object>>`.

2. **Synchronization:**
   - The `ResourceService` parses the Map response and maps the core fields to the `Resource` model.
   - The entire Map is safely serialized into the `metadata` column.
   - This process allows idempotency based on `providerResourceId`.

3. **Retrieval:**
   - The UI fetches unified resources using `GET /api/v1/projects/{projectId}/resources` or `GET /api/v1/integrations/{integrationId}/resources`.
   - Operations remain consistent regardless of the underlying infrastructure.

## Extensibility

This structure ensures that adding a new cloud provider requires zero changes to the underlying database schema. The new adapter simply returns a map with basic keys (`id`, `name`, `type`, `status`) and any supplementary details are inherently supported via the `metadata` payload.
