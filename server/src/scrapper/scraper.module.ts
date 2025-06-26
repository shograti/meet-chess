import { Module } from '@nestjs/common';
import { EventsModule } from 'src/events/events.module';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';

@Module({
  controllers: [ScraperController],
  imports: [EventsModule],
  providers: [ScraperService],
})
export class ScraperModule { }
