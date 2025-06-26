// src/scraper/scraper.service.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { EventsService } from 'src/events/events.service';
import { getProjectRootPath } from 'src/utils/path.util';
import { scrapeFFETournaments } from './ffe/ffe.scraper';
import { ScrapperGateway } from './scrapper.gateway';

@Injectable()
export class ScraperService {
  constructor(
    private readonly eventService: EventsService,
    private readonly scrapperGateway: ScrapperGateway,
  ) { }

  @Cron('03 20 * * *')
  async handleFFEJob() {
    const log = (msg: string) => {
      console.log(msg);
      this.scrapperGateway.emitLog(msg);
    };

    log('▶ Starting FFE scraping job...');

    const {
      results,
      skippedTournaments,
      unmatchedTimeControls,
    } = await scrapeFFETournaments(log);

    const tempDir = getProjectRootPath('src', 'temp');
    const unmatchedFilePath = path.join(tempDir, 'unmatched-time-controls.json');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    fs.writeFileSync(
      unmatchedFilePath,
      JSON.stringify([...new Set(unmatchedTimeControls)].sort(), null, 2),
      'utf8',
    );

    log(`✔ Unmatched time controls saved to ${unmatchedFilePath}`);

    const user = { id: '0792d5c5-9e7f-41aa-b777-468788cbdd01' };

    for (const result of results) {
      try {
        await this.eventService.create(result, user);
      } catch (err) {
        log(`❌ Error saving event: ${result.link}`);
      }
    }

    log(`✅ Scraped ${results.length} tournaments`);
    log(`⚠️ Skipped ${skippedTournaments.length} tournaments`);

    this.scrapperGateway.emitDone('🎉 FFE scraping complete');
  }
}