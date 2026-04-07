import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Events CRUD (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.event.deleteMany();
  });

  const validEvent = {
    title: 'Integration Test Event',
    startUtc: '2026-06-15T10:00:00.000Z',
    endUtc: '2026-06-15T11:00:00.000Z',
    timezone: 'America/New_York',
  };

  describe('POST /api/v1/events', () => {
    it('should create an event and return it wrapped in { data }', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent)
        .expect(HttpStatus.CREATED);

      expect(res.body.data).toMatchObject({
        title: validEvent.title,
        startUtc: validEvent.startUtc,
        endUtc: validEvent.endUtc,
        timezone: validEvent.timezone,
      });
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.createdAt).toBeDefined();
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({ ...validEvent, title: '' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 when endUtc is before startUtc', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({
          ...validEvent,
          startUtc: '2026-06-15T12:00:00.000Z',
          endUtc: '2026-06-15T10:00:00.000Z',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.statusCode).toBe(400);
    });

    it('should return 400 for invalid timezone', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({ ...validEvent, timezone: 'Not/A/Timezone' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for invalid datetime format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({ ...validEvent, startUtc: 'not-a-date' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 409 when events overlap', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent)
        .expect(HttpStatus.CREATED);

      const res = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({
          ...validEvent,
          title: 'Overlapping Event',
          startUtc: '2026-06-15T10:30:00.000Z',
          endUtc: '2026-06-15T11:30:00.000Z',
        })
        .expect(HttpStatus.CONFLICT);

      expect(res.body.statusCode).toBe(409);
      expect(res.body.conflictingEvents).toHaveLength(1);
      expect(res.body.conflictingEvents[0].title).toBe(validEvent.title);
    });

    it('should allow adjacent events (end === start)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({
          ...validEvent,
          title: 'Adjacent Event',
          startUtc: '2026-06-15T11:00:00.000Z',
          endUtc: '2026-06-15T12:00:00.000Z',
        })
        .expect(HttpStatus.CREATED);
    });
  });

  describe('GET /api/v1/events', () => {
    it('should return events within the query range', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      const res = await request(app.getHttpServer())
        .get('/api/v1/events')
        .query({ from: '2026-06-15T00:00:00.000Z', to: '2026-06-16T00:00:00.000Z' })
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe(validEvent.title);
    });

    it('should return empty array when no events in range', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      const res = await request(app.getHttpServer())
        .get('/api/v1/events')
        .query({ from: '2026-07-01T00:00:00.000Z', to: '2026-07-02T00:00:00.000Z' })
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveLength(0);
    });

    it('should return 400 when query params are missing', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/events')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/v1/events/:id', () => {
    it('should return a single event by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/events/${created.body.data.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.id).toBe(created.body.data.id);
      expect(res.body.data.title).toBe(validEvent.title);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/events/00000000-0000-0000-0000-000000000000')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/events/not-a-uuid')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('PATCH /api/v1/events/:id', () => {
    it('should update event title', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/events/${created.body.data.id}`)
        .send({ title: 'Updated Title' })
        .expect(HttpStatus.OK);

      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.startUtc).toBe(validEvent.startUtc);
    });

    it('should update event times', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      const newStart = '2026-06-15T14:00:00.000Z';
      const newEnd = '2026-06-15T15:00:00.000Z';

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/events/${created.body.data.id}`)
        .send({ startUtc: newStart, endUtc: newEnd })
        .expect(HttpStatus.OK);

      expect(res.body.data.startUtc).toBe(newStart);
      expect(res.body.data.endUtc).toBe(newEnd);
    });

    it('should return 409 when update creates overlap', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      const second = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({
          ...validEvent,
          title: 'Second Event',
          startUtc: '2026-06-15T14:00:00.000Z',
          endUtc: '2026-06-15T15:00:00.000Z',
        });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/events/${second.body.data.id}`)
        .send({
          startUtc: '2026-06-15T10:30:00.000Z',
          endUtc: '2026-06-15T11:30:00.000Z',
        })
        .expect(HttpStatus.CONFLICT);

      expect(res.body.conflictingEvents).toHaveLength(1);
    });

    it('should allow updating event without overlap against itself', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      await request(app.getHttpServer())
        .patch(`/api/v1/events/${created.body.data.id}`)
        .send({ startUtc: '2026-06-15T10:15:00.000Z' })
        .expect(HttpStatus.OK);
    });

    it('should return 404 for non-existent event', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/events/00000000-0000-0000-0000-000000000000')
        .send({ title: 'Ghost' })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/v1/events/:id', () => {
    it('should delete an existing event', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      await request(app.getHttpServer())
        .delete(`/api/v1/events/${created.body.data.id}`)
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .get(`/api/v1/events/${created.body.data.id}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 when deleting non-existent event', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/events/00000000-0000-0000-0000-000000000000')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Overlap edge cases', () => {
    it('should detect overlap when new event fully contains existing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({
          ...validEvent,
          title: 'Containing Event',
          startUtc: '2026-06-15T09:00:00.000Z',
          endUtc: '2026-06-15T12:00:00.000Z',
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('should detect overlap when new event is fully inside existing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({
          ...validEvent,
          title: 'Inner Event',
          startUtc: '2026-06-15T10:15:00.000Z',
          endUtc: '2026-06-15T10:45:00.000Z',
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('should report multiple conflicts', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({
          ...validEvent,
          title: 'Afternoon Event',
          startUtc: '2026-06-15T11:30:00.000Z',
          endUtc: '2026-06-15T12:30:00.000Z',
        });

      const res = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({
          ...validEvent,
          title: 'Big Spanning Event',
          startUtc: '2026-06-15T09:00:00.000Z',
          endUtc: '2026-06-15T13:00:00.000Z',
        })
        .expect(HttpStatus.CONFLICT);

      expect(res.body.conflictingEvents).toHaveLength(2);
    });

    it('should allow events on different days', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({
          ...validEvent,
          title: 'Next Day Event',
          startUtc: '2026-06-16T10:00:00.000Z',
          endUtc: '2026-06-16T11:00:00.000Z',
        })
        .expect(HttpStatus.CREATED);
    });

    it('should free up the slot after deleting an event', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(validEvent);

      await request(app.getHttpServer())
        .delete(`/api/v1/events/${created.body.data.id}`)
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({ ...validEvent, title: 'Reclaimed Slot' })
        .expect(HttpStatus.CREATED);
    });
  });
});
