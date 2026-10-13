# Kubernetes Manifests: OpsPilot Log Watcher

This directory contains production-ready Kubernetes manifests for deploying the OpsPilot `log-watcher-service` microservice to a Kubernetes cluster (optimized for **k3s on AWS EC2** free-tier instances).

---

## 📁 Manifest Files

- [rbac.yaml](file:///d:/OpsPilot/k8s/log-watcher/rbac.yaml): Least-privilege namespaced `ServiceAccount`, `Role`, and `RoleBinding`.
  - Permissions:
    - `pods`: `get`, `list`, `watch`
    - `pods/log`: `get`
    - `events`: `get`, `list`, `watch`
- [configmap.yaml](file:///d:/OpsPilot/k8s/log-watcher/configmap.yaml): Environment variables configuring `WATCH_NAMESPACE`, `WATCH_LABEL_SELECTOR`, ring buffer line limits, and credential masking.
- [deployment.yaml](file:///d:/OpsPilot/k8s/log-watcher/deployment.yaml): Deployment specification.
  - Multi-stage non-root container (UID 10001, GID 10001).
  - Memory limit strictly set to **256Mi** with G1GC memory optimization.
  - Actuator `/actuator/health/liveness` and `/actuator/health/readiness` probes.
- [service.yaml](file:///d:/OpsPilot/k8s/log-watcher/service.yaml): ClusterIP service targeting port 8084.
- [ingress.yaml](file:///d:/OpsPilot/k8s/log-watcher/ingress.yaml): Ingress routing with Traefik buffering disabled (`traefik.ingress.kubernetes.io/buffering: "false"`) to ensure zero-latency Server-Sent Events (SSE).
- [kustomization.yaml](file:///d:/OpsPilot/k8s/log-watcher/kustomization.yaml): Kustomize aggregation file for one-command deployment.
- [sample-django-app.yaml](file:///d:/OpsPilot/k8s/log-watcher/sample-django-app.yaml): Sample Django workload to test live log watching and CrashLoopBackOff detection.

---

## 🚀 Quick Deployment

```bash
# 1. Apply manifests
kubectl apply -k k8s/log-watcher/

# 2. Check rollout
kubectl rollout status deployment/opspilot-log-watcher -n default

# 3. Deploy target Django showcase workload
kubectl apply -f k8s/log-watcher/sample-django-app.yaml
```
