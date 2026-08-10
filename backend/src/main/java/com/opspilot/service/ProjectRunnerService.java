package com.opspilot.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * Real execution engine for OpsPilot.
 *
 * Lifecycle per project:
 *  1. Clone GitHub repo to /tmp/opspilot-runs/{projectId}/
 *  2. Detect project type (Node / Spring Boot / Python / static HTML)
 *  3. Spawn subprocess (npm start / mvnw spring-boot:run / python app.py)
 *  4. Pipe stdout+stderr to a bounded in-memory ring buffer
 *  5. SSE emitters subscribed to that buffer receive live lines
 *  6. Track the assigned port so the workbench can iframe the running app
 */
@Service
public class ProjectRunnerService {

    // Per-project running state
    public static class RunState {
        public final Process process;
        public final int port;
        public final String projectType;
        public final Path workDir;
        public final List<String> logBuffer = Collections.synchronizedList(new ArrayList<>());
        public final List<SseEmitter> emitters = Collections.synchronizedList(new ArrayList<>());
        public volatile boolean running = true;

        public RunState(Process process, int port, String projectType, Path workDir) {
            this.process = process;
            this.port = port;
            this.projectType = projectType;
            this.workDir = workDir;
        }
    }

    private final ConcurrentHashMap<Long, RunState> running = new ConcurrentHashMap<>();
    private final ExecutorService ioPool = Executors.newCachedThreadPool();

    // Ports we can allocate starting from 9100
    private final Set<Integer> usedPorts = ConcurrentHashMap.newKeySet();
    private int nextPort = 9100;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public boolean isRunning(Long projectId) {
        RunState s = running.get(projectId);
        return s != null && s.running && s.process.isAlive();
    }

    public int getPort(Long projectId) {
        RunState s = running.get(projectId);
        return s != null ? s.port : -1;
    }

    public String getProjectType(Long projectId) {
        RunState s = running.get(projectId);
        return s != null ? s.projectType : "unknown";
    }

