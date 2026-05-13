import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EventsRepository } from './events.repository';
import { CreateEventDto, UpdateEventDto } from '../shared/schemas/event.schema';
import { Event } from '../../generated/prisma/client';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface TimeRange {
  start: Date;
  end: Date;
}

export interface ExpandedEvent {
  id: string;
  title: string;
  startUtc: Date;
  endUtc: Date;
  timezone: string;
  isRecurring: boolean;
  recurrenceEndUtc: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function generateOccurrences(
  event: Event,
  rangeStart?: Date,
  rangeEnd?: Date,
): TimeRange[] {
  if (!event.isRecurring || !event.recurrenceEndUtc) {
    return [{ start: event.startUtc, end: event.endUtc }];
  }

  const duration = event.endUtc.getTime() - event.startUtc.getTime();
  const recEnd = event.recurrenceEndUtc;
  const results: TimeRange[] = [];

  let currentStart = new Date(event.startUtc);
  while (currentStart <= recEnd) {
    const currentEnd = new Date(currentStart.getTime() + duration);

    if (
      !rangeStart ||
      !rangeEnd ||
      (currentEnd > rangeStart && currentStart < rangeEnd)
    ) {
      results.push({ start: new Date(currentStart), end: currentEnd });
    }

    if (rangeEnd && currentStart >= rangeEnd) break;

    currentStart = new Date(currentStart.getTime() + WEEK_MS);
  }

  return results;
}

function expandForRange(event: Event, from: Date, to: Date): ExpandedEvent[] {
  const occurrences = generateOccurrences(event, from, to);
  return occurrences.map((occ) => ({
    id: event.id,
    title: event.title,
    startUtc: occ.start,
    endUtc: occ.end,
    timezone: event.timezone,
    isRecurring: event.isRecurring,
    recurrenceEndUtc: event.recurrenceEndUtc,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  }));
}

function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && a.end > b.start;
}

@Injectable()
export class EventsService {
  constructor(private readonly repository: EventsRepository) {}

  async findAll(from: string, to: string): Promise<ExpandedEvent[]> {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const events = await this.repository.findAll(fromDate, toDate);

    const expanded: ExpandedEvent[] = [];
    for (const event of events) {
      expanded.push(...expandForRange(event, fromDate, toDate));
    }

    expanded.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
    return expanded;
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
    const isRecurring = dto.isRecurring ?? false;
    const recurrenceEndUtc = dto.recurrenceEndUtc
      ? new Date(dto.recurrenceEndUtc)
      : undefined;

    const newOccurrences = generateOccurrences({
      startUtc,
      endUtc,
      isRecurring,
      recurrenceEndUtc: recurrenceEndUtc ?? null,
    } as Event);

    await this.checkRecurringOverlap(newOccurrences);

    return this.repository.create({
      title: dto.title,
      startUtc,
      endUtc,
      timezone: dto.timezone,
      ...(isRecurring && { isRecurring }),
      ...(recurrenceEndUtc && { recurrenceEndUtc }),
    });
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const existing = await this.findById(id);

    const startUtc = dto.startUtc ? new Date(dto.startUtc) : existing.startUtc;
    const endUtc = dto.endUtc ? new Date(dto.endUtc) : existing.endUtc;
    const isRecurring = dto.isRecurring ?? existing.isRecurring;
    const recurrenceEndUtc =
      dto.recurrenceEndUtc !== undefined
        ? dto.recurrenceEndUtc
          ? new Date(dto.recurrenceEndUtc)
          : null
        : existing.recurrenceEndUtc;

    if (endUtc <= startUtc) {
      throw new ConflictException('End time must be after start time');
    }

    const newOccurrences = generateOccurrences({
      startUtc,
      endUtc,
      isRecurring,
      recurrenceEndUtc,
    } as Event);

    await this.checkRecurringOverlap(newOccurrences, id);

    return this.repository.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.startUtc && { startUtc }),
      ...(dto.endUtc && { endUtc }),
      ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      ...(dto.isRecurring !== undefined && { isRecurring }),
      ...(dto.recurrenceEndUtc !== undefined && { recurrenceEndUtc }),
    });
  }

  async delete(id: string): Promise<Event> {
    await this.findById(id);
    return this.repository.delete(id);
  }

  private async checkRecurringOverlap(
    newOccurrences: TimeRange[],
    excludeId?: string,
  ): Promise<void> {
    const allEvents = await this.repository.findAllEvents(excludeId);

    const conflicts: {
      id: string;
      title: string;
      startUtc: Date;
      endUtc: Date;
    }[] = [];
    const seenIds = new Set<string>();

    for (const newOcc of newOccurrences) {
      for (const existing of allEvents) {
        if (seenIds.has(existing.id)) continue;

        const existingOccurrences = generateOccurrences(existing);
        for (const existOcc of existingOccurrences) {
          if (rangesOverlap(newOcc, existOcc)) {
            seenIds.add(existing.id);
            conflicts.push({
              id: existing.id,
              title: existing.title,
              startUtc: existOcc.start,
              endUtc: existOcc.end,
            });
            break;
          }
        }
      }
    }

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
