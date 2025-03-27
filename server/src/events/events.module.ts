import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { AddressesService } from 'src/addresses/addresses.service';
import { GameFormatsService } from 'src/game-formats/game-formats.service';
import { Address } from 'src/addresses/entities/address.entity';
import { GameFormat } from 'src/game-formats/entities/game-format.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Address, GameFormat])],
  controllers: [EventsController],
  providers: [EventsService, AddressesService, GameFormatsService],
  exports: [EventsService],
})
export class EventsModule {}
