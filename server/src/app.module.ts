import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from './events/events.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { Event } from './events/entities/event.entity';
import { GameFormatsModule } from './game-formats/game-formats.module';
import { GameFormat } from './game-formats/entities/game-format.entity';
import { AddressesModule } from './addresses/addresses.module';
import { Address } from './addresses/entities/address.entity';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { ScraperModule } from './scrapper/scraper.module';
import { ScraperService } from './scrapper/scraper.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
      entities: [User, Event, GameFormat, Address],
      synchronize: true,
    }),
    EventsModule,
    UsersModule,
    GameFormatsModule,
    AddressesModule,
    AuthModule,
    ScraperModule,
  ],
  providers: [ScraperService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
