import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createEventSchema,
  updateEventSchema,
  queryEventsSchema,
  CreateEventDto,
  UpdateEventDto,
  QueryEventsDto,
} from '../shared/schemas/event.schema';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(queryEventsSchema))
  findAll(@Query() query: QueryEventsDto) {
    return this.eventsService.findAll(query.from, query.to);
  }

  @Get(':id')
  findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventsService.findById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createEventSchema))
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateEventSchema)) dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventsService.delete(id);
  }
}
