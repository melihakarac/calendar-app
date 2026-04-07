import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EventsRepository } from './events.repository';
import { CreateEventDto, UpdateEventDto } from '../shared/schemas/event.schema';
import { Event } from '../../generated/prisma/client';

@Injectable()
export class EventsService {
  constructor(private readonly repository: EventsRepository) {}

  async findAll(from: string, to: string): Promise<Event[]> {
    return this.repository.findAll(new Date(from), new Date(to));
  }

  async findById(id: string): Promise<Event> {
    const event = await this.repository.findById(id);
    if (!event) {
      throw new NotFoundException(`Event with id "${id}" not found`);
    }
    return event;
  }

  async create(dto: CreateEventDto): Promise<Event> {
    const startUtc = new Date(dto.startUtc);
    const endUtc = new Date(dto.endUtc);

    await this.checkOverlap(startUtc, endUtc);

    return this.repository.create({
      title: dto.title,
      startUtc,
      endUtc,
      timezone: dto.timezone,
    });
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const existing = await this.findById(id);

    const startUtc = dto.startUtc ? new Date(dto.startUtc) : existing.startUtc;
    const endUtc = dto.endUtc ? new Date(dto.endUtc) : existing.endUtc;

    if (endUtc <= startUtc) {
      throw new ConflictException('End time must be after start time');
    }

    await this.checkOverlap(startUtc, endUtc, id);

    return this.repository.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.startUtc && { startUtc }),
      ...(dto.endUtc && { endUtc }),
      ...(dto.timezone !== undefined && { timezone: dto.timezone }),
    });
  }

  async delete(id: string): Promise<Event> {
    await this.findById(id);
    return this.repository.delete(id);
  }

  private async checkOverlap(
    startUtc: Date,
    endUtc: Date,
    excludeId?: string,
  ): Promise<void> {
    const conflicts = await this.repository.findOverlapping(startUtc, endUtc, excludeId);
    if (conflicts.length > 0) {
      const names = conflicts.map((e) => `"${e.title}"`).join(', ');
      throw new ConflictException({
        statusCode: 409,
        message: `Event overlaps with ${names}`,
        conflictingEvents: conflicts.map((e) => ({
          id: e.id,
          title: e.title,
          startUtc: e.startUtc.toISOString(),
          endUtc: e.endUtc.toISOString(),
        })),
      });
    }
  }
}
