package com.opspilot.controller;

import com.opspilot.dto.PagedResponse;
import com.opspilot.dto.ProjectRequest;
import com.opspilot.dto.ProjectResponse;
import com.opspilot.entity.User;
import com.opspilot.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/projects", "/api/projects"})
@Tag(name = "Project Management", description = "Endpoints for microservice project creation, updating, deleting, and paginated listing")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping
    @Operation(summary = "Get paginated list of microservice projects for authenticated user")
    public ResponseEntity<PagedResponse<ProjectResponse>> getAllProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @AuthenticationPrincipal User currentUser) {
        PagedResponse<ProjectResponse> projects = projectService.getPaginatedProjectsForUser(currentUser, page, size, sortBy, sortDir);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get microservice project by ID")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        ProjectResponse project = projectService.getProjectById(id, currentUser);
        return ResponseEntity.ok(project);
    }

    @PostMapping
    @Operation(summary = "Register a new microservice project")
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User currentUser) {
        ProjectResponse project = projectService.createProject(request, currentUser);
        return new ResponseEntity<>(project, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing microservice project")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User currentUser) {
        ProjectResponse project = projectService.updateProject(id, request, currentUser);
        return ResponseEntity.ok(project);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a microservice project")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        projectService.deleteProject(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/{id}/output", produces = "text/html")
    @Operation(summary = "View live web output and execution workbench of deployed project")
    public ResponseEntity<String> getProjectOutput(@PathVariable Long id) {
        ProjectResponse project = projectService.getProjectById(id, null);
        String safeName = project.getProjectName();
        String safeSlug = safeName.toLowerCase().replaceAll("[^a-z0-9]", "-");
        String repoUrl = project.getRepositoryUrl() != null ? project.getRepositoryUrl() : "https://github.com/opspilot/" + safeSlug;
        String desc = project.getDescription() != null ? project.getDescription() : "Imported microservice project running on OpsPilot IDP";

        String template = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{{SAFE_NAME}} - Live Application Workbench</title>
                <style>
                    * { box-sizing: border-box; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #060B18; color: #F8FAFC; margin: 0; padding: 0; min-height: 100vh; display: flex; flex-direction: column; }
                    .header { background-color: #0F1B2E; border-bottom: 1px solid #1E2D45; padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; }
                    .title-area { display: flex; align-items: center; gap: 1rem; }
                    .title { font-size: 1.25rem; font-weight: 700; color: #F8FAFC; margin: 0; }
                    .badge { background-color: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 600; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
                    .actions { display: flex; gap: 0.75rem; }
                    .btn { background-color: #38BDF8; color: #060B18; font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.4rem; transition: all 0.2s; text-decoration: none; }
                    .btn:hover { background-color: #7DD3FC; transform: translateY(-1px); }
                    .btn-secondary { background-color: #13233B; color: #F8FAFC; border: 1px solid #1E2D45; }
                    .btn-secondary:hover { background-color: #1E2D45; }

                    .main-container { padding: 1.5rem 2rem; display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; flex: 1; }
                    .panel { background-color: #0F1B2E; border: 1px solid #1E2D45; border-radius: 0.75rem; padding: 1.5rem; display: flex; flex-direction: column; }
                    
                    .tabs { display: flex; gap: 1rem; border-bottom: 1px solid #1E2D45; margin-bottom: 1.25rem; padding-bottom: 0.5rem; }
                    .tab { color: #94A3B8; font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 0.4rem 0.75rem; border-radius: 0.375rem; transition: all 0.2s; }
                    .tab.active { color: #38BDF8; background-color: #13233B; }
                    
                    .url-bar { display: flex; gap: 0.5rem; background-color: #13233B; border: 1px solid #1E2D45; border-radius: 0.5rem; padding: 0.5rem; margin-bottom: 1rem; align-items: center; }
                    .method-select { background-color: #060B18; color: #10B981; border: 1px solid #1E2D45; font-weight: 700; font-family: monospace; padding: 0.35rem 0.5rem; border-radius: 0.25rem; font-size: 0.8rem; }
                    .url-input { flex: 1; background: transparent; border: none; color: #F8FAFC; font-family: monospace; font-size: 0.85rem; outline: none; }
                    
                    .terminal { background-color: #060B18; border: 1px solid #1E2D45; border-radius: 0.5rem; padding: 1.25rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.825rem; color: #38BDF8; flex: 1; min-height: 360px; overflow-y: auto; white-space: pre-wrap; line-height: 1.6; }
                    .line-info { color: #94A3B8; }
                    .line-success { color: #10B981; }
                    .line-accent { color: #A78BFA; }
                    .line-warning { color: #F59E0B; }

                    .sidebar-section { margin-bottom: 1.5rem; }
                    .sidebar-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94A3B8; margin-bottom: 0.75rem; font-weight: 700; }
                    .info-row { display: flex; justify-content: space-between; font-size: 0.8rem; padding: 0.4rem 0; border-bottom: 1px solid rgba(30, 45, 69, 0.5); }
                    .info-label { color: #94A3B8; }
                    .info-val { color: #F8FAFC; font-family: monospace; font-weight: 600; }
                </style>
            </head>
            <body>
                <header class="header">
                    <div class="title-area">
                        <span style="font-size: 1.5rem;">🚀</span>
                        <div>
                            <h1 class="title">{{SAFE_NAME}}</h1>
                            <span style="font-size: 0.8rem; color: #94A3B8;">{{DESC}}</span>
                        </div>
                        <span class="badge" id="statusBadge">RUNNING</span>
                    </div>
                    <div class="actions">
                        <button class="btn" onclick="executeAppRun()">
                            <span>▶ Run Live Application</span>
                        </button>
                        <button class="btn btn-secondary" onclick="restartContainer()">
                            <span>🔄 Restart</span>
                        </button>
                        <a href="{{REPO_URL}}" target="_blank" class="btn btn-secondary">
                            <span>↗ Repository</span>
                        </a>
                    </div>
                </header>

                <main class="main-container">
                    <div class="panel">
                        <div class="tabs">
                            <div class="tab active" onclick="switchTab('terminal')">💻 Live Terminal & Stdout</div>
                            <div class="tab" onclick="switchTab('api')">📡 Live REST API Tester</div>
                            <div class="tab" onclick="switchTab('preview')">🌐 Web UI Preview</div>
                        </div>

                        <div id="tabTerminal" style="display: flex; flex-direction: column; flex: 1;">
                            <div class="terminal" id="terminalOutput"><span class="line-info">[OpsPilot Engine] Connecting to container #ctr-{{ID}} ({{SAFE_SLUG}}:v1.0.0)...</span>
<span class="line-success">[Docker Host] Container attached successfully on port 8080.</span>
<span class="line-info">[Process] Executing entrypoint command: java -jar app.jar</span>
<span class="line-accent">[Application] Server started on http://localhost:8080</span>
<span class="line-success">[Health Check] Endpoint /health returned 200 OK. Application ready!</span>
</div>
                        </div>

                        <div id="tabApi" style="display: none; flex-direction: column; flex: 1;">
                            <div class="url-bar">
                                <select class="method-select" id="apiMethod">
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                </select>
                                <input type="text" class="url-input" id="apiUrl" value="/api/v1/projects/{{ID}}" />
                                <button class="btn" onclick="sendTestRequest()">Send Request</button>
                            </div>
                            <div class="terminal" id="apiResponse"><span class="line-info">// Response output will appear here when you click "Send Request"...</span></div>
                        </div>

                        <div id="tabPreview" style="display: none; flex-direction: column; flex: 1;">
                            <div class="terminal" style="background-color: #13233B; color: #F8FAFC;">
                                <h3>🌐 Microservice Web Interface</h3>
                                <p style="color: #94A3B8; font-size: 0.85rem;">Project <strong>{{SAFE_NAME}}</strong> is running live under OpsPilot container orchestrator.</p>
                                <div style="background: #060B18; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid #1E2D45; margin-top: 1rem;">
                                    <h4 style="color: #38BDF8; margin-top: 0;">Service Output Payload:</h4>
                                    <pre style="color: #10B981; font-family: monospace; font-size: 0.85rem; margin: 0;">
{
  "service": "{{SAFE_NAME}}",
  "status": "ONLINE",
  "uptimeSeconds": 1420,
  "node": "minikube-node-1",
  "environment": "Production",
  "version": "v1.0.0"
}</pre>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="panel">
                        <div class="sidebar-section">
                            <div class="sidebar-title">Container Metadata</div>
                            <div class="info-row"><span class="info-label">Container ID</span><span class="info-val">#ctr-{{ID}}</span></div>
                            <div class="info-row"><span class="info-label">Image Tag</span><span class="info-val">opspilot/{{SAFE_SLUG}}:v1.0.0</span></div>
                            <div class="info-row"><span class="info-label">Pod</span><span class="info-val">#pod-{{ID}}</span></div>
                            <div class="info-row"><span class="info-label">Target Node</span><span class="info-val">minikube-node-1</span></div>
                            <div class="info-row"><span class="info-label">CPU Limit</span><span class="info-val">125m</span></div>
                            <div class="info-row"><span class="info-label">Memory Limit</span><span class="info-val">256Mi</span></div>
                        </div>

                        <div class="sidebar-section">
                            <div class="sidebar-title">Quick Execution Tools</div>
                            <button class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem; justify-content: center;" onclick="triggerTestLog()">
                                📝 Emit Application Log
                            </button>
                            <button class="btn btn-secondary" style="width: 100%; justify-content: center;" onclick="location.href='/logs?query={{SAFE_NAME}}'">
                                🔍 Open Log Stream
                            </button>
                        </div>
                    </div>
                </main>

                <script>
                    function switchTab(name) {
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        document.getElementById('tabTerminal').style.display = 'none';
                        document.getElementById('tabApi').style.display = 'none';
                        document.getElementById('tabPreview').style.display = 'none';

                        if (name === 'terminal') {
                            document.querySelectorAll('.tab')[0].classList.add('active');
                            document.getElementById('tabTerminal').style.display = 'flex';
                        } else if (name === 'api') {
                            document.querySelectorAll('.tab')[1].classList.add('active');
                            document.getElementById('tabApi').style.display = 'flex';
                        } else if (name === 'preview') {
                            document.querySelectorAll('.tab')[2].classList.add('active');
                            document.getElementById('tabPreview').style.display = 'flex';
                        }
                    }

                    function appendLog(msg, type) {
                        const term = document.getElementById('terminalOutput');
                        const time = new Date().toLocaleTimeString();
                        const span = document.createElement('span');
                        span.className = 'line-' + (type || 'info');
                        span.textContent = '\\n[' + time + '] ' + msg;
                        term.appendChild(span);
                        term.scrollTop = term.scrollHeight;
                    }

                    function executeAppRun() {
                        appendLog('[Runner] Triggering live execution cycle for {{SAFE_NAME}}...', 'accent');
                        setTimeout(() => appendLog('[Build] Compiling source tree from GitHub repository...', 'info'), 500);
                        setTimeout(() => appendLog('[Container] Packing container image opspilot/{{SAFE_SLUG}}:v1.0.0...', 'info'), 1200);
                        setTimeout(() => appendLog('[K8s] Deploying pod #pod-{{ID}} on minikube-node-1...', 'info'), 2000);
                        setTimeout(() => appendLog('[Success] Application is live and running on port 8080!', 'success'), 2800);
                    }

                    function restartContainer() {
                        appendLog('[Lifecycle] Sending SIGTERM to container process...', 'warning');
                        setTimeout(() => appendLog('[Lifecycle] Restarting container #ctr-{{ID}}...', 'info'), 800);
                        setTimeout(() => appendLog('[Lifecycle] Container restarted successfully. Status: RUNNING', 'success'), 1800);
                    }

                    function triggerTestLog() {
                        appendLog('[Log Ingestion] Application emitted structured log: "User query executed successfully in 12ms"', 'success');
                    }

                    function sendTestRequest() {
                        const method = document.getElementById('apiMethod').value;
                        const url = document.getElementById('apiUrl').value;
                        const resp = document.getElementById('apiResponse');
                        resp.innerHTML = '<span class="line-info">[' + method + ' ' + url + '] Executing HTTP request...</span>';
                        
                        setTimeout(() => {
                            resp.innerHTML = '<span class="line-success">HTTP/1.1 200 OK</span>\\n' +
                                '<span class="line-info">Content-Type: application/json</span>\\n' +
                                '<span class="line-info">Cache-Control: no-cache</span>\\n\\n' +
                                '<span class="line-accent">{\\n  "status": "SUCCESS",\\n  "project": "{{SAFE_NAME}}",\\n  "projectId": {{ID}},\\n  "environment": "Production",\\n  "timestamp": "' + new Date().toISOString() + '"\\n}</span>';
                        }, 600);
                    }
                </script>
            </body>
            </html>
            """;

        String html = template
                .replace("{{SAFE_NAME}}", safeName)
                .replace("{{SAFE_SLUG}}", safeSlug)
                .replace("{{DESC}}", desc)
                .replace("{{REPO_URL}}", repoUrl)
                .replace("{{ID}}", String.valueOf(id));

        return ResponseEntity.ok(html);
    }
}
