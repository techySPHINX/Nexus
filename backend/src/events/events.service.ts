import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventCategory, EventStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createEventDto: CreateEventDto, userId: string) {
    return this.prisma.event.create({
      data: {
        ...createEventDto,
        authorId: userId,
      },
    });
  }

  async findAll(
    category?: EventCategory,
    status?: EventStatus,
    search?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    page?: number,
    limit?: number,
  ) {
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = sortBy
      ? { [sortBy]: sortOrder || 'asc' }
      : { createdAt: 'desc' as const };

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit ? limit : undefined;

    const [events, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      total,
      page,
      limit,
    };
  }

  findOne(id: string) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  update(id: string, updateEventDto: UpdateEventDto) {
    return this.prisma.event.update({ where: { id }, data: updateEventDto });
  }

  remove(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }

  async getEventStats() {
    const totalEvents = await this.prisma.event.count();
    const upcomingEvents = await this.prisma.event.count({
      where: { status: 'UPCOMING' },
    });
    const pastEvents = await this.prisma.event.count({
      where: { status: 'PAST' },
    });
    const cancelledEvents = await this.prisma.event.count({
      where: { status: 'CANCELLED' },
    });

    const eventsByCategory = await this.prisma.event.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    });

    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      cancelledEvents,
      eventsByCategory,
    };
  }
}
