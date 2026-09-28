# Oracle Cloud Provider Integration

OpsPilot provides a native Oracle Cloud Infrastructure (OCI) Integration Adapter leveraging the OCI Java SDK to discover compute resources, collect logs, and fetch monitoring metrics across your OCI compartments.

## Supported Services
The current integration focuses on the following core OCI services:
- **Compute** (Instances)
- **Logging** (Search Logs)
- **Monitoring** (Metrics Summarization)
- **Identity** (Connection validation)

## Capabilities
- `RESOURCE_DISCOVERY`: Discovers OCI Compute instances inside your configured compartment.
- `LOGS`: Fetches logs dynamically using OCI Logging Search.
- `METRICS`: Queries OCI Monitoring for metric summaries over defined time ranges.
- `EVENTS`: Framework prepared for Oracle Cloud streaming events integration.
- `HEALTH`: Tests authentication and validates connection health using OCI Identity user endpoints.

## Configuration
When creating an Oracle Cloud integration in OpsPilot, the following fields are required:

### Configuration JSON
```json
{
  "region": "us-ashburn-1",
  "compartmentId": "ocid1.compartment.oc1..xxxx"
}
```

### Secrets (Credential Reference)
```json
{
  "tenantId": "ocid1.tenancy.oc1..xxxx",
  "userId": "ocid1.user.oc1..xxxx",
  "fingerprint": "20:3b:97:13:55:1c:5b:0d:d3:37:d8:50:4e:c5:3a:34",
  "privateKey": "-----BEGIN RSA PRIVATE KEY-----\nMIICXQIBAAKBgQCqGKukO1De...\n-----END RSA PRIVATE KEY-----"
}
```

## Security & Scoping
OpsPilot authenticates via `SimpleAuthenticationDetailsProvider` securely injecting the private key directly from the encrypted credential vault. No private keys are stored on disk or exposed to logs.

Ensure that the OCI user bound to this API key has an appropriate **IAM Policy** attached, restricting permissions to strictly `read` access for Compute, Logging, and Monitoring inside the specified `compartmentId`.
