# OpsPilot - Kubernetes Log Watcher & Monitoring Service

`log-watcher-service` is a high-performance Spring Boot microservice engineered for OpsPilot to watch Kubernetes pods, capture container output via non-blocking Server-Sent Events (SSE), and surface basic cluster health and failure signals (CrashLoopBackOff, OOMKilled, restart spikes, error rates).

---

## 🚀 Key Features

1. **Auto-Detecting Kubernetes Configuration**:
   - **In-Cluster**: Automatically loads ServiceAccount token and CA cert from `/var/run/secrets/kubernetes.io/serviceaccount/`.
   - **Local Workstation**: Auto-detects local `~/.kube/config` or `$KUBECONFIG`.

2. **Lifecycle & Stream Management**:
   - Watches pod `ADDED`, `MODIFIED`, and `DELETED` events.
   - Automatically starts log streams when pods become active, and cleanly stops streams on pod termination.
   - **CrashLoopBackOff Diagnostics**: Detects container restarts and automatically retrieves previous terminated container logs (`previous=true`) so crash stack traces are preserved.

3. **Memory Safety & Bounded Ring Buffers (<256Mi Friendly)**:
   - Tailored for AWS EC2 free-tier instances (t2.micro/t3.micro).
   - Bounded thread-safe circular ring buffer per pod (configurable, default `5000` lines).
   - O(1) eviction of oldest lines under write pressure.
   - Hard character caps per log line (8KB) preventing memory exhaustion from runaway logs.

4. **Security & Credential Masking**:
   - Reuses OpsPilot's JWT stateless authentication.
   - Sensitive pattern regex masking: strips out bearer tokens, API keys, passwords, and authorization headers before storing in memory or streaming.

5. **Resilient Reconnections**:
   - Exponential backoff with jitter on watch or stream disconnects (initial: 1s, max: 30s, multiplier: 2.0).

---

## 📡 API Reference

### 1. REST APIs

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/pods` | None | Returns pod list: name, namespace, status, restarts, age, ready, container states |
| `GET` | `/api/logs/{namespace}/{pod}` | `container`, `tail`, `since`, `level` | Queries buffered logs from in-memory ring buffer with filtering |
| `GET` | `/api/health/summary` | `windowMinutes` (default: 15) | Pod counts by phase, total restarts, error rates per pod, CrashLoopBackOff/OOMKilled pods |
| `GET` | `/actuator/prometheus` | None | Exposes Micrometer Prometheus metrics |

### 2. Live SSE Streaming

- **Endpoint**: `GET /api/logs/{namespace}/{pod}/stream`
- **Query Parameters**:
  - `container`: Filter specific container name (optional)
  - `tail`: Replay initial N buffered lines upon connection (default: 100)
  - `token`: JWT authentication token (for browser `EventSource` clients)
- **Event Types**:
  - `CONNECTED`: Initial handshake event with pod metadata.
  - `LOG`: Emits JSON `ParsedLogLine` (`timestamp`, `namespace`, `pod`, `container`, `level`, `message`).
  - `: ping`: Heartbeat comment sent every 15s to keep connections alive through Ingress/proxies.

---

## 🛠️ Local Development & Testing

### Prerequisites
- Java 17+
- Maven 3.9+ (or use repository `mvnw.cmd` / `./mvnw`)
- Accessible Kubernetes cluster (k3s, minikube, kind, or local kubeconfig)

### 1. Run Unit & Integration Tests
```bash
cd backend
./mvnw test -pl log-watcher-service
```

### 2. Run the Service Locally
```bash
cd backend
./mvnw spring-boot:run -pl log-watcher-service
```
The service will start on port `8084` (`http://localhost:8084`).

### 3. Run with Docker Compose
From the repository root:
```bash
docker compose up -d log-watcher-service
```

---

## ☸️ Kubernetes Deployment (k3s on AWS EC2)

The service includes least-privilege manifests in `/k8s/log-watcher/`:

### 1. Manifests Overview
- `rbac.yaml`: Namespaced `ServiceAccount`, `Role`, and `RoleBinding` granting least privilege (`pods: get, list, watch; pods/log: get; events: get, list, watch`).
- `configmap.yaml`: Configures namespace to monitor (`WATCH_NAMESPACE`), label selector (`WATCH_LABEL_SELECTOR`), buffer line limits, and masking.
- `deployment.yaml`: Deployment with non-root security context (UID 10001), liveness/readiness actuator probes, and strict resource limits (`requests: 128Mi, limits: 256Mi`).
- `service.yaml`: ClusterIP service exposing port 8084.
- `ingress.yaml`: Ingress with Traefik buffering disabled (`traefik.ingress.kubernetes.io/buffering: "false"`) to support real-time SSE streaming without proxy delays.

### 2. Deploy to Cluster
```bash
# Apply all manifests via Kustomize
kubectl apply -k k8s/log-watcher/

# Or apply individually
kubectl apply -f k8s/log-watcher/rbac.yaml
kubectl apply -f k8s/log-watcher/configmap.yaml
kubectl apply -f k8s/log-watcher/service.yaml
kubectl apply -f k8s/log-watcher/deployment.yaml
kubectl apply -f k8s/log-watcher/ingress.yaml
```

### 3. Verify Deployment
```bash
kubectl get pods -l app=opspilot-log-watcher
kubectl logs -f deployment/opspilot-log-watcher
```

---

## 🐍 Target Showcase: Deploying Django Sample Application

To test log watching, level parsing, and crash detection:

```bash
# Deploy sample Django application producing periodic INFO, WARN, and ERROR logs
kubectl apply -f k8s/log-watcher/sample-django-app.yaml

# Open the OpsPilot UI at http://localhost:5173/kubernetes/logs
# View live streaming stdout/stderr logs and health metrics in real time!
```
