import { Module } from '@nestjs/common';
import { EventsModule } from 'src/events/events.module';
import { ScrapperService } from './scrapper.service';

@Module({})
export class ScrapperModule {
  imports: [EventsModule];
  providers: [ScrapperService];
}