    /**
     * Returns an SSE emitter that receives live log lines for the project.
     * If the project is not running the emitter immediately receives the buffered
     * logs from the last run (or a "not running" message).
     */
    public SseEmitter subscribe(Long projectId) {
        SseEmitter emitter = new SseEmitter(0L); // never time out on its own

        RunState state = running.get(projectId);
        if (state == null) {
            // Send a small placeholder and complete
            ioPool.submit(() -> {
                try {
                    emitter.send(SseEmitter.event()
                            .name("log")
                            .data("[OpsPilot] No active process for project #" + projectId + ". Click ▶ Run to start."));
                    emitter.complete();
                } catch (Exception ignored) {
                    emitter.completeWithError(ignored);
                }
            });
            return emitter;
        }

        // Replay buffered lines first, then keep alive
        ioPool.submit(() -> {
            try {
                List<String> snapshot;
                synchronized (state.logBuffer) {
                    snapshot = new ArrayList<>(state.logBuffer);
                }
                for (String line : snapshot) {
                    emitter.send(SseEmitter.event().name("log").data(line));
                }
                if (!state.running) {
                    emitter.send(SseEmitter.event().name("status").data("stopped"));
                    emitter.complete();
                    return;
                }
                state.emitters.add(emitter);
                emitter.onCompletion(() -> state.emitters.remove(emitter));
                emitter.onError(e -> state.emitters.remove(emitter));
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    /**
     * Clone + detect + run the project.
     * Returns immediately; the process runs in the background.
     */
    public synchronized Map<String, Object> startProject(Long projectId, String repositoryUrl, String projectName) {
        Map<String, Object> result = new HashMap<>();

        if (isRunning(projectId)) {
            result.put("status", "already_running");
            result.put("port", getPort(projectId));
            result.put("message", "Project is already running on port " + getPort(projectId));
            return result;
        }

        int port = allocatePort();
        Path workDir = Path.of(System.getProperty("java.io.tmpdir"), "opspilot-runs", String.valueOf(projectId));

        ioPool.submit(() -> runProject(projectId, repositoryUrl, projectName, port, workDir));

        result.put("status", "starting");
        result.put("port", port);
        result.put("message", "Project is being cloned and started on port " + port);
        return result;
    }

    /** Kill a running project process. */
    public synchronized boolean stopProject(Long projectId) {
        RunState state = running.remove(projectId);
        if (state == null) return false;
        state.running = false;
        state.process.destroyForcibly();
        usedPorts.remove(state.port);
        broadcast(state, "[OpsPilot] Process stopped.");
        finishEmitters(state);
        return true;
    }

    /** Return recent log lines for the project (for initial page load). */
    public List<String> getLogBuffer(Long projectId) {
        RunState state = running.get(projectId);
        if (state == null) return List.of("[OpsPilot] No active run for project #" + projectId);
        synchronized (state.logBuffer) {
            return new ArrayList<>(state.logBuffer);
        }
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    private void runProject(Long projectId, String repoUrl, String projectName, int port, Path workDir) {
        // Create a placeholder so subscribe() can attach emitters before the real process starts
        Process dummyProc = createDummyProcess();
        RunState placeholder = new RunState(dummyProc, port, "detecting", workDir);
        running.put(projectId, placeholder);

        Consumer<String> log = line -> {
            placeholder.logBuffer.add(line);
            if (placeholder.logBuffer.size() > 2000) placeholder.logBuffer.remove(0);
            broadcast(placeholder, line);
        };

        try {
            log.accept("[OpsPilot] Starting execution engine for project #" + projectId);
            log.accept("[OpsPilot] Repository: " + repoUrl);

            // --- Step 1: clone ---
            Files.createDirectories(workDir);

            boolean cloned = false;
            if (repoUrl != null && repoUrl.startsWith("http") && !repoUrl.contains("github.com/opspilot")) {
                log.accept("[git] Cloning " + repoUrl + " into " + workDir + " ...");
                Process cloneProc = new ProcessBuilder("git", "clone", "--depth=1", repoUrl, ".")
                        .directory(workDir.toFile())
                        .redirectErrorStream(true)
                        .start();
                pipeToLog(cloneProc.getInputStream(), log, "[git] ");
                int exitCode = cloneProc.waitFor();
                if (exitCode == 0) {
                    log.accept("[git] ✔ Clone successful.");
                    cloned = true;
                } else {
                    log.accept("[git] ✘ Clone failed (exit " + exitCode + "). Running demo mode.");
                }
            } else {
                log.accept("[OpsPilot] No valid remote repo URL — running built-in demo server.");
            }

            // --- Step 2: detect project type ---
            String type = detectProjectType(workDir, cloned);
            log.accept("[Detector] Project type: " + type);
            // Update type in state
            RunState real = running.get(projectId);
            if (real != null) {
                // We'll replace the placeholder below once we have a real process
            }

            // --- Step 3: build command ---
            ProcessBuilder pb = buildCommand(type, workDir, port, log);
            pb.directory(workDir.toFile());
            pb.redirectErrorStream(true);

            // Inject PORT env var for Node/Python apps
            pb.environment().put("PORT", String.valueOf(port));
            pb.environment().put("SERVER_PORT", String.valueOf(port));

            log.accept("[Runner] Launching process: " + String.join(" ", pb.command()));

            Process process = pb.start();

            // Replace placeholder with real RunState
            RunState realState = new RunState(process, port, type, workDir);
            realState.logBuffer.addAll(placeholder.logBuffer);
            realState.emitters.addAll(placeholder.emitters);
            // Re-wire emitter removal to new state
            running.put(projectId, realState);

            // Pipe stdout/stderr to SSE
            ioPool.submit(() -> pipeToLog(process.getInputStream(), line -> {
                realState.logBuffer.add(line);
                if (realState.logBuffer.size() > 2000) realState.logBuffer.remove(0);
                broadcast(realState, line);
            }, ""));

            // Monitor process exit
            ioPool.submit(() -> {
                try {
                    int code = process.waitFor();
                    realState.running = false;
                    broadcast(realState, "[Runner] Process exited with code " + code);
                    broadcast(realState, "__STATUS__:stopped");
                    finishEmitters(realState);
                    running.remove(projectId);
                    usedPorts.remove(port);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });

        } catch (Exception e) {
            log.accept("[ERROR] " + e.getMessage());
            running.remove(projectId);
            usedPorts.remove(port);
            finishEmitters(placeholder);
        }
    }

    private String detectProjectType(Path dir, boolean cloned) {
        if (!cloned) return "demo";
        if (Files.exists(dir.resolve("package.json"))) return "node";
        if (Files.exists(dir.resolve("pom.xml")) || Files.exists(dir.resolve("mvnw"))) return "springboot";
        if (Files.exists(dir.resolve("requirements.txt")) || Files.exists(dir.resolve("app.py"))) return "python";
        if (Files.exists(dir.resolve("Dockerfile"))) return "docker";
        if (Files.exists(dir.resolve("index.html"))) return "static";
        return "demo";
    }

    private ProcessBuilder buildCommand(String type, Path dir, int port, Consumer<String> log) throws IOException {
        return switch (type) {
            case "node" -> {
                // Install deps then start
                log.accept("[Node] Installing npm dependencies...");
                try {
                    Process install = new ProcessBuilder("npm", "install", "--prefer-offline")
                            .directory(dir.toFile()).redirectErrorStream(true).start();
                    pipeToLog(install.getInputStream(), log, "[npm] ");
                    install.waitFor();
                } catch (Exception e) {
                    log.accept("[npm] Install skipped: " + e.getMessage());
                }
                // Prefer start, then dev, then node index.js
                String startScript = "start";
                try {
                    String pkg = Files.readString(dir.resolve("package.json"));
                    if (!pkg.contains("\"start\"")) startScript = pkg.contains("\"dev\"") ? "dev" : null;
                } catch (Exception ignored) {}
                if (startScript != null) {
                    yield new ProcessBuilder("npm", "run", startScript);
                } else {
                    String entry = Files.exists(dir.resolve("index.js")) ? "index.js"
                            : Files.exists(dir.resolve("server.js")) ? "server.js" : "app.js";
                    yield new ProcessBuilder("node", entry);
                }
            }
            case "springboot" -> {
                String mvnw = Files.exists(dir.resolve("mvnw")) ? "./mvnw" : "mvn";
                yield new ProcessBuilder(mvnw, "spring-boot:run",
                        "-Dspring-boot.run.jvmArguments=-Dserver.port=" + port);
            }
            case "python" -> {
                String entry = Files.exists(dir.resolve("app.py")) ? "app.py"
                        : Files.exists(dir.resolve("main.py")) ? "main.py" : "server.py";
                yield new ProcessBuilder("python3", entry);
            }
            case "static" -> {
                // Serve static files with Python's built-in HTTP server
                yield new ProcessBuilder("python3", "-m", "http.server", String.valueOf(port));
            }
            default -> {
                // Built-in demo: tiny Java HTTP server that just returns JSON
                log.accept("[Demo] Starting built-in OpsPilot demo HTTP server on port " + port);
                yield buildDemoServer(port);
            }
        };
    }

    /** Launch a minimal demo HTTP server using netcat or Python (always available). */
    private ProcessBuilder buildDemoServer(int port) {
        // Use Python to serve a tiny JSON response
        String script = String.format(
                "import http.server, json, time, threading\n" +
                "start = time.time()\n" +
                "class H(http.server.BaseHTTPRequestHandler):\n" +
                "    def do_GET(self):\n" +
                "        body = json.dumps({'service':'OpsPilot Demo','status':'ONLINE','uptimeSeconds':round(time.time()-start),'path':self.path,'port':%d}).encode()\n" +
                "        self.send_response(200)\n" +
                "        self.send_header('Content-Type','application/json')\n" +
                "        self.send_header('Access-Control-Allow-Origin','*')\n" +
                "        self.end_headers()\n" +
                "        self.wfile.write(body)\n" +
                "    def log_message(self,fmt,*args): print('[HTTP]',fmt%%args,flush=True)\n" +
                "print('OpsPilot demo server running on port %d',flush=True)\n" +
                "http.server.HTTPServer(('',  %d),H).serve_forever()\n",
                port, port, port
        );
        return new ProcessBuilder("python3", "-c", script);
    }

    private void pipeToLog(InputStream is, Consumer<String> log, String prefix) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
            String line;
            while ((line = br.readLine()) != null) {
                log.accept(prefix + line);
            }
        } catch (IOException ignored) {}
    }

    private void broadcast(RunState state, String line) {
        List<SseEmitter> dead = new ArrayList<>();
        synchronized (state.emitters) {
            for (SseEmitter e : state.emitters) {
                try {
                    e.send(SseEmitter.event().name("log").data(line));
                } catch (Exception ex) {
                    dead.add(e);
                }
            }
        }
        state.emitters.removeAll(dead);
    }

    private void finishEmitters(RunState state) {
        synchronized (state.emitters) {
            for (SseEmitter e : state.emitters) {
                try { e.complete(); } catch (Exception ignored) {}
            }
            state.emitters.clear();
        }
    }

    private synchronized int allocatePort() {
        while (usedPorts.contains(nextPort)) nextPort++;
        usedPorts.add(nextPort);
        return nextPort++;
    }

    /** Creates a trivially-alive dummy Process (self handle) for placeholder use */
    private Process createDummyProcess() {
        try {
            return new ProcessBuilder("true").start();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
