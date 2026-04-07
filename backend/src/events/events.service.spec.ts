import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';

const mockEvent = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test Event',
  startUtc: new Date('2025-06-15T10:00:00.000Z'),
  endUtc: new Date('2025-06-15T11:00:00.000Z'),
  timezone: 'America/New_York',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('EventsService', () => {
  let service: EventsService;
  let repository: jest.Mocked<EventsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: EventsRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findOverlapping: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repository = module.get(EventsRepository);
  });

  describe('create', () => {
    it('should create an event when no overlap exists', async () => {
      repository.findOverlapping.mockResolvedValue([]);
      repository.create.mockResolvedValue(mockEvent);

      const result = await service.create({
        title: 'New Event',
        startUtc: '2025-06-15T14:00:00.000Z',
        endUtc: '2025-06-15T15:00:00.000Z',
        timezone: 'America/New_York',
      });

      expect(result).toEqual(mockEvent);
      expect(repository.findOverlapping).toHaveBeenCalledWith(
        new Date('2025-06-15T14:00:00.000Z'),
        new Date('2025-06-15T15:00:00.000Z'),
        undefined,
      );
    });

    it('should throw ConflictException when overlap exists', async () => {
      repository.findOverlapping.mockResolvedValue([mockEvent]);

      await expect(
        service.create({
          title: 'Overlapping Event',
          startUtc: '2025-06-15T10:30:00.000Z',
          endUtc: '2025-06-15T11:30:00.000Z',
          timezone: 'America/New_York',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should detect overlap when new event completely contains existing', async () => {
      repository.findOverlapping.mockResolvedValue([mockEvent]);

      await expect(
        service.create({
          title: 'Containing Event',
          startUtc: '2025-06-15T09:00:00.000Z',
          endUtc: '2025-06-15T12:00:00.000Z',
          timezone: 'America/New_York',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should NOT detect overlap for adjacent events (end equals start)', async () => {
      repository.findOverlapping.mockResolvedValue([]);
      repository.create.mockResolvedValue({
        ...mockEvent,
        startUtc: new Date('2025-06-15T11:00:00.000Z'),
        endUtc: new Date('2025-06-15T12:00:00.000Z'),
      });

      const result = await service.create({
        title: 'Adjacent Event',
        startUtc: '2025-06-15T11:00:00.000Z',
        endUtc: '2025-06-15T12:00:00.000Z',
        timezone: 'America/New_York',
      });

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update when no overlap exists', async () => {
      const updatedEvent = { ...mockEvent, title: 'Updated Title' };
      repository.findById.mockResolvedValue(mockEvent);
      repository.findOverlapping.mockResolvedValue([]);
      repository.update.mockResolvedValue(updatedEvent);

      const result = await service.update(mockEvent.id, { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException for non-existent event', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should exclude self when checking overlap on update', async () => {
      repository.findById.mockResolvedValue(mockEvent);
      repository.findOverlapping.mockResolvedValue([]);
      repository.update.mockResolvedValue(mockEvent);

      await service.update(mockEvent.id, {
        startUtc: '2025-06-15T10:30:00.000Z',
        endUtc: '2025-06-15T11:30:00.000Z',
      });

      expect(repository.findOverlapping).toHaveBeenCalledWith(
        new Date('2025-06-15T10:30:00.000Z'),
        new Date('2025-06-15T11:30:00.000Z'),
        mockEvent.id,
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing event', async () => {
      repository.findById.mockResolvedValue(mockEvent);
      repository.delete.mockResolvedValue(mockEvent);

      const result = await service.delete(mockEvent.id);

      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException for non-existent event', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
