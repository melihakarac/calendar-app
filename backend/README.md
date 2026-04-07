# Calendar App — Backend

NestJS REST API for a single-user calendar scheduling application with overlap prevention and timezone handling.

## Architecture

```
src/
├── main.ts                          # Bootstrap, middleware (Helmet, CORS, body limit)
├── app.module.ts                    # Root module, ThrottlerGuard
├── prisma/
│   ├── prisma.module.ts             # Global Prisma module
│   └── prisma.service.ts            # PrismaClient with PrismaPg adapter
├── events/
│   ├── events.module.ts             # Feature module
│   ├── events.controller.ts         # HTTP layer — routes, param parsing
│   ├── events.service.ts            # Business logic — validation, overlap checks
│   └── events.repository.ts         # Data access — thin Prisma wrapper
├── shared/
│   └── schemas/
│       └── event.schema.ts          # Zod schemas (create, update, query)
└── common/
    ├── filters/
    │   └── http-exception.filter.ts # Global error envelope
    ├── interceptors/
    │   └── transform.interceptor.ts # Wraps all responses in { data: T }
    └── pipes/
        └── zod-validation.pipe.ts   # Zod-based request validation
```

### Layered Separation

| Layer        | Responsibility                                                  |
| ------------ | --------------------------------------------------------------- |
| Controller   | HTTP concerns only: parsing params/body, calling service        |
| Service      | Business logic: validation, overlap detection, timezone handling |
| Repository   | Data access: Prisma queries, no business logic                  |

## API Reference

**Base URL:** `/api/v1`

### Endpoints

| Method   | Path             | Description         | Auth |
| -------- | ---------------- | ------------------- | ---- |
| `GET`    | `/events`        | List events in range | —    |
| `GET`    | `/events/:id`    | Get event by ID      | —    |
| `POST`   | `/events`        | Create event         | —    |
| `PATCH`  | `/events/:id`    | Update event         | —    |
| `DELETE` | `/events/:id`    | Delete event         | —    |

### Request / Response Shapes

**Create Event** `POST /events`

```json
{
  "title": "Team Standup",
  "startUtc": "2026-06-15T14:00:00.000Z",
  "endUtc": "2026-06-15T14:30:00.000Z",
  "timezone": "America/New_York"
}
```

**Success Response** (all endpoints)

```json
{
  "data": {
    "id": "uuid",
    "title": "Team Standup",
    "startUtc": "2026-06-15T14:00:00.000Z",
    "endUtc": "2026-06-15T14:30:00.000Z",
    "timezone": "America/New_York",
    "createdAt": "2026-06-15T10:00:00.000Z",
    "updatedAt": "2026-06-15T10:00:00.000Z"
  }
}
```

**Validation Error** `400`

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "title": ["Title is required"],
    "endUtc": ["End time must be after start time"]
  }
}
```

**Overlap Conflict** `409`

```json
{
  "statusCode": 409,
  "message": "Event overlaps with \"Team Standup\"",
  "conflictingEvents": [
    {
      "id": "uuid",
      "title": "Team Standup",
      "startUtc": "2026-06-15T14:00:00.000Z",
      "endUtc": "2026-06-15T14:30:00.000Z"
    }
  ]
}
```

### Query Parameters

`GET /events` requires:

| Param | Type              | Description                  |
| ----- | ----------------- | ---------------------------- |
| `from` | ISO 8601 datetime | Start of range (UTC)         |
| `to`   | ISO 8601 datetime | End of range (UTC)           |

## Validation

All request validation uses **Zod** schemas via a custom `ZodValidationPipe`:

- `title`: 1–255 chars, trimmed
- `startUtc` / `endUtc`: Valid ISO 8601 UTC datetimes
- `endUtc` must be after `startUtc`
- `timezone`: Valid IANA timezone string (validated via `Intl.DateTimeFormat`)

## Overlap Detection

Server-side overlap detection runs **before every create and update**. It uses the standard interval overlap formula:

```sql
SELECT * FROM events
WHERE id != $excludeId
  AND start_utc < $newEndUtc
  AND end_utc   > $newStartUtc;
```

The database has a composite index on `(start_utc, end_utc)` for performance. Adjacent events (where one ends exactly when another starts) are allowed.

## Security

| Feature           | Implementation                              |
| ----------------- | ------------------------------------------- |
| Helmet            | Security headers via `helmet` middleware     |
| CORS              | Restricted to frontend origin               |
| Rate limiting     | `@nestjs/throttler` — 100 requests/minute   |
| Body size limit   | `express.json({ limit: '100kb' })`          |
| Input sanitization| Zod trims strings, enforces max length      |
| SQL injection     | Prisma parameterized queries                |

## Database

**PostgreSQL 16** with **Prisma ORM 7** using the `@prisma/adapter-pg` driver adapter.

### Schema

```prisma
model Event {
  id        String   @id @default(uuid())
  title     String   @db.VarChar(255)
  startUtc  DateTime @map("start_utc")
  endUtc    DateTime @map("end_utc")
  timezone  String   @db.VarChar(64)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([startUtc, endUtc])
  @@map("events")
}
```

### Commands

```bash
npm run db:generate    # Generate Prisma Client
npm run db:push        # Push schema to database
npm run db:migrate     # Create migration
npm run db:seed        # Seed sample events
```

## Testing

### Unit Tests

```bash
npm test               # Run unit tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
```

Tests cover overlap detection edge cases:
- Overlapping events (partial, full containment)
- Adjacent events (allowed)
- Self-exclusion on update
- CRUD operations with not-found handling

### Integration Tests (E2E)

```bash
npm run test:e2e       # Requires running PostgreSQL
```

Full HTTP CRUD flow tests (25 tests):
- POST: creation, validation (title, dates, timezone, format), overlap (409), adjacent (allowed)
- GET: list with range query, empty results, missing params
- GET by ID: found, not found (404), invalid UUID (400)
- PATCH: title update, time update, overlap on update, self-overlap, not found
- DELETE: success, not found
- Edge cases: full containment, inner events, multiple conflicts, cross-day, slot reuse after delete

## Development

```bash
npm run start:dev      # Watch mode with auto-reload
npm run start:debug    # Debug mode
npm run build          # Production build
npm run start:prod     # Run production build
```
