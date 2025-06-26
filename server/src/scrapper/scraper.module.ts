import { Module } from '@nestjs/common';
import { EventsModule } from 'src/events/events.module';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { ScrapperGateway } from './scrapper.gateway';

@Module({
  controllers: [ScraperController],
  imports: [EventsModule],
  providers: [ScraperService, ScrapperGateway],
})
export class ScraperModule { }
