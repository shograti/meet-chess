import { Controller, Get } from '@nestjs/common';
import { ScrapperService } from './scrapper.service';

@Controller('scrapper')
export class ScrapperController {
  constructor(private readonly scrapperService: ScrapperService) {}

  @Get()
  async scrape() {
    await this.scrapperService.scrapeData();
    return { message: 'Scraping completed and data saved.' };
  }
}
