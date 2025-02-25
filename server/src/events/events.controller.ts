import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { UpdateEventDTO } from './dto/update-event.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth-guard';
import { CreateEventDTO } from './dto/create-event.dto';
import { Request } from 'express';
import { Pagination } from 'nestjs-typeorm-paginate';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: Request, @Body() createEventDTO: CreateEventDTO) {
    return this.eventsService.create(createEventDTO, req.user);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number = 10,
  ): Promise<Pagination<CreateEventDTO>> {
    limit = limit > 100 ? 100 : limit;
    return this.eventsService.findAll({ page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() updateEventDTO: UpdateEventDTO,
  ) {
    return this.eventsService.update(id, updateEventDTO, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(+id);
  }
}
