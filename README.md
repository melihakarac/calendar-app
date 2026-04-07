# Calendar Scheduling App

A production-quality, single-user calendar scheduling application with CRUD events, daily/weekly/monthly views, overlap prevention, and timezone handling.

## Tech Stack

| Layer          | Technology                                                     |
| -------------- | -------------------------------------------------------------- |
| Frontend       | React 19, TypeScript, Material UI 7, Zustand, TanStack Query  |
| Backend        | Node.js, NestJS 11, TypeScript                                |
| Database       | PostgreSQL 16, Prisma ORM 7                                   |
| Infrastructure | Docker, docker-compose                                        |
| Timezone       | date-fns-tz                                                    |
| Validation     | Zod                                                            |

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm 9+

## Quick Start

### 1. Start the database

```bash
docker-compose up -d db
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

```bash
cd backend
cp .env.example .env
npx prisma db push
npm run db:seed
cd ..
```

### 4. Run development servers

In separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:3001/api/v1`.

## Docker (Full Stack)

To run everything with Docker:

```bash
docker-compose up --build
```

This starts PostgreSQL, the backend, and the frontend. Access the app at `http://localhost:5173`.

## API Endpoints

| Method   | Endpoint           | Description        |
| -------- | ------------------ | ------------------ |
| `GET`    | `/api/v1/events`   | List events        |
| `GET`    | `/api/v1/events/:id` | Get single event |
| `POST`   | `/api/v1/events`   | Create event       |
| `PATCH`  | `/api/v1/events/:id` | Update event     |
| `DELETE` | `/api/v1/events/:id` | Delete event     |

## Testing

```bash
cd backend
npm test
```

## Project Structure

```
├── docker-compose.yml
├── backend/           # NestJS API
│   ├── prisma/        # Schema & seed
│   └── src/
│       ├── events/    # CRUD module
│       └── common/    # Filters, interceptors, pipes
├── frontend/          # React SPA
│   └── src/
│       ├── components/calendar/  # Calendar views
│       ├── hooks/                # React Query hooks
│       ├── stores/               # Zustand state
│       └── theme/                # MUI theme
```
