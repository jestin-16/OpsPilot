# Vercel Provider Integration

OpsPilot provides a native Vercel Integration Adapter to fetch projects, deployments, build logs, and project events from your Vercel organization.

## Supported Resources
The current integration focuses on the following Vercel resources:
- **Projects**
- **Deployments**
- **Logs**
- **Events**

## Capabilities
- `RESOURCE_DISCOVERY`: Discovers your Vercel Projects and Deployments and maps them to normalized OpsPilot Resources.
- `LOGS`: Fetches build deployment logs.
- `EVENTS`: Prepares Vercel project events mapping to the normalized event engine.
- `HEALTH`: Tests authentication and validates connection health using the Vercel user endpoint.

## Configuration
When creating a Vercel integration in OpsPilot, the following fields are configured:

### Configuration JSON
```json
{
  "teamId": "<YOUR_TEAM_ID_OPTIONAL>"
}
```
*Note: If you omit `teamId`, the token will be scoped to your personal Vercel account.*

### Secrets
```json
{
  "token": "<YOUR_VERCEL_ACCESS_TOKEN>"
}
```

## Security & Scoping
OpsPilot uses REST calls authenticated directly via `Authorization: Bearer <token>`.
Ensure the token provided is narrowly scoped to the specific Teams or Projects you wish to monitor inside OpsPilot. Token credentials are never logged or exposed to users.
