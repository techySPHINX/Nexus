import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { EventCategory, EventStatus } from '@prisma/client';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(
    @Body() createEventDto: CreateEventDto,
    @GetCurrentUser('userId') userId: string,
  ) {
    console.log('Received create event request:', createEventDto);
    return this.eventsService.create(createEventDto, userId);
  }

  @Get()
  findAll(
    @Query('category') category?: EventCategory,
    @Query('status') status?: EventStatus,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    return this.eventsService.findAll(
      category,
      status,
      search,
      sortBy,
      sortOrder,
      pageNumber,
      limitNumber,
    );
  }

  @Get('stats')
  getStats() {
    return this.eventsService.getEventStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Query('force') force?: string) {
    // If `force=true` is provided, perform a hard delete. Otherwise soft-cancel the event.
    const hard = force === 'true';
    return this.eventsService.remove(id, hard);
  }
}
