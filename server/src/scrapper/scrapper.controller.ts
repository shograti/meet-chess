import { Controller, Get } from '@nestjs/common';
import { ScrapperService } from './scrapper.service';

@Controller('scrapper')
export class ScrapperController {
  constructor(private readonly scrapperService: ScrapperService) {}

  @Get('trigger-scrapping')
  async getUnmatchedTimeControls() {
    const result = await this.scrapperService.scrapeData();
    return result;
  }
}
