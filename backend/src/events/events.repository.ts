import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Event } from '../../generated/prisma/client';

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(from: Date, to: Date): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: {
        startUtc: { lt: to },
        endUtc: { gt: from },
      },
      orderBy: { startUtc: 'asc' },
    });
  }

  async findById(id: string): Promise<Event | null> {
    return this.prisma.event.findUnique({ where: { id } });
  }

  async create(data: {
    title: string;
    startUtc: Date;
    endUtc: Date;
    timezone: string;
  }): Promise<Event> {
    return this.prisma.event.create({ data });
  }

  async update(
    id: string,
    data: Partial<{ title: string; startUtc: Date; endUtc: Date; timezone: string }>,
  ): Promise<Event> {
    return this.prisma.event.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Event> {
    return this.prisma.event.delete({ where: { id } });
  }

  async findOverlapping(
    startUtc: Date,
    endUtc: Date,
    excludeId?: string,
  ): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: {
        ...(excludeId && { id: { not: excludeId } }),
        startUtc: { lt: endUtc },
        endUtc: { gt: startUtc },
      },
      orderBy: { startUtc: 'asc' },
    });
  }
}
