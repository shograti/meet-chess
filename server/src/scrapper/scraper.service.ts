import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { EventsService } from 'src/events/events.service';
import { getProjectRootPath } from 'src/utils/path.util';
import { scrapeFFETournaments } from './ffe/ffe.scraper';

@Injectable()
export class ScraperService {
  constructor(private eventService: EventsService) { }

  @Cron('03 20 * * *')
  async handleFFEJob() {
    console.log('▶ Starting FFE scraping job...');
    const { results, skippedTournaments, unmatchedTimeControls } = await scrapeFFETournaments();

    const tempDir = getProjectRootPath('src', 'temp');
    const unmatchedFilePath = path.join(tempDir, 'unmatched-time-controls.json');

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    fs.writeFileSync(
      unmatchedFilePath,
      JSON.stringify([...new Set(unmatchedTimeControls)].sort(), null, 2),
      'utf8',
    );
    console.log(`✔ Unmatched time controls saved to ${unmatchedFilePath}`);

    const user = { id: '0792d5c5-9e7f-41aa-b777-468788cbdd01' }; // Temporary user ID for testing

    for (const result of results) {
      try {
        await this.eventService.create(result, user);
      } catch (err) {
        console.error('Error saving event:', result.link, err);
      }
    }

    console.log(`✅ Scraped ${results.length} tournaments`);
    console.log(`⚠️ Skipped ${skippedTournaments.length} tournaments`);
  }
}