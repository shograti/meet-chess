import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDTO } from './dto/create-event.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { AddressesService } from 'src/addresses/addresses.service';
import { GameFormatsService } from 'src/game-formats/game-formats.service';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventsRepository: Repository<Event>,
    private addressesService: AddressesService,
    private gameFormatsService: GameFormatsService,
  ) { }

  async create(createEventDTO: CreateEventDTO, user): Promise<Event> {
    const event = createEventDTO;

    if (event.link) {
      const existingEvent = await this.eventsRepository.findOne({
        where: { link: event.link },
      });
      if (existingEvent) {
        console.log('Event already exists');
        return;
      }
    }

    const gameFormat = await this.gameFormatsService.create(event.gameFormat);
    const address = await this.addressesService.createAddress(event.address);

    const newEvent = {
      name: event.name,
      link: event.link,
      description: event.description ?? 'No description available',
      beginsAt: event.beginsAt,
      endsAt: event.endsAt,
      cashprize: event.cashprize,
      rounds: event.rounds,
      pairingSystem: event.pairingSystem,
      creator: user.id,
    };

    const createdEvent = await this.eventsRepository.save(newEvent);

    await this.eventsRepository.update(createdEvent.id, {
      address,
      gameFormat,
    });

    return await this.findOne(createdEvent.id);
  }

  async findAll(options: IPaginationOptions): Promise<Pagination<Event>> {
    const queryBuilder = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.address', 'address')
      .leftJoinAndSelect('event.gameFormat', 'gameFormat')
      .leftJoin('event.creator', 'creator')
      .addSelect('creator.username')
      .orderBy('event.beginsAt', 'ASC');

    const paginatedResult = await paginate<Event>(queryBuilder, options);

    return new Pagination<Event>(
      paginatedResult.items,
      paginatedResult.meta,
      paginatedResult.links,
    );
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
      address: event.address,
      cashprize: event.cashprize,
      rounds: event.rounds,
      pairingSystem: event.pairingSystem,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      gameFormat: event.gameFormat,
      creatorUsername: event.creator?.username,
    };
  }

  async remove(id: string) {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return this.eventsRepository.delete(id);
  }
}
