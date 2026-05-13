# Calendar Scheduling App

A production-quality, single-user calendar scheduling application with CRUD events, daily/weekly/monthly views, overlap prevention, and timezone handling.

## Tech Stack

| Layer          | Technology                                                    |
| -------------- | ------------------------------------------------------------- |
| Frontend       | React 19, TypeScript, Material UI 7, Zustand, TanStack Query |
| Backend        | Node.js, NestJS 11, TypeScript                                |
| Database       | PostgreSQL 16, Prisma ORM 7                                   |
| Infrastructure | Docker, Docker Compose                                        |
| Timezone       | date-fns-tz                                                   |
| Validation     | Zod                                                           |

## Prerequisites

- Node.js **22+** recommended (matches Docker images and satisfies Prisma tooling `engines`; Node 20 may log `EBADENGINE` warnings but usually still works locally)
- npm 9+
- Docker with the **Compose** plugin (`docker compose`), or Docker Compose v2 standalone

## Quick Start (Local Development)

### 1. Install dependencies

```bash
npm install
```

### 2. Start the database

**Option A — Single Docker container (`user` / `challenge_db`):**

```bash
docker run -d --name calendar-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=challenge_db \
  -p 5432:5432 postgres:16
```

Set `DATABASE_URL` in `backend/.env` to `postgresql://user:password@localhost:5432/challenge_db?schema=public` (not the compose URL in `.env.example`).

**Option B — Compose database only (recommended for this repo):**

```bash
docker compose up -d db
```

Use `DATABASE_URL="postgresql://calendar:calendar@localhost:5432/calendar"` (see `backend/.env.example`).

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` if your database credentials or port differ. The **default backend port is 3001** (see `PORT`); the Vite dev server proxies `/api` to the same port.

### 4. Push schema & seed data

```bash
npm run db:push --workspace=backend
npm run db:seed --workspace=backend
```

### 5. Run development servers

In separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api/v1` (or whatever you set in `PORT`)

## Docker (Full Stack)

To run the entire stack (database, backend, frontend) with Docker:

```bash
docker compose up --build
```

After changing Dockerfiles or app code, rebuild images with `docker compose build --no-cache` if containers still run an older layer cache.

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api/v1`

The backend container runs **`prisma db push`** on startup, then **`prisma/seed.ts`**. Seeded calendar days use **`SEED_TIMEZONE`** (defaults to **`UTC`** in Compose). Set it to the same IANA zone as your browser — run `Intl.DateTimeFormat().resolvedOptions().timeZone` in DevTools — e.g. in a repo **`.env`** file used by Compose: `SEED_TIMEZONE=Europe/Warsaw`. The seed also adds a few **“Demo — next +Nh”** events from the seed time so you still see data if the timezone is wrong.

Seeding **clears and recreates** `events`—fine for local demos; set **`SKIP_AUTO_SEED=1`** on the backend service to skip that step when you need data to persist across restarts.

For repeatable production deploys, prefer Prisma migrations and `prisma migrate deploy` once you introduce migration files.

During **`docker compose build`**, backend/frontend image builds run `npm install` with **`NPM_CONFIG_LOGLEVEL=error`** so harmless transitive **deprecated** messages (for example from Jest’s dependency tree) do not flood the log. Your **local** `npm install` may still print them.

Images use **Node.js 22** so Prisma’s `engines` check does not emit `EBADENGINE` during `npm install` inside the build.

## Security & dependencies

Run `npm audit` at the repo root to check the whole workspace. **High/critical issues in app dependencies** (for example `axios`) should be patched via `npm audit fix` and version bumps in `package.json` as needed.

You may still see **moderate** findings for `@hono/node-server` pulled in by the **`prisma` CLI** (`@prisma/dev`). That code is used for Prisma developer tools, not for the running Nest API. Do **not** use `npm audit fix --force` for Prisma: it can pin an older major release. Re-run audits after upgrading `prisma` / `@prisma/client` when new CLI releases address the advisory.

## API Endpoints

| Method   | Endpoint             | Description                          |
| -------- | -------------------- | ------------------------------------ |
| `GET`    | `/api/v1/events`     | List events (query: `from`, `to`)    |
| `GET`    | `/api/v1/events/:id` | Get single event                     |
| `POST`   | `/api/v1/events`     | Create event                         |
| `PATCH`  | `/api/v1/events/:id` | Update event                         |
| `DELETE` | `/api/v1/events/:id` | Delete event                         |

### Request/Response Example

**Create Event:**

```json
POST /api/v1/events
{
  "title": "Team Standup",
  "startUtc": "2026-04-07T14:00:00.000Z",
  "endUtc": "2026-04-07T14:30:00.000Z",
  "timezone": "America/New_York"
}
```

## Testing

```bash
# Backend unit tests (Jest)
npm test --workspace=backend

# Frontend unit tests (Vitest)
npm test --workspace=frontend

# Backend E2E tests (requires running database)
npm run test:e2e --workspace=backend
```

## Environment Variables

| Variable         | Default                                          | Description                  |
| ---------------- | ------------------------------------------------ | ---------------------------- |
| `DATABASE_URL`   | See `backend/.env.example`                       | PostgreSQL connection string |
| `PORT`           | `3001`                                           | Backend server port          |
| `CORS_ORIGIN`    | `http://localhost:5173`                          | Allowed CORS origin          |
| `BODY_LIMIT`     | `100kb`                                          | Max request body size        |
| `THROTTLE_TTL`   | `60000`                                          | Rate limit window (ms)       |
| `THROTTLE_LIMIT` | `100`                                            | Max requests per window      |

Frontend `VITE_API_URL` (optional in dev) defaults to relative `/api/v1` when proxied by Vite; set it explicitly if the API is on another host/port.

## Project Structure

```
├── docker-compose.yml
├── package.json              # Root workspace config
├── backend/                  # NestJS API
│   ├── prisma/               # Schema, migrations & seed
│   └── src/
│       ├── events/           # CRUD module (controller, service, repository)
│       ├── prisma/           # PrismaService (database connection)
│       ├── common/           # Filters, interceptors, pipes
│       └── shared/           # Zod schemas, constants
├── frontend/                 # React SPA
│   └── src/
│       ├── components/calendar/  # Calendar views & UI components
│       ├── hooks/                # React Query hooks
│       ├── stores/               # Zustand state management
│       ├── utils/                # Date, timezone, color & validation utilities
│       ├── theme/                # MUI theme & design tokens
│       └── types/                # TypeScript type definitions
```
