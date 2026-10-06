# Comprehensive CI/CD Integration & Log Monitoring Plan

This document outlines the architectural plan for integrating external CI/CD providers (GitHub Actions and Jenkins) into OpsPilot. Since OpsPilot acts as an observability and monitoring platform, the goal is **not** to run pipelines locally, but rather to ingest webhooks from these providers, track their status, and asynchronously fetch their execution logs.

## 1. Database Layer Reference
All pipeline runs are stored in the `PipelineRunEntity` table. When integrating external CI/CD, the following fields are primarily utilized:
- `repoUrl` / `project_id`: Identifies which project the pipeline belongs to.
- `status`: Mapped to OpsPilot standard statuses (`IN_PROGRESS`, `SUCCESS`, `FAILED`).
- `eventType`: E.g., `workflow_run` (GitHub) or `jenkins_build`.
- `buildLogs`: A `TEXT` column where the raw, fully fetched console logs will be persisted.

---

## 2. GitHub Actions Integration

### A. Webhook Receiver (`CiCdController`)
- **Endpoint**: `POST /api/v1/cicd/webhooks/github`
- **Trigger**: GitHub sends a webhook with the `X-GitHub-Event: workflow_run` header.
- **Payload Parsing**:
  - Extract `repository.clone_url`, `repository.name`, and `repository.owner.login`.
  - Extract `workflow_run.status` (e.g., `queued`, `in_progress`, `completed`).
  - Extract `workflow_run.conclusion` (e.g., `success`, `failure`).
  - Extract `workflow_run.id` to be used for log fetching.
- **Logic**:
  - Save the run to `PipelineRunEntity` via `trackExternalPipelineRun`.
  - If `status == "completed"`, trigger the asynchronous log fetcher, passing the `workflowRunId`.

### B. Asynchronous Log Fetcher (`CiCdService`)
- **Method**: `fetchAndSaveGitHubLogsAsync(Long runId, String owner, String repo, Long workflowRunId)`
- **API Call**: `GET https://api.github.com/repos/{owner}/{repo}/actions/runs/{workflowRunId}/logs`
- **Authentication**: Inject a `Bearer {GITHUB_TOKEN}` header (sourced from environment variables or a credential manager).
- **Processing**: 
  - The GitHub API returns a **ZIP file**. 
  - Use `java.util.zip.ZipInputStream` wrapped around a `ByteArrayInputStream` of the response body.
  - Iterate through the ZIP entries, ignore directories, and concatenate the text from all log files into a single `StringBuilder`.
  - Update the `PipelineRunEntity` with the extracted string and save.

---

## 3. Jenkins Integration

### A. Webhook Receiver (`CiCdController`)
- **Endpoint**: `POST /api/v1/cicd/webhooks/jenkins`
- **Configuration (Jenkins Side)**: Jenkins should be configured (via the *Notification Plugin* or *Generic Webhook Trigger*) to POST a JSON payload when a job finishes.
- **Expected Payload**:
  ```json
  {
    "build": {
      "full_url": "http://jenkins.example.com/job/my-project/42/",
      "number": 42,
      "phase": "COMPLETED",
      "status": "SUCCESS",
      "scm": {
        "url": "https://github.com/owner/repo.git",
        "branch": "main",
        "commit": "abc123def456"
      }
    }
  }
  ```
- **Logic**:
  - Save the run to `PipelineRunEntity`. Map the Jenkins `phase` and `status` to OpsPilot's `status` field.
  - If `phase == "COMPLETED"`, trigger the asynchronous log fetcher, passing the `full_url`.

### B. Asynchronous Log Fetcher (`CiCdService`)
- **Method**: `fetchAndSaveJenkinsLogsAsync(Long runId, String buildUrl)`
- **API Call**: `GET {buildUrl}/consoleText` (e.g., `http://jenkins.example.com/job/my-project/42/consoleText`).
- **Authentication**: If Jenkins is secured, use HTTP Basic Auth with `JENKINS_USER` and `JENKINS_API_TOKEN`.
- **Processing**:
  - Unlike GitHub, Jenkins returns pure, raw text natively.
  - Simply execute a `RestTemplate.getForEntity` call, extract the body, and save it directly to `PipelineRunEntity.buildLogs`.

---

## 4. Frontend Log Visualization
- **API Integration**: The frontend already utilizes `GET /api/v1/cicd/runs/{runId}/logs`, which returns the `buildLogs` string.
- **Component (`LogManagement.tsx`)**: 
  - Fetch the data on component mount or interval.
  - Render the raw string inside a styled `<pre>` or dark-themed terminal UI box.
  - Ensure horizontal scrolling or line-wrapping is applied for long output lines.
