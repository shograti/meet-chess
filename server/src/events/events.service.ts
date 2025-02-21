import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDTO } from './dto/create-event.dto';
import { UpdateEventDTO } from './dto/update-event.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventsRepository: Repository<Event>,
  ) {}

  async create(createEventDTO: CreateEventDTO, user): Promise<Event> {
    return this.eventsRepository.save({
      ...createEventDTO,
      creator: user.userId,
    });
  }

  async findAll(): Promise<any> {
    const events = await this.eventsRepository.find({
      relations: ['address', 'gameFormat', 'creator'], // Load relations
    });

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      beginsAt: event.beginsAt,
      endsAt: event.endsAt,
      cashprize: event.cashprize,
      rounds: event.rounds,
      pairingSystem: event.pairingSystem,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      address: event.address,
      gameFormat: event.gameFormat,
      creatorUsername: event.creator?.username,
    }));
  }

  async findOne(id: string): Promise<any> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['address', 'gameFormat', 'creator'],
    });

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return {
      id: event.id,
      name: event.name,
      description: event.description,
      beginsAt: event.beginsAt,
      endsAt: event.endsAt,
      cashprize: event.cashprize,
      rounds: event.rounds,
      pairingSystem: event.pairingSystem,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      address: event.address,
      gameFormat: event.gameFormat,
      creatorUsername: event.creator?.username,
    };
  }

  async update(id: string, updateEventDTO: UpdateEventDTO, user) {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['address', 'gameFormat', 'creator'],
    });

    if (event.creator.id !== user.userId) {
      throw new ForbiddenException();
    }

    return this.eventsRepository.update(id, updateEventDTO);
  }

  remove(id: number) {
    return `This action removes a #${id} event`;
  }
}
