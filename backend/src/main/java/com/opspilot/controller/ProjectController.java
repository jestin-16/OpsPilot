package com.opspilot.controller;

import com.opspilot.dto.PagedResponse;
import com.opspilot.dto.ProjectRequest;
import com.opspilot.dto.ProjectResponse;
import com.opspilot.entity.User;
import com.opspilot.service.ProjectRunnerService;
import com.opspilot.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/projects", "/api/projects"})
@Tag(name = "Project Management", description = "Endpoints for microservice project creation, updating, deleting, and paginated listing")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectRunnerService runnerService;

    // ─── Standard CRUD ────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Get paginated list of microservice projects for authenticated user")
    public ResponseEntity<PagedResponse<ProjectResponse>> getAllProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectService.getPaginatedProjectsForUser(currentUser, page, size, sortBy, sortDir));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get microservice project by ID")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id,
                                                           @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectService.getProjectById(id, currentUser));
    }

    @PostMapping
    @Operation(summary = "Register a new microservice project")
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User currentUser) {
        return new ResponseEntity<>(projectService.createProject(request, currentUser), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing microservice project")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectService.updateProject(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a microservice project")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        projectService.deleteProject(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    // ─── Live Execution Engine ─────────────────────────────────────────────────

    @PostMapping("/{id}/run")
    @Operation(summary = "Clone and run the project from its GitHub repository")
    public ResponseEntity<Map<String, Object>> runProject(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ProjectResponse project = projectService.getProjectById(id, currentUser);
        Map<String, Object> result = runnerService.startProject(id, project.getRepositoryUrl(), project.getProjectName());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/stop")
    @Operation(summary = "Stop the running project process")
    public ResponseEntity<Map<String, Object>> stopProject(@PathVariable Long id) {
        boolean stopped = runnerService.stopProject(id);
        return ResponseEntity.ok(Map.of("stopped", stopped));
    }

    @GetMapping("/{id}/status")
    @Operation(summary = "Get runtime status of the project")
    public ResponseEntity<Map<String, Object>> projectStatus(@PathVariable Long id) {
        boolean running = runnerService.isRunning(id);
        int port = runnerService.getPort(id);
        String type = runnerService.getProjectType(id);
        return ResponseEntity.ok(Map.of("running", running, "port", port, "type", type));
    }

    @GetMapping(value = "/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Server-Sent Events stream of live stdout/stderr for the project")
    public SseEmitter streamLogs(@PathVariable Long id) {
        return runnerService.subscribe(id);
    }

    // ─── Workbench HTML ────────────────────────────────────────────────────────

    @GetMapping(value = "/{id}/output", produces = "text/html")
    @Operation(summary = "View live web output and execution workbench of deployed project")
    public ResponseEntity<String> getProjectOutput(@PathVariable Long id) {
        ProjectResponse project = projectService.getProjectById(id, null);
        String name    = project.getProjectName();
        String slug    = name.toLowerCase().replaceAll("[^a-z0-9]", "-");
        String repoUrl = project.getRepositoryUrl() != null ? project.getRepositoryUrl() : "";
        String desc    = project.getDescription()   != null ? project.getDescription()   : "Microservice on OpsPilot";
        boolean running = runnerService.isRunning(id);
        int port        = runnerService.getPort(id);
        String portStr  = port > 0 ? String.valueOf(port) : "0";
        String safeRepo = repoUrl.isEmpty() ? "#" : repoUrl;
        String runningJs = running ? "true" : "false";
        String pillCls   = running ? "running" : "stopped";
        String statusTxt = running ? "RUNNING" : "STOPPED";
        String btnIcon   = running ? "\u23F9" : "\u25B6";
        String btnText   = running ? "Stop" : "Run Application";
        String sbStatus  = running ? "Running" : "Stopped";
        String sbPort    = port > 0 ? String.valueOf(port) : "\u2014";
        String sbType    = running ? runnerService.getProjectType(id) : "\u2014";
        String sbUrl     = port > 0 ? "localhost:" + port : "\u2014";
        String repoDisplay = repoUrl.isEmpty() ? "\u2014" : repoUrl;

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n");
        sb.append("<html lang=\"en\">\n<head>\n");
        sb.append("<meta charset=\"UTF-8\">\n");
        sb.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");
        sb.append("<title>").append(esc(name)).append(" - OpsPilot Workbench</title>\n");
        sb.append("<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n");
        sb.append("<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap\" rel=\"stylesheet\">\n");
        sb.append("<style>\n");
        sb.append("*{box-sizing:border-box;margin:0;padding:0}\n");
        sb.append(":root{--bg:#060B18;--surface:#0D1829;--surface2:#12213A;--border:#1C2E4A;");
        sb.append("--text:#E2E8F0;--muted:#64748B;--accent:#38BDF8;--green:#22C55E;");
        sb.append("--red:#EF4444;--yellow:#F59E0B;--purple:#A78BFA;");
        sb.append("--font:'Inter',sans-serif;--mono:'JetBrains Mono',monospace;}\n");
        sb.append("body{font-family:var(--font);background:var(--bg);color:var(--text);height:100vh;display:flex;flex-direction:column;overflow:hidden}\n");
        sb.append("header{background:var(--surface);border-bottom:1px solid var(--border);padding:.9rem 1.5rem;display:flex;align-items:center;gap:1rem;flex-shrink:0}\n");
        sb.append(".proj-info h1{font-size:1rem;font-weight:700}\n");
        sb.append(".proj-info p{font-size:.75rem;color:var(--muted);margin-top:.1rem;max-width:400px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n");
        sb.append(".spacer{flex:1}\n");
        sb.append(".status-pill{display:flex;align-items:center;gap:.4rem;font-size:.75rem;font-weight:600;padding:.3rem .75rem;border-radius:999px;border:1px solid;letter-spacing:.05em}\n");
        sb.append(".status-pill.running{background:rgba(34,197,94,.12);color:var(--green);border-color:rgba(34,197,94,.3)}\n");
        sb.append(".status-pill.stopped{background:rgba(100,116,139,.12);color:var(--muted);border-color:rgba(100,116,139,.3)}\n");
        sb.append(".status-pill .dot{width:6px;height:6px;border-radius:50%;background:currentColor}\n");
        sb.append(".status-pill.running .dot{animation:pulse 1.5s ease-in-out infinite}\n");
        sb.append("@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}\n");
        sb.append(".btn{display:inline-flex;align-items:center;gap:.4rem;padding:.45rem .9rem;border-radius:.5rem;border:none;cursor:pointer;font-size:.8rem;font-weight:600;font-family:var(--font);transition:.15s;text-decoration:none}\n");
        sb.append(".btn-primary{background:var(--accent);color:#000}.btn-primary:hover{background:#7DD3FC}\n");
        sb.append(".btn-ghost{background:var(--surface2);color:var(--text);border:1px solid var(--border)}.btn-ghost:hover{background:var(--border)}\n");
        sb.append(".btn-danger{background:rgba(239,68,68,.15);color:var(--red);border:1px solid rgba(239,68,68,.3)}\n");
        sb.append(".btn:disabled{opacity:.4;cursor:not-allowed}\n");
        sb.append(".main{display:grid;grid-template-columns:1fr 290px;flex:1;overflow:hidden}\n");
        sb.append(".left-panel{display:flex;flex-direction:column;border-right:1px solid var(--border);overflow:hidden}\n");
        sb.append(".tab-bar{display:flex;padding:.5rem 1rem 0;gap:.25rem;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0}\n");
        sb.append(".tab-btn{padding:.5rem 1rem;font-size:.8rem;font-weight:500;color:var(--muted);cursor:pointer;border:none;background:transparent;border-bottom:2px solid transparent;transition:.15s;font-family:var(--font)}\n");
        sb.append(".tab-btn.active{color:var(--accent);border-bottom-color:var(--accent)}\n");
        sb.append(".tab-btn:hover:not(.active){color:var(--text)}\n");
        sb.append(".tab-content{display:none;flex:1;overflow:hidden;flex-direction:column}\n");
        sb.append(".tab-content.active{display:flex}\n");
        sb.append(".terminal{flex:1;overflow-y:auto;padding:1rem;font-family:var(--mono);font-size:.78rem;line-height:1.65;background:var(--bg);color:var(--accent)}\n");
        sb.append(".terminal::-webkit-scrollbar{width:4px}.terminal::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}\n");
        sb.append(".t-info{color:var(--muted)}.t-success{color:var(--green)}.t-error{color:var(--red)}.t-warn{color:var(--yellow)}.t-accent{color:var(--purple)}.t-default{color:var(--accent)}\n");
        sb.append(".api-panel{flex:1;display:flex;flex-direction:column;padding:1rem;gap:.75rem;overflow:hidden}\n");
        sb.append(".url-bar{display:flex;gap:.5rem}\n");
        sb.append("select.method{background:var(--surface2);color:var(--green);border:1px solid var(--border);border-radius:.375rem;padding:.4rem .5rem;font-family:var(--mono);font-size:.8rem;font-weight:600;outline:none}\n");
        sb.append("input.url-inp{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:.375rem;color:var(--text);font-family:var(--mono);font-size:.8rem;padding:.4rem .75rem;outline:none}\n");
        sb.append("input.url-inp:focus{border-color:var(--accent)}\n");
        sb.append("textarea.req-body{background:var(--surface2);border:1px solid var(--border);border-radius:.375rem;color:var(--text);font-family:var(--mono);font-size:.78rem;padding:.6rem;resize:none;height:80px;outline:none}\n");
        sb.append(".api-resp{flex:1;overflow-y:auto;background:var(--bg);border:1px solid var(--border);border-radius:.375rem;padding:.75rem;font-family:var(--mono);font-size:.78rem;color:var(--accent);white-space:pre-wrap}\n");
        sb.append(".preview-panel{flex:1;display:flex;flex-direction:column;overflow:hidden}\n");
        sb.append(".preview-toolbar{padding:.6rem 1rem;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.5rem;flex-shrink:0}\n");
        sb.append(".preview-url{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:.375rem;color:var(--muted);font-family:var(--mono);font-size:.75rem;padding:.35rem .6rem}\n");
        sb.append("iframe{flex:1;border:none;background:#fff}\n");
        sb.append(".preview-placeholder{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;color:var(--muted);font-size:.85rem;text-align:center;padding:2rem}\n");
        sb.append(".preview-placeholder .icon{font-size:3rem;opacity:.3}\n");
        sb.append(".sidebar{background:var(--surface);overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:1.5rem}\n");
        sb.append(".sidebar::-webkit-scrollbar{width:3px}.sidebar::-webkit-scrollbar-thumb{background:var(--border)}\n");
        sb.append(".section-title{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:.6rem}\n");
        sb.append(".info-grid{display:flex;flex-direction:column;gap:0}\n");
        sb.append(".info-row{display:flex;justify-content:space-between;align-items:baseline;padding:.35rem 0;border-bottom:1px solid rgba(28,46,74,.5);font-size:.75rem}\n");
        sb.append(".info-row:last-child{border-bottom:none}\n");
        sb.append(".info-label{color:var(--muted)}\n");
        sb.append(".info-val{color:var(--text);font-family:var(--mono);font-size:.72rem;font-weight:500;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right}\n");
        sb.append(".action-list{display:flex;flex-direction:column;gap:.4rem}\n");
        sb.append("</style>\n</head>\n<body>\n");

        // Header
        sb.append("<header>\n");
        sb.append("  <span style=\"font-size:1.4rem\">&#x1F680;</span>\n");
        sb.append("  <div class=\"proj-info\"><h1>").append(esc(name)).append("</h1>");
        sb.append("<p>").append(esc(desc)).append("</p></div>\n");
        sb.append("  <div class=\"spacer\"></div>\n");
        sb.append("  <div id=\"statusPill\" class=\"status-pill ").append(pillCls).append("\">");
        sb.append("<span class=\"dot\"></span><span id=\"statusText\">").append(statusTxt).append("</span></div>\n");
        sb.append("  <button id=\"runBtn\" class=\"btn btn-primary\" onclick=\"toggleRun()\">");
        sb.append("<span id=\"runBtnIcon\">").append(btnIcon).append("</span>");
        sb.append("<span id=\"runBtnText\">").append(btnText).append("</span></button>\n");
        sb.append("  <a href=\"").append(safeRepo).append("\" target=\"_blank\" class=\"btn btn-ghost\" style=\"font-size:.75rem\">&#8599; Repo</a>\n");
        sb.append("</header>\n");

        // Main layout
        sb.append("<div class=\"main\">\n");
        sb.append("  <div class=\"left-panel\">\n");
        sb.append("    <div class=\"tab-bar\">\n");
        sb.append("      <button class=\"tab-btn active\" onclick=\"switchTab('terminal',this)\">&#x1F4BB; Live Terminal</button>\n");
        sb.append("      <button class=\"tab-btn\" onclick=\"switchTab('api',this)\">&#x1F4E1; API Tester</button>\n");
        sb.append("      <button class=\"tab-btn\" onclick=\"switchTab('preview',this)\">&#x1F310; Web Preview</button>\n");
        sb.append("    </div>\n");

        // Terminal tab
        sb.append("    <div id=\"tab-terminal\" class=\"tab-content active\">\n");
        sb.append("      <div class=\"terminal\" id=\"terminal\">");
        sb.append("<span class=\"t-info\">[OpsPilot] Workbench ready. Click &#x25B6; Run Application to start.\\n</span>");
        sb.append("</div>\n    </div>\n");

        // API tester tab
        sb.append("    <div id=\"tab-api\" class=\"tab-content\">\n");
        sb.append("      <div class=\"api-panel\">\n");
        sb.append("        <div class=\"url-bar\">\n");
        sb.append("          <select class=\"method\" id=\"apiMethod\"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select>\n");
        sb.append("          <input class=\"url-inp\" id=\"apiUrl\" placeholder=\"http://localhost:PORT/path\" value=\"\">\n");
        sb.append("        </div>\n");
        sb.append("        <textarea class=\"req-body\" id=\"apiBody\" placeholder='{\"key\":\"value\"}  (for POST/PUT)'></textarea>\n");
        sb.append("        <button class=\"btn btn-primary\" onclick=\"sendRequest()\" style=\"align-self:flex-start\">Send Request</button>\n");
        sb.append("        <div class=\"api-resp\" id=\"apiResp\"><span class=\"t-info\">// Response will appear here\u2026</span></div>\n");
        sb.append("      </div>\n    </div>\n");

        // Preview tab
        sb.append("    <div id=\"tab-preview\" class=\"tab-content\">\n");
        sb.append("      <div class=\"preview-panel\">\n");
        sb.append("        <div class=\"preview-toolbar\">\n");
        sb.append("          <span style=\"font-size:.75rem;color:var(--muted);flex-shrink:0\">Preview URL:</span>\n");
        sb.append("          <span class=\"preview-url\" id=\"previewUrlBar\">\u2014</span>\n");
        sb.append("          <button class=\"btn btn-ghost\" style=\"font-size:.72rem;padding:.3rem .6rem\" onclick=\"reloadPreview()\">&#x27F3;</button>\n");
        sb.append("          <a id=\"openExternal\" href=\"#\" target=\"_blank\" class=\"btn btn-ghost\" style=\"font-size:.72rem;padding:.3rem .6rem\">&#8599;</a>\n");
        sb.append("        </div>\n");
        sb.append("        <div id=\"previewPlaceholder\" class=\"preview-placeholder\">");
        sb.append("<div class=\"icon\">&#x1F310;</div><div>Start the project to see its live web output here.</div></div>\n");
        sb.append("        <iframe id=\"preview-frame\" style=\"display:none\"></iframe>\n");
        sb.append("      </div>\n    </div>\n");
        sb.append("  </div>\n"); // end left-panel

        // Sidebar
        sb.append("  <div class=\"sidebar\">\n");
        sb.append("    <div><div class=\"section-title\">Runtime Info</div><div class=\"info-grid\">\n");
        sb.append("      <div class=\"info-row\"><span class=\"info-label\">Project ID</span><span class=\"info-val\">#").append(id).append("</span></div>\n");
        sb.append("      <div class=\"info-row\"><span class=\"info-label\">Status</span><span class=\"info-val\" id=\"sb-status\">").append(sbStatus).append("</span></div>\n");
        sb.append("      <div class=\"info-row\"><span class=\"info-label\">Port</span><span class=\"info-val\" id=\"sb-port\">").append(sbPort).append("</span></div>\n");
        sb.append("      <div class=\"info-row\"><span class=\"info-label\">Type</span><span class=\"info-val\" id=\"sb-type\">").append(sbType).append("</span></div>\n");
        sb.append("      <div class=\"info-row\"><span class=\"info-label\">App URL</span><span class=\"info-val\" id=\"sb-url\">").append(sbUrl).append("</span></div>\n");
        sb.append("    </div></div>\n");
        sb.append("    <div><div class=\"section-title\">Quick Actions</div><div class=\"action-list\">\n");
        sb.append("      <button class=\"btn btn-ghost\" style=\"justify-content:center;font-size:.78rem\" onclick=\"clearTerminal()\">&#x1F5D1; Clear Terminal</button>\n");
        sb.append("      <button class=\"btn btn-ghost\" style=\"justify-content:center;font-size:.78rem\" onclick=\"downloadLogs()\">&#x2B07; Download Logs</button>\n");
        sb.append("      <button class=\"btn btn-ghost\" style=\"justify-content:center;font-size:.78rem\" onclick=\"openPreviewTab()\">&#x1F310; Open Live Preview</button>\n");
        sb.append("    </div></div>\n");
        sb.append("    <div><div class=\"section-title\">Repository</div><div class=\"info-grid\">\n");
        sb.append("      <div class=\"info-row\"><span class=\"info-label\">Name</span><span class=\"info-val\">").append(esc(slug)).append("</span></div>\n");
        sb.append("      <div class=\"info-row\"><span class=\"info-label\">Image</span><span class=\"info-val\">opspilot/").append(esc(slug)).append(":v1</span></div>\n");
        sb.append("      <div class=\"info-row\" style=\"flex-direction:column;gap:.25rem\"><span class=\"info-label\">URL</span>");
        sb.append("<a href=\"").append(safeRepo).append("\" target=\"_blank\" style=\"color:var(--accent);font-size:.68rem;font-family:var(--mono);word-break:break-all\">");
        sb.append(esc(repoDisplay)).append("</a></div>\n");
        sb.append("    </div></div>\n");
        sb.append("  </div>\n</div>\n"); // end sidebar + main

        // JavaScript
        sb.append("<script>\n");
        sb.append("const PROJECT_ID=").append(id).append(";\n");
        sb.append("const BASE_URL='/api/v1/projects/'+PROJECT_ID;\n");
        sb.append("let isRunning=").append(runningJs).append(";\n");
        sb.append("let currentPort=").append(portStr).append(";\n");
        sb.append("let sseSource=null;\n");
        sb.append("let logLines=[];\n");
        sb.append(JS_FUNCTIONS);
        sb.append("(async function init(){\n");
        sb.append("  const sr=await fetch(BASE_URL+'/status').then(r=>r.json()).catch(()=>({}));\n");
        sb.append("  if(sr.running){setRunning(true,sr.port,sr.type);connectSSE();}\n");
        sb.append("})();\n");
        sb.append("</script>\n</body>\n</html>\n");

        return ResponseEntity.ok(sb.toString());
    }

    // ─── HTML helpers ─────────────────────────────────────────────────────────

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#x27;");
    }

    /**
     * Shared JS for the workbench.  Written as a plain Java string constant
     * to avoid any text-block or escaping issues.
     */
    private static final String JS_FUNCTIONS =
        "function switchTab(name,btn){\n" +
        "  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));\n" +
        "  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));\n" +
        "  document.getElementById('tab-'+name).classList.add('active');\n" +
        "  btn.classList.add('active');\n" +
        "}\n" +
        "function termLine(text,cls){\n" +
        "  const term=document.getElementById('terminal');\n" +
        "  const span=document.createElement('span');\n" +
        "  const low=text.toLowerCase();\n" +
        "  if(!cls){\n" +
        "    if(low.includes('error')||low.includes('exception')||low.includes('failed'))cls='t-error';\n" +
        "    else if(low.includes('warn'))cls='t-warn';\n" +
        "    else if(low.includes('success')||low.includes('started')||low.includes('running on port')||low.includes('\\u2714'))cls='t-success';\n" +
        "    else if(low.includes('[opspilot]')||low.includes('[git]')||low.includes('[detector]')||low.includes('[runner]')||low.includes('[http]'))cls='t-info';\n" +
        "    else if(low.includes('[k8s]')||low.includes('[build]')||low.includes('[node]')||low.includes('[npm]')||low.includes('[spring]')||low.includes('[demo]'))cls='t-accent';\n" +
        "    else cls='t-default';\n" +
        "  }\n" +
        "  span.className=cls;\n" +
        "  span.textContent=text+'\\n';\n" +
        "  term.appendChild(span);\n" +
        "  term.scrollTop=term.scrollHeight;\n" +
        "  logLines.push(text);\n" +
        "}\n" +
        "function clearTerminal(){document.getElementById('terminal').innerHTML='';logLines=[];}\n" +
        "function downloadLogs(){\n" +
        "  const blob=new Blob([logLines.join('\\n')],{type:'text/plain'});\n" +
        "  const a=document.createElement('a');\n" +
        "  a.href=URL.createObjectURL(blob);\n" +
        "  a.download='opspilot-logs-project-'+PROJECT_ID+'.txt';\n" +
        "  a.click();\n" +
        "}\n" +
        "function setRunning(running,port,type){\n" +
        "  isRunning=running;currentPort=port||0;\n" +
        "  const pill=document.getElementById('statusPill');\n" +
        "  const text=document.getElementById('statusText');\n" +
        "  const btnI=document.getElementById('runBtnIcon');\n" +
        "  const btnT=document.getElementById('runBtnText');\n" +
        "  pill.className='status-pill '+(running?'running':'stopped');\n" +
        "  text.textContent=running?'RUNNING':'STOPPED';\n" +
        "  btnI.textContent=running?'\\u23F9':'\\u25B6';\n" +
        "  btnT.textContent=running?'Stop':'Run Application';\n" +
        "  document.getElementById('sb-status').textContent=running?'Running':'Stopped';\n" +
        "  document.getElementById('sb-port').textContent=currentPort>0?currentPort:'\\u2014';\n" +
        "  document.getElementById('sb-type').textContent=type||'\\u2014';\n" +
        "  document.getElementById('sb-url').textContent=currentPort>0?'localhost:'+currentPort:'\\u2014';\n" +
        "  if(running&&currentPort>0){\n" +
        "    const appUrl='http://localhost:'+currentPort;\n" +
        "    document.getElementById('apiUrl').value=appUrl+'/';\n" +
        "    document.getElementById('previewUrlBar').textContent=appUrl;\n" +
        "    document.getElementById('openExternal').href=appUrl;\n" +
        "    showPreviewFrame(appUrl);\n" +
        "  } else {\n" +
        "    document.getElementById('previewUrlBar').textContent='\\u2014';\n" +
        "    hidePreviewFrame();\n" +
        "  }\n" +
        "}\n" +
        "function showPreviewFrame(url){\n" +
        "  document.getElementById('previewPlaceholder').style.display='none';\n" +
        "  const f=document.getElementById('preview-frame');\n" +
        "  f.style.display='block';f.src=url;\n" +
        "}\n" +
        "function hidePreviewFrame(){\n" +
        "  document.getElementById('previewPlaceholder').style.display='';\n" +
        "  document.getElementById('preview-frame').style.display='none';\n" +
        "}\n" +
        "function reloadPreview(){\n" +
        "  const f=document.getElementById('preview-frame');\n" +
        "  if(f.src&&f.style.display!=='none')f.src=f.src;\n" +
        "}\n" +
        "function openPreviewTab(){\n" +
        "  document.querySelectorAll('.tab-btn')[2].click();\n" +
        "}\n" +
        "function connectSSE(){\n" +
        "  if(sseSource){sseSource.close();sseSource=null;}\n" +
        "  termLine('[OpsPilot] Connecting to live log stream\\u2026','t-info');\n" +
        "  const es=new EventSource(BASE_URL+'/stream');\n" +
        "  sseSource=es;\n" +
        "  es.addEventListener('log',e=>{\n" +
        "    const data=e.data;\n" +
        "    if(data.startsWith('__STATUS__:stopped')){\n" +
        "      setRunning(false,0,null);es.close();sseSource=null;\n" +
        "    } else {\n" +
        "      termLine(data);\n" +
        "      const m=data.match(/(?:port|on|listening)[:\\s]+([0-9]{4,5})/i);\n" +
        "      if(m){const p=parseInt(m[1]);if(p!==8080&&p>1023&&p<65536&&p!==currentPort){currentPort=p;setRunning(true,p,document.getElementById('sb-type').textContent);}}\n" +
        "    }\n" +
        "  });\n" +
        "  es.onerror=()=>{termLine('[OpsPilot] Log stream disconnected.','t-warn');es.close();sseSource=null;};\n" +
        "}\n" +
        "async function toggleRun(){\n" +
        "  const btn=document.getElementById('runBtn');\n" +
        "  btn.disabled=true;\n" +
        "  if(isRunning){\n" +
        "    termLine('[OpsPilot] Stopping process\\u2026','t-warn');\n" +
        "    await fetch(BASE_URL+'/stop',{method:'POST'});\n" +
        "    setRunning(false,0,null);\n" +
        "    if(sseSource){sseSource.close();sseSource=null;}\n" +
        "    termLine('[OpsPilot] Process stopped.','t-warn');\n" +
        "  } else {\n" +
        "    clearTerminal();\n" +
        "    termLine('[OpsPilot] Starting project \\u2014 cloning repo and launching process\\u2026','t-info');\n" +
        "    const res=await fetch(BASE_URL+'/run',{method:'POST'});\n" +
        "    const data=await res.json();\n" +
        "    termLine('[OpsPilot] '+(data.message||'Launched'),'t-info');\n" +
        "    connectSSE();\n" +
        "    let waited=0;\n" +
        "    const poll=setInterval(async()=>{\n" +
        "      waited+=2000;\n" +
        "      const sr=await fetch(BASE_URL+'/status').then(r=>r.json());\n" +
        "      if(sr.running){setRunning(true,sr.port,sr.type);clearInterval(poll);}\n" +
        "      else if(waited>90000){termLine('[OpsPilot] Timeout. Check logs.','t-error');clearInterval(poll);}\n" +
        "    },2000);\n" +
        "  }\n" +
        "  btn.disabled=false;\n" +
        "}\n" +
        "async function sendRequest(){\n" +
        "  const method=document.getElementById('apiMethod').value;\n" +
        "  const url=document.getElementById('apiUrl').value;\n" +
        "  const body=document.getElementById('apiBody').value;\n" +
        "  const respEl=document.getElementById('apiResp');\n" +
        "  if(!url){respEl.innerHTML='<span class=\"t-error\">Please enter a URL.</span>';return;}\n" +
        "  respEl.innerHTML='<span class=\"t-info\">Sending '+method+' '+url+' \\u2026</span>';\n" +
        "  try{\n" +
        "    const opts={method,headers:{'Content-Type':'application/json'}};\n" +
        "    if(['POST','PUT','PATCH'].includes(method)&&body.trim())opts.body=body;\n" +
        "    const t0=Date.now();\n" +
        "    const res=await fetch(url,opts);\n" +
        "    const ms=Date.now()-t0;\n" +
        "    let text=await res.text();\n" +
        "    let pretty=text;\n" +
        "    try{pretty=JSON.stringify(JSON.parse(text),null,2);}catch(e){}\n" +
        "    const statusCls=res.ok?'t-success':'t-error';\n" +
        "    respEl.innerHTML='<span class=\"'+statusCls+'\">HTTP '+res.status+' '+res.statusText+'  ('+ms+'ms)</span>\\n'+\n" +
        "      '<span class=\"t-info\">Content-Type: '+(res.headers.get('Content-Type')||'unknown')+'</span>\\n\\n'+\n" +
        "      '<span class=\"t-default\">'+escHtml(pretty)+'</span>';\n" +
        "  }catch(e){\n" +
        "    respEl.innerHTML='<span class=\"t-error\">Request failed: '+escHtml(e.message)+'\\n\\nNote: CORS or browser restrictions may apply.</span>';\n" +
        "  }\n" +
        "}\n" +
        "function escHtml(s){\n" +
        "  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');\n" +
        "}\n";
}
