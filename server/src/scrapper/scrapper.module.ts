import { Module } from '@nestjs/common';
import { EventsModule } from 'src/events/events.module';
import { ScrapperService } from './scrapper.service';
import { ScrapperController } from './scrapper.controller';

@Module({
  controllers: [ScrapperController],
  imports: [EventsModule],
  providers: [ScrapperService],
})
export class ScrapperModule {}
