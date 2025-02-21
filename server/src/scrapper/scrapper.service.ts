import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScrapperService {
  constructor(private readonly configService: ConfigService) {}

  async scrapeData(): Promise<void> {
    const browser = await puppeteer.launch();
    const results = [];

    const scrapeCurrentPage = async (page): Promise<void> => {
      const elements = await page.$$('.liste_fonce, .liste_clair');

      for (const element of elements) {
        const link = await element.$eval('.lien_texte', (el) =>
          el.getAttribute('href'),
        );
        const tournamentUrl = `https://www.echecs.asso.fr/${link}`;
        const tournamentPage = await browser.newPage();
        await tournamentPage.goto(tournamentUrl);

        const cadenceElements = await tournamentPage.$$('.tableau_violet_c');
        const tournamentData = {};

        for (const cadenceElement of cadenceElements) {
          try {
            const label = await cadenceElement.$eval('td:first-child', (el) =>
              el.textContent.trim(),
            );
            const value = await cadenceElement.$eval('td:nth-child(2)', (el) =>
              el.textContent.trim(),
            );
            tournamentData[label] = value;
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
