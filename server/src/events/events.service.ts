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
  ) {}

  async create(createEventDTO: CreateEventDTO, user): Promise<Event> {
    const address = await this.addressesService.createAddress(
      createEventDTO.address,
    );

    const gameFormat = await this.gameFormatsService.create(
      createEventDTO.gameFormat,
    );

    const event = createEventDTO;

    const newEvent = {
      name: event.name,
      description: event.description,
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

  async findAll(
    options: IPaginationOptions,
  ): Promise<Pagination<CreateEventDTO>> {
    const queryBuilder = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.address', 'address')
      .leftJoinAndSelect('event.gameFormat', 'gameFormat')
      .leftJoin('event.creator', 'creator')
      .addSelect('creator.username')
      .orderBy('event.beginsAt', 'DESC');

    const paginatedResult = await paginate<Event>(queryBuilder, options);

    const mappedItems = paginatedResult.items.map((event) => ({
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
      creatorUsername: (event as any).creator?.username,
    }));

    return new Pagination<CreateEventDTO>(
      mappedItems,
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

  async update(id: string, updateEventDTO: UpdateEventDTO, user) {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['address', 'gameFormat', 'creator'],
    });

    if (!event) {
      throw new NotFoundException();
    }

    if (event.creator.id !== user.id) {
      throw new ForbiddenException();
    }

    if (updateEventDTO.address) {
      await this.addressesService.update(
        event.address.id,
        updateEventDTO.address,
      );
    }

    delete updateEventDTO.address;

    if (updateEventDTO.gameFormat) {
      await this.gameFormatsService.update(
        event.gameFormat.id,
        updateEventDTO.gameFormat,
      );
    }

    delete updateEventDTO.gameFormat;

    return this.eventsRepository.update(id, updateEventDTO);
  }

  remove(id: number) {
    return `This action removes a #${id} event`;
  }
}
