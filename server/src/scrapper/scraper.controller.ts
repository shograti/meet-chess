import { Controller, Get } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('Scraper')
export class ScraperController {
  constructor(private readonly ScraperService: ScraperService) { }

  @Get('trigger-scrapping')
  async getUnmatchedTimeControls() {
    const result = await this.ScraperService.handleFFEJob();
    return result;
  }
}
