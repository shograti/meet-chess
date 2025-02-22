import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScrapperService {
  constructor(private readonly configService: ConfigService) {}

  @Cron('9 9 * * *')
  async handleCron() {
    console.log('Running scheduled scraping job...');
    await this.scrapeData();
  }

  parseTimings = (timings: string) => {
    const timeMatch = timings.match(/(\d+)h(\d+)?/);
    const minutesMatch = timings.match(/(\d+)'/);
    const additionalTimeMatch = timings.match(/\/(\d+) - (\d+)'/);
    const incrementMatch = timings.match(/\[(\d+)'']/);

    let time = null;
    let additionalTime = null;
    let increment = null;

    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    } else if (minutesMatch) {
      let minutes = parseInt(minutesMatch[1], 10);
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        minutes = minutes % 60;
        time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      } else {
        time = `00:${String(minutes).padStart(2, '0')}:00`;
      }
    }

    if (additionalTimeMatch) {
      additionalTime = parseInt(additionalTimeMatch[2], 10);
    }

    if (incrementMatch) {
      increment = parseInt(incrementMatch[1], 10);
    }

    return { time, increment, additionalTime };
  };

  parseDate(datesString: string): { beginsAt: string; endsAt: string } {
    const frenchMonths = {
      janvier: 0,
      février: 1,
      mars: 2,
      avril: 3,
      mai: 4,
      juin: 5,
      juillet: 6,
      août: 7,
      septembre: 8,
      octobre: 9,
      novembre: 10,
      décembre: 11,
    };

    const [startDateStr, endDateStr] = datesString
      .split(' - ')
      .map((date) => date.trim());

    const parseFrenchDate = (dateStr: string): Date => {
      const parts = dateStr.split(' ');
      const day = parseInt(parts[1], 10);
      const month = frenchMonths[parts[2].toLowerCase()];
      const year = parseInt(parts[3], 10);
      return new Date(Date.UTC(year, month, day, 0, 0, 0));
    };

    const beginsAt = parseFrenchDate(startDateStr);
    const endsAt = parseFrenchDate(endDateStr);

    return {
      beginsAt: beginsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    };
  }

  async scrapeData(): Promise<void> {
    const browser = await puppeteer.launch();
    const results = [];

    const scrapeCurrentPage = async (page): Promise<void> => {
      const elements = await page.$$('.liste_fonce, .liste_clair');

      for (const element of elements) {
        const link: string = await element.$eval('.lien_texte', (el: Element) =>
          el.getAttribute('href'),
        );
        const tournamentUrl = `https://www.echecs.asso.fr/${link}`;
        const tournamentPage = await browser.newPage();
        await tournamentPage.goto(tournamentUrl);

        const title = await tournamentPage.$$(
          '#ctl00_ContentPlaceHolderMain_LabelNom',
        );

        const pageElements = await tournamentPage.$$('.tableau_violet_c');
        const tournamentData = {};

        tournamentData['title'] = await title[0].evaluate((el) =>
          el.textContent.trim(),
        );

        for (const pageElement of pageElements) {
          try {
            const label = await pageElement.$eval('td:first-child', (el) =>
              el.textContent.trim(),
            );
            const value = await pageElement.$eval('td:nth-child(2)', (el) =>
              el.textContent.trim(),
            );
            tournamentData[label] = value;

            if (label.includes('Cadence')) {
              tournamentData['gameFormat'] = this.parseTimings(value);
            }

            if (label.includes('Dates')) {
              const { beginsAt, endsAt } = this.parseDate(value);
              tournamentData['beginsAt'] = beginsAt;
              tournamentData['endsAt'] = endsAt;
            }
          } catch (error) {
            console.error(
              `Error scraping data from tournament page: ${tournamentUrl}`,
              error,
            );
            tournamentData['Error'] = 'Data not found';
          }
        }

        results.push({
          link: tournamentUrl,
          data: tournamentData,
        });

        await tournamentPage.close();
      }
    };

    const goToNextPage = async (
      page: puppeteer.Page,
      pageNumber: number,
    ): Promise<void> => {
      await page.evaluate((pageNum) => {
        window['__doPostBack'](
          'ctl00$ContentPlaceHolderMain$PagerFooter',
          pageNum.toString(),
        );
      }, pageNumber);

      await page.waitForFunction(
        () => {
          return (
            document.querySelector('.liste_fonce') !== null ||
            document.querySelector('.liste_clair') !== null
          );
        },
        { timeout: 10000 },
      );
    };

    const initialPage = await browser.newPage();
    await initialPage.goto(
      'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=1',
    );

    for (let i = 1; i <= 7; i++) {
      await scrapeCurrentPage(initialPage);
      if (i < 7) {
        await goToNextPage(initialPage, i + 1);
      }
    }

    await browser.close();

    const dataDir = this.configService.get<string>('DATA_DIR') || '../data';
    const dataFilePath = path.join(dataDir, 'scrapedData.json');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`Data saved to ${dataFilePath}`);
  }
}
