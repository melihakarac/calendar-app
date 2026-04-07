# Calendar Scheduling App

A production-quality, single-user calendar scheduling application with CRUD events, daily/weekly/monthly views, overlap prevention, and timezone handling.

## Tech Stack

| Layer          | Technology                                                    |
| -------------- | ------------------------------------------------------------- |
| Frontend       | React 19, TypeScript, Material UI 7, Zustand, TanStack Query |
| Backend        | Node.js, NestJS 11, TypeScript                                |
| Database       | PostgreSQL 16, Prisma ORM 7                                   |
| Infrastructure | Docker, docker-compose                                        |
| Timezone       | date-fns-tz                                                   |
| Validation     | Zod                                                           |

## Prerequisites

- Node.js 20+
- npm 9+
- Docker & Docker Compose (for the database, or a local PostgreSQL 16 instance)

## Quick Start (Local Development)

### 1. Install dependencies

```bash
npm install
```

### 2. Start the database

**Option A — Docker (recommended):**

```bash
docker run -d --name calendar-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=challenge_db \
  -p 5432:5432 postgres:16
```

**Option B — docker-compose (database only):**

```bash
docker-compose up -d db
```

> If using Option B, update `backend/.env` to match the docker-compose credentials:
> `DATABASE_URL="postgresql://calendar:calendar@localhost:5432/calendar"`

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` if your database credentials differ from the defaults.

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
- Backend API: `http://localhost:3000/api/v1`

## Docker (Full Stack)

To run the entire stack (database, backend, frontend) with Docker:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api/v1`

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
| `DATABASE_URL`   | `postgresql://user:password@localhost:5432/...`   | PostgreSQL connection string |
| `PORT`           | `3000`                                           | Backend server port          |
| `CORS_ORIGIN`    | `http://localhost:5173`                          | Allowed CORS origin          |
| `BODY_LIMIT`     | `100kb`                                          | Max request body size        |
| `THROTTLE_TTL`   | `60000`                                          | Rate limit window (ms)       |
| `THROTTLE_LIMIT` | `100`                                            | Max requests per window      |

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
