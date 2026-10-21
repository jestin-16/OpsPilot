# OpsPilot Project Hosting & Architecture Report

> **Generated:** October 2026  
> **Target Production URL:** [https://opspilot.jestin16.dev](https://opspilot.jestin16.dev)  
> **Repository:** `jestin-16/OpsPilot` (Local Root: `c:\Users\jesvi\OpsPilot`)  
> **Host Environment:** Windows 11 / PowerShell / Docker Desktop / Cloudflare Tunnel

---

## 1. Executive Summary & Purpose

**OpsPilot** is an intelligent multi-cloud observability, AIOps, and DevOps workbench platform. It combines service monitoring, container insights, pipeline tracking, centralized log ingestion (NDJSON/JSON webhooks), real-time log streaming (SSE), and role-based access control (RBAC).

This report serves as the complete technical specification of the hosting configuration, container architecture, networking topology, secrets matrix, operational runbooks, and current integration state. It is formatted so you can paste it directly into an AI assistant or share with team members on any device.

---

## 2. Infrastructure & Ingress Topology

```
                  ┌──────────────────────────────────────────────┐
                  │                PUBLIC INTERNET               │
                  └───────────────────────┬──────────────────────┘
                                          │ HTTPS (443)
                                          ▼
                         ┌─────────────────────────────────┐
                         │   Cloudflare Edge Network       │
                         │   opspilot.jestin16.dev         │
                         └────────────────┬────────────────┘
                                          │ Cloudflare Tunnel (QUIC/TLS)
                                          ▼
                         ┌─────────────────────────────────┐
                         │ Host: Windows Service           │
                         │ Service Name: Cloudflared       │
                         └────────────────┬────────────────┘
                                          │ HTTP (127.0.0.1:80)
                                          ▼
┌────────────────────────────────── Docker Compose Network ──────────────────────────────────┐
│                                                                                            │
│   ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ opspilot-frontend (Nginx Alpine) - Host Port 80                                     │   │
│   │   ├── Serves React 18 + Vite SPA bundle (dist)                                     │   │
│   │   └── Reverse proxies `/api/*` to `http://api-gateway:8080` (with WebSocket/SSE)    │   │
│   └────────────────────────────────────────┬───────────────────────────────────────────┘   │
│                                            │ HTTP                                          │
│                                            ▼                                               │
│   ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ opspilot-api-gateway (Spring Cloud Gateway) - Host Port 8080                        │   │
│   │   └── Discovers backend microservices dynamically from Service Registry            │   │
│   └──────┬──────────────────────┬────────────────────────┬──────────────────────┬──────┘   │
│          │                      │                        │                      │          │
│          ▼                      ▼                        ▼                      ▼          │
│  ┌───────────────┐     ┌──────────────────┐    ┌────────────────────┐   ┌───────────────┐  │
│  │ auth-service  │     │   core-service   │    │ observability-svc  │   │ log-watcher   │  │
│  │ Port: 8081    │     │   Port: 8082     │    │ Port: 8083         │   │ Port: 8084    │  │
│  │ (Auth / RBAC) │     │ (Projects / K8s) │    │ (Logs / Webhooks)  │   │ (Pod Watcher) │  │
│  └───────┬───────┘     └────────┬─────────┘    └─────────┬──────────┘   └───────┬───────┘  │
│          │                      │                        │                      │          │
│          └──────────────────────┴────────────┬───────────┴──────────────────────┘          │
│                                              ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Core Infrastructure Services:                                                        │  │
│  │   • opspilot-service-registry (Netflix Eureka - Port 8761)                           │  │
│  │   • opspilot-postgres (PostgreSQL 15 Alpine - Port 5432 - DB: opspilot)              │  │
│  │   • opspilot-prometheus (Prometheus Metrics - Port 9090)                             │  │
│  │   • opspilot-grafana (Dashboards - Port 3000)                                        │  │
│  │   • opspilot-loki (Loki v3 Log Storage - Port 3100, internal)                        │  │
│  │   • opspilot-blackbox (Blackbox Exporter - Port 9115)                                │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Service Inventory & Port Mappings

| Service / Container Name | Tech Stack / Image | Host Port | Internal Port | Ingress / Exposure |
|---|---|---|---|---|
| **opspilot-frontend** | React 18, Vite, Nginx Alpine | `80` | `80` | **Public** via Cloudflare Tunnel (`https://opspilot.jestin16.dev`) |
| **opspilot-api-gateway** | Spring Cloud Gateway (Java 17) | `8080` | `8080` | Local Direct / Nginx Internal (`/api/`) |
| **opspilot-service-registry** | Spring Cloud Netflix Eureka | `8761` | `8761` | Local Direct (`http://localhost:8761`) |
| **opspilot-auth-service** | Spring Boot 3, JPA, JWT, BCrypt | `8081` | `8081` | Microservice (Routed via Gateway) |
| **opspilot-core-service** | Spring Boot 3, JPA | `8082` | `8082` | Microservice (Routed via Gateway) |
| **opspilot-observability-service** | Spring Boot 3, SSE, Webhook Ingest | `8083` | `8083` | Microservice (Routed via Gateway) |
| **opspilot-log-watcher-service** | Spring Boot 3, Fabric8 K8s client | `8085` | `8084` | Microservice (Routed via Gateway) |
| **opspilot-postgres** | `postgres:15-alpine` | `5432` | `5432` | Persistent DB (`postgres_data` volume) |
| **opspilot-prometheus** | `prom/prometheus:latest` | `9090` (internal) | `9090` | Metrics scraper and receiver |
| **opspilot-grafana** | `grafana/grafana:latest` | `3000` | `3000` | Local Direct (`http://localhost:3000`) |
| **opspilot-loki** | `grafana/loki:3.0.0` | — | `3100` | Internal log store (agents push via OpsPilot) |
| **opspilot-blackbox** | `prom/blackbox-exporter:latest` | `9115` | `9115` | Synthetic HTTP/TCP probing |

---

## 4. URL & Endpoint Reference

### Public Endpoints
- **Production UI:** `https://opspilot.jestin16.dev`
- **Public API Route:** `https://opspilot.jestin16.dev/api/v1/...`
- **Public Log Ingest Webhook:** `https://opspilot.jestin16.dev/api/v1/ingest/webhook/{token}`

### Local Management Endpoints (Host Machine)
- **Local Web App:** `http://localhost` (or Vite dev server: `http://localhost:5173`)
- **API Gateway Root:** `http://localhost:8080`
- **Eureka Service Registry Dashboard:** `http://localhost:8761`
- **Grafana Observability Portal:** `http://localhost:3000` *(Default: `admin` / `admin`)*
- **PostgreSQL Database:** `localhost:5432` *(User: `opspilot`, Pass: `opspilot`, DB: `opspilot`)*

---

## 5. Configuration & Environment Matrix

Located at `c:\Users\jesvi\OpsPilot\.env`:

```env
# Core Security Keys
JWT_SECRET=29bH3p4g0fYeaSusSdPos+8vhB5rWf24uj48E39cxpkr8/7eY6/dU2QAX/ix+5jw
OPSPILOT_ENCRYPTION_KEY=eQx1Mz3kpcG+XRzd77E/Kthsszbn+cv+oveht9RneTM=

# Cloudflare Tunnel
CLOUDFLARE_TUNNEL_TOKEN=

# Frontend Configuration
VITE_API_BASE_URL=/api/v1
VITE_ENABLE_MOCK_DATA=false

# Google OAuth Credentials
VITE_GOOGLE_CLIENT_ID=275211051077-gat8a3o8evorpt66b2lana97ktvj8mko.apps.googleusercontent.com
GOOGLE_CLIENT_ID=275211051077-gat8a3o8evorpt66b2lana97ktvj8mko.apps.googleusercontent.com

# Monitoring Integrations
KUBERNETES_ENABLED=false
PROMETHEUS_ENABLED=true
PROMETHEUS_URL=http://prometheus:9090
LOKI_ENABLED=true
LOKI_URL=http://loki:3100

# Observability Pipeline
LOGS_RUNNER_ENABLED=true
LOGS_RUNNER_INTERVAL_MS=30000
LOGS_RUNNER_REFRESH=10m
INGEST_MAX_BODY_BYTES=5242880

# Demo accounts initialization
DEMO_USERS_ENABLED=true
```

---

## 6. Authentication & Google OAuth Status

### Architecture
- **Auth Service:** Spring Security + JWT + BCrypt. Supports self-service registration for `DEVELOPER` and `DEVOPS` roles (`ADMIN` role is assigned by existing admins).
- **Google OAuth SSO:** 
  - Frontend uses `@react-oauth/google` with `<GoogleLogin />` to trigger Google's One Tap/Popup dialog.
  - Upon user confirmation, Google returns a signed `idToken`.
  - Frontend POSTs `{ idToken, role }` to `/api/v1/auth/google-login`.
  - Backend verifies token authenticity with Google's public key endpoint, creates or resolves the user in Postgres, and returns an OpsPilot JWT.

### Google Cloud Console Configuration (Resolution for `origin_mismatch`)
To ensure Google Sign-In succeeds across all development and production domains, the following must be set in **Google Cloud Console > Credentials > OAuth 2.0 Client ID** (`275211051077-gat8a3o8evorpt66b2lana97ktvj8mko...`):

1. **Authorized JavaScript origins:**
   - `https://opspilot.jestin16.dev` *(Production Cloudflare domain)*
   - `http://localhost` *(Docker frontend on port 80)*
   - `http://localhost:5173` *(Vite dev server)*
2. **Authorized redirect URIs:**
   - `https://opspilot.jestin16.dev`
   - `http://localhost`
   - `http://localhost:5173`

---

## 7. Operations & Lifecycle Runbook

All commands are run from PowerShell in `c:\Users\jesvi\OpsPilot`:

### Start Entire System
```powershell
# 1. Start all Docker containers
docker compose up -d

# 2. Start Cloudflare Tunnel (PowerShell as Administrator)
Start-Service Cloudflared
```

### Stop Entire System
```powershell
# Stop Cloudflare Tunnel
Stop-Service Cloudflared

# Stop Docker containers
docker compose stop
# or tear down containers:
docker compose down
```

### Rebuild & Apply Changes
When frontend or backend code is updated:
```powershell
# Rebuild and restart specific service (e.g. frontend)
docker compose up -d --build frontend

# Rebuild entire stack
docker compose up -d --build
```

### Inspect Health & Live Logs
```powershell
# Check container status
docker ps

# Check Cloudflare tunnel status
Get-Service Cloudflared

# View live aggregate logs
docker compose logs -f

# View live logs of individual microservices
docker compose logs -f frontend
docker compose logs -f api-gateway
docker compose logs -f auth-service
docker compose logs -f observability-service
```

### Database Utilities
```powershell
# Access PostgreSQL interactive shell inside container
docker exec -it opspilot-postgres psql -U opspilot -d opspilot

# Run demo seeding script
docker exec -i opspilot-postgres psql -U opspilot -d opspilot < scripts/db/demo_data_full.sql
```

---

## 8. Quick Context Snippet for Other Devices & LLM Chats

Copy and paste the snippet below when continuing work on your laptop, phone, or another AI chat:

```text
CONTEXT: I am working on OpsPilot (GitHub: jestin-16/OpsPilot).
OpsPilot is a Spring Boot 3 + React 18 / Vite DevOps observability and AIOps workbench.
- Public Production URL: https://opspilot.jestin16.dev
- Hosting Setup: Windows 11 host with Docker Compose + Cloudflare Zero Trust Tunnel (Windows service 'Cloudflared') routing HTTPS traffic to port 80.
- Architecture: Nginx (port 80) serves frontend and reverse-proxies /api/ to Spring Cloud API Gateway (port 8080). Gateway routes to auth-service (8081), core-service (8082), observability-service (8083), and log-watcher-service (8084). Eureka Service Registry runs on 8761. PostgreSQL 15 on 5432.
- Observability Stack: Prometheus (9090), Grafana (3000), Loki (3100), Blackbox (9115).
- Authentication: JWT-based with role RBAC (DEVELOPER, DEVOPS, ADMIN) and Google OAuth SSO via @react-oauth/google.
- OAuth Client ID: 275211051077-gat8a3o8evorpt66b2lana97ktvj8mko.apps.googleusercontent.com
```
