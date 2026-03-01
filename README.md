# Recipes

A full-stack recipe management application with AI-assisted recipe importing.

**Stack:** Spring Boot 3.3.5 · Java 21 · PostgreSQL 16 · React 19 · TypeScript · Vite · Tailwind CSS 4 · Auth0 · Caddy

---

## Local Development

### Prerequisites

| Tool | Version |
|------|---------|
| Java | 21 |
| Node.js | 20+ |
| Docker | any recent version |

### 1. Clone and configure

```bash
git clone <repo-url>
cd recipes
```

Create `application-local.yaml` in the project root (gitignored) with your Auth0 credentials:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://<your-tenant>.eu.auth0.com/
          audiences:
            - https://<your-api-audience>
```

Create `recipe-ui/.env.local` (gitignored) with your Auth0 frontend credentials:

```
VITE_AUTH0_DOMAIN=<your-tenant>.eu.auth0.com
VITE_AUTH0_CLIENT_ID=<your-client-id>
VITE_AUTH0_AUDIENCE=https://<your-api-audience>
```

### 2. Start the database

```bash
docker compose up
```

PostgreSQL starts on `localhost:5432`. Database migrations run automatically on backend startup via Flyway.

### 3. Start the backend

```bash
./gradlew bootRun
```

Serves on `http://localhost:8080`. Spring Boot Docker Compose integration starts the database automatically if it isn't already running.

### 4. Start the frontend

```bash
cd recipe-ui
npm install
npm run dev
```

Serves on `http://localhost:5173`. Vite proxies all `/api/*` requests to the backend.

---

## Build & Test

### Backend

```bash
./gradlew build          # Compile, test, and produce JAR
./gradlew test           # Run tests only
./gradlew bootJar        # Build executable JAR (skipping tests: add -x test)
```

Integration tests require a running PostgreSQL instance (start with `docker compose up`).

### Frontend

```bash
cd recipe-ui
npm run build            # TypeScript compile + Vite production bundle
npm run test             # Run Vitest
npm run lint             # ESLint
```

---

## Production Deployment

The production stack runs as three Docker containers behind Caddy:

```
Internet → Caddy (:443) → /api/*  → Spring Boot (:8080)
                        → /*      → React SPA (static files)
```

Caddy handles TLS automatically via Let's Encrypt.

### 1. Prepare the server

Install Docker and Docker Compose on your Ubuntu VPS:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out and back in after this
```

Point your domain's DNS A record at the server's IP address and ensure ports 80 and 443 are open in your firewall.

### 2. Configure secrets

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

```
# Caddy — use your domain name for auto-HTTPS, or :80 for local HTTP testing
SERVER_HOST=recipes.example.com

# Database
DB_USER=myuser
DB_PASSWORD=<strong-password>
DB_NAME=mydatabase

# Auth0 — backend JWT validation
AUTH0_ISSUER_URI=https://<your-tenant>.eu.auth0.com/
AUTH0_AUDIENCE=https://<your-api-audience>

# Auth0 — baked into the frontend bundle at build time
VITE_AUTH0_DOMAIN=<your-tenant>.eu.auth0.com
VITE_AUTH0_CLIENT_ID=<your-client-id>
VITE_AUTH0_AUDIENCE=https://<your-api-audience>

# Anthropic (for AI recipe importing)
ANTHROPIC_API_KEY=sk-ant-...
```

> **Tip:** If you use 1Password, you can inject secrets at runtime instead of writing them to disk:
> ```bash
> op run --env-file=.env -- docker compose -f compose.prod.yaml up -d
> ```

### 3. Build and run

```bash
docker compose -f compose.prod.yaml up -d --build
```

This builds both images (Spring Boot JAR + React bundle baked into Caddy), starts all three services, and runs database migrations automatically on first boot.

Caddy will obtain a TLS certificate on the first request. Certificates are stored in the `caddy_data` volume and renewed automatically.

### 4. Updating

```bash
git pull
docker compose -f compose.prod.yaml up -d --build
```

Running containers are replaced with zero manual steps. The database is never touched unless a new Flyway migration is present.

### 5. Useful commands

```bash
# View logs
docker compose -f compose.prod.yaml logs -f

# View logs for a single service
docker compose -f compose.prod.yaml logs -f app

# Stop everything
docker compose -f compose.prod.yaml down

# Stop and delete all data (destructive — wipes the database)
docker compose -f compose.prod.yaml down -v
```

---

## Auth0 Setup

Two Auth0 applications are required:

**API (Machine-to-Machine):**
- Create an API with the audience `https://<your-api-audience>`
- Note the issuer URI (`https://<your-tenant>.auth0.com/`)

**Single Page Application:**
- Set Allowed Callback URLs to your domain (e.g. `https://recipes.example.com`)
- Set Allowed Logout URLs and Allowed Web Origins to the same
- Note the Client ID

---

## Project Structure

```
recipes/
├── src/                        # Java backend (Spring Boot)
│   ├── main/java/.../
│   │   ├── recipe/             # Recipe domain
│   │   ├── ingredient/         # Ingredient domain
│   │   ├── unit/               # Unit of measurement domain
│   │   ├── user/               # Auth0 user sync
│   │   └── SecurityConfig.java # JWT auth configuration
│   └── main/resources/
│       ├── application.yaml    # Spring config (env-var driven)
│       └── db/migration/       # Flyway migrations (V1–V8)
├── recipe-ui/                  # React/TypeScript frontend
│   └── src/
│       ├── recipe/             # Recipe pages and components
│       ├── Ingredient/         # Ingredient search and management
│       ├── auth/               # Auth0 integration
│       ├── apiHooks.ts         # API hooks
│       └── main.tsx            # Routes and app entry point
├── Dockerfile                  # Spring Boot image
├── recipe-ui/Dockerfile        # React + Caddy image
├── Caddyfile                   # Caddy reverse proxy config
├── compose.yaml                # Local dev (PostgreSQL only)
├── compose.prod.yaml           # Production (Caddy + app + db)
└── .env.example                # Environment variable template
```
