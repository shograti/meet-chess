import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from './events/events.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { Event } from './events/entities/event.entity';
import { GameFormatsModule } from './game-formats/game-formats.module';
import { GameFormat } from './game-formats/entities/game-format.entity';
import { AddressesModule } from './addresses/addresses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      database: process.env.DATABASE_NAME,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      entities: [User, Event, GameFormat],
      synchronize: true,
    }),
    EventsModule,
    UsersModule,
    GameFormatsModule,
    AddressesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
