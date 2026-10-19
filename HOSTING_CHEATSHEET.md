# OpsPilot Cloudflare Hosting Cheatsheet

Quick reference commands to start, stop, restart, and monitor your OpsPilot hosting on Windows.

---

## 🟢 1. START HOSTING

Run in your project directory (`c:\Users\jesvi\OpsPilot`):
```powershell
docker compose up -d
```

Start the Cloudflare Tunnel (*PowerShell as Administrator*):
```powershell
Start-Service Cloudflared
```

---

## 🔴 2. STOP HOSTING

Stop the Cloudflare Tunnel (*PowerShell as Administrator*):
```powershell
Stop-Service Cloudflared
```

Stop the OpsPilot containers:
```powershell
# Pause containers without removing them
docker compose stop

# OR completely tear down containers and network
docker compose down
```

---

## 🔄 3. RESTART HOSTING

Restart OpsPilot containers:
```powershell
docker compose restart
```

If you made code changes and need to recompile:
```powershell
docker compose up -d --build
```

Restart the Cloudflare Tunnel (*PowerShell as Administrator*):
```powershell
Restart-Service Cloudflared
```

---

## 🔍 4. CHECK STATUS

Check running Docker containers:
```powershell
docker ps
```

Check Cloudflare Tunnel status:
```powershell
Get-Service Cloudflared
```

View live logs from any container:
```powershell
# View logs from all services
docker compose logs -f

# View logs from a specific service (e.g. frontend, api-gateway)
docker compose logs -f frontend
docker compose logs -f api-gateway
```

---

## 🌐 5. ACCESS URLS

- **Public Production URL:** `https://opspilot.jestin16.dev`
- **Local Development URL:** `http://localhost`
- **API Gateway (Direct):** `http://localhost:8080`
- **Service Registry (Eureka):** `http://localhost:8761`
- **Grafana Dashboards:** `http://localhost:3000` (admin / admin)
