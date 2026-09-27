# Credential Security Architecture

## Overview
In OpsPilot, security for external integrations is paramount. The system is designed to **never** expose credentials in logs, API responses, or frontend components. Instead of storing raw secrets directly, the system uses a secure abstraction pattern that delegates credential management to a dedicated secret store (e.g., AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets).

## Architecture Components

### 1. `CredentialReference`
The `CredentialReference` is a domain object stored within the `Integration` entity instead of a raw secret. It consists of:
- **`referenceId`**: The external identifier of the secret (e.g., the Vault path or environment variable name).
- **`storeType`**: The type of credential provider (e.g., `LOCAL_ENV`, `VAULT`, `AWS_SECRETS_MANAGER`).

### 2. `CredentialProvider`
The `CredentialProvider` interface defines how the system interacts with the secret store:
- `supports(String storeType)`: Checks if the provider can resolve the store type.
- `getCredential(CredentialReference reference)`: Fetches the raw secret dynamically.
- `storeCredential(CredentialReference reference, String credential)`: Updates or provisions a secret.
- `deleteCredential(CredentialReference reference)`: Removes the secret securely.

### 3. Current Implementation: `LocalDevelopmentCredentialProvider`
For local development, we use `LocalDevelopmentCredentialProvider`. It supports:
- **`LOCAL_ENV`**: Resolves secrets strictly from system environment variables (read-only).
- **`LOCAL_MEM`**: A secure in-memory `ConcurrentHashMap` intended for ephemeral development and testing (read/write/delete).

*Note: In production environments, this provider will be swapped out for enterprise-grade secret management providers like HashiCorp Vault or AWS Secrets Manager.*

## Redaction and Logging
OpsPilot aggressively protects against secret leakage via logs. 
- The `CredentialMasker` utility uses Regex to scan strings for common secret patterns (e.g., `password=...`, `token=...`, `access_key:...`).
- Any identified secrets are replaced with `********`.
- **Policy**: `CredentialMasker.mask(...)` must be used when logging dynamic configuration data or external provider requests/responses.

## Enforced Invariants
1. **Never return credentials from REST APIs**: DTOs like `IntegrationResponse` explicitly exclude any credential fields.
2. **Never log credentials**: Covered by `CredentialMasker`.
3. **Never store secrets in frontend code**: The UI solely delegates to the backend, exchanging only IDs/References.
