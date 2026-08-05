# OpsPilot — AI-Assisted Internal Developer Platform

OpsPilot is a unified Internal Developer Platform (IDP) designed to streamline application lifecycle management, project orchestration, and deployment automation.

---

## Architecture & Technology Stack

- **Backend**: Java 17+, Spring Boot 3+, Spring Security (JWT), Spring Data JPA, Maven, PostgreSQL.
- **Frontend**: React 18+, TypeScript, Tailwind CSS (Custom Dark Theme), React Router, Lucide Icons.
- **Infrastructure**: Docker Compose (PostgreSQL 15).

---

## Project Structure

```text
OpsPilot/
├── docker-compose.yml       # Local PostgreSQL database setup
├── README.md                # Project documentation and setup guide
├── PROGRESS.md              # Milestone 1 completion progress report
├── backend/                 # Spring Boot REST API
│   ├── pom.xml              # Maven dependencies & build configuration
│   ├── mvnw                 # Maven wrapper script
│   └── src/
│       ├── main/java/com/opspilot/
│       │   ├── config/      # Security, JWT, Data Initializer
│       │   ├── controller/  # Auth, Project, Deployment REST controllers
│       │   ├── dto/         # Request & Response DTOs
│       │   ├── entity/      # User, Role, Project, Deployment JPA entities
│       │   ├── exception/   # Global Exception Handler & Custom Exceptions
│       │   ├── repository/ # Spring Data JPA repositories
│       │   └── service/    # Auth, Project, Deployment business logic
│       └── test/java/com/opspilot/ # Unit tests
└── frontend/                # React 18 + Vite SPA
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── components/      # SidebarLayout and shared components
        ├── context/         # AuthContext provider
        ├── pages/           # Login, Signup, Dashboard, Projects
        └── services/        # API service layer
```

---

## Quick Start Guide

### 1. Database Setup (PostgreSQL)

Start PostgreSQL using Docker Compose:

```bash
docker compose up -d
```

*Database connection credentials:*
- **Host**: `localhost:5432`
- **Database**: `opspilot`
- **User**: `opspilot`
- **Password**: `opspilot`

---

### 2. Backend Setup (Spring Boot)

Navigate to the `/backend` directory and start the server:

```bash
cd backend
./mvnw spring-boot:run
```

*The backend REST API will run on `http://localhost:8080`.*

To run unit tests:

```bash
./mvnw test
```

---

### 3. Frontend Setup (React + Vite)

Navigate to the `/frontend` directory, install dependencies, and start the development server:

```bash
cd frontend
npm install
npm run dev
```

*The web application will run on `http://localhost:5173`.*

---

## API Endpoints

### Authentication & RBAC
- `POST /api/auth/register` — Register a new user (`Developer`, `DevOps Engineer`, or `Administrator`).
- `POST /api/auth/login` — Authenticate user credentials and receive a JWT token.

### Project Management
- `GET /api/projects` — List accessible projects.
- `GET /api/projects/{id}` — Get single project details.
- `POST /api/projects` — Create a new project.
- `PUT /api/projects/{id}` — Update a project (*Owner or Administrator only*).
- `DELETE /api/projects/{id}` — Delete a project (*Owner or Administrator only*).

### Deployment Center
- `POST /api/projects/{projectId}/deployments` — Trigger a deployment (`Dev`, `Staging`, `Production`). Simulates pipeline status progression: `Draft` → `Building` → `Deploying` → `Running`.
- `GET /api/projects/{projectId}/deployments` — List deployment execution history.
