# Provider Adapter Architecture

## Overview

The OpsPilot Provider Adapter Architecture is designed to easily onboard new external service providers (e.g., AWS, Vercel, Oracle Cloud) without polluting the core business logic. It establishes a strong boundary using the **Integration Domain**.

## Architecture Components

### 1. Integration Domain Model
An `Integration` represents a configuration connecting an OpsPilot project to a specific external provider. It holds:
- **ProviderType**: Identifier for the provider (e.g., `DOCKER`, `KUBERNETES`, `AWS`).
- **IntegrationCategory**: The type of integration (e.g., `CLOUD`, `CONTAINER`, `DEPLOYMENT`).
- **Configuration & Credentials**: Encrypted credentials and dynamic configurations using the existing JSON-capable database columns and `@Convert` mechanisms.
- **Status**: The live status (`CONNECTED`, `ERROR`, etc.).

### 2. IntegrationCapability
Not all providers offer the same features. The `IntegrationCapability` enum defines atomic functionalities that a provider might offer:
- `RESOURCE_DISCOVERY`
- `LOGS`
- `LIVE_LOGS`
- `METRICS`
- `EVENTS`
- `DEPLOYMENT`
- `ROLLBACK`
- `START`, `STOP`, `RESTART`, `SCALE`

### 3. IntegrationAdapter
The `IntegrationAdapter` is the provider-neutral interface every external provider implementation must adhere to. It provides:
- Identifying the `ProviderType`
- Listing the supported `IntegrationCapability` set
- Standardized methods for:
  - Connection Testing (`testConnection`)
  - Health Checks (`checkHealth`)
  - Resource Discovery (`discoverResources`)
  - Observability (`getLogs`, `getMetrics`, `getEvents`)

### 4. IntegrationProviderRegistry
The `IntegrationProviderRegistry` acts as a dynamic resolver for adapter implementations at runtime.
- It automatically gathers all beans implementing `IntegrationAdapter`.
- Provides lookup mechanisms `Optional<IntegrationAdapter> getAdapter(ProviderType type)`.
- Fails gracefully if an unknown or currently unsupported provider type is requested.

## Workflow

1. A user configures an integration via the `IntegrationController`.
2. The core business logic saves the `Integration` (encrypting credentials).
3. When the system needs to perform an action (e.g., fetch logs):
   - It loads the `Integration` entity.
   - Looks up the adapter via `IntegrationProviderRegistry.getAdapter(integration.getProviderType())`.
   - Verifies the capability using `adapter.supports(IntegrationCapability.LOGS)`.
   - Executes the action via `adapter.getLogs(...)`.

This completely decouples the OpsPilot backend from the specifics of `docker-java`, AWS SDKs, or Kubernetes Clients.
