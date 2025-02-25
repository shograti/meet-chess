import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScrapperService {
  constructor(private readonly configService: ConfigService) {}

  @Cron('43 11 * * *')
  async handleCron() {
    console.log('Running scheduled scraping job...');
    await this.scrapeData();
  }

  async parseAddress(existingAddress: string): Promise<object | null> {
    if (!existingAddress) {
      console.warn('No address provided to parse.');
      return null;
    }

    const apiUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(existingAddress)}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const properties = data.features[0].properties;
        const geometry = data.features[0].geometry;

        const houseNumber = properties.housenumber || '';
        const street = houseNumber
          ? `${houseNumber} ${properties.street}`
          : properties.street;

        const address = {
          street,
          city: properties.city,
          zip: properties.postcode,
          country: 'France',
          latitude: geometry.coordinates[1],
          longitude: geometry.coordinates[0],
        };

        return address;
      } else {
        console.warn('No address found for the provided query.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      return null;
    }
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

        const title = await tournamentPage.$eval(
          '#ctl00_ContentPlaceHolderMain_LabelNom',
          (el) => el.textContent.trim(),
        );

        const pageElements = await tournamentPage.$$(
          '.tableau_violet_c, .tableau_blanc',
        );
        const tournamentData: any = { link: tournamentUrl, title };

        for (const pageElement of pageElements) {
          try {
            const label = await pageElement.$eval('td:first-child', (el) =>
              el.textContent.trim(),
            );
            const value = await pageElement.$eval('td:nth-child(2)', (el) =>
              el.textContent.trim(),
            );

            if (label.includes('Nombre de rondes')) {
              tournamentData['rounds'] = parseInt(value, 10);
            }

            if (label.includes('Cadence')) {
              tournamentData['gameFormat'] = this.parseTimings(value);
            }

            if (label.includes('Appariements')) {
              const pairingMap = {
                Suisse: 'Swiss system',
                'Toutes Rondes': 'Round Robin',
                Hayley: 'Hayley',
              };
              tournamentData['pairings'] = pairingMap[value] || value;
            }

            if (label.includes('Adresse')) {
              const parsedAddress = await this.parseAddress(value);
              if (parsedAddress) {
                tournamentData['address'] = parsedAddress;
              }
            }

            if (label.includes('Dates')) {
              const { beginsAt, endsAt } = this.parseDate(value);
              tournamentData['beginsAt'] = beginsAt;
              tournamentData['endsAt'] = endsAt;
            }

            if (label.includes('Total des prix')) {
              tournamentData['cashPrize'] =
                parseInt(value.replace(/\D/g, ''), 10) * 100;
            }

            if (label.includes('Inscription Senior')) {
              tournamentData['seniorRegistrationFee'] =
                parseInt(value.replace(/\D/g, ''), 10) * 100;
            }

            if (label.includes('Inscription Jeunes')) {
              tournamentData['juniorRegistrationFee'] =
                parseInt(value.replace(/\D/g, ''), 10) * 100;
            }

            if (label.includes('Annonce')) {
              tournamentData['description'] = value;
            }
          } catch (error) {
            console.error(`Error scraping data from ${tournamentUrl}`, error);
          }
        }
        tournamentData.address && results.push(tournamentData);
        await tournamentPage.close();
      }
    };

    const urls = [
      'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=1',
      'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=3',
      'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=4',
    ];

    for (const url of urls) {
      const initialPage = await browser.newPage();
      console.log(`Going to page :  ${url}`);
      await initialPage.goto(url);

      const paginationElements = await initialPage.$$('.Pager a.lien_texte');
      const maxPage =
        paginationElements.length > 0
          ? Math.max(
              ...(await Promise.all(
                paginationElements.map(async (el) => {
                  const pageNum = await el.evaluate((e: HTMLAnchorElement) =>
                    e.innerText.trim(),
                  );
                  return parseInt(pageNum, 10);
                }),
              )),
            )
          : 1;

      for (let i = 1; i <= maxPage; i++) {
        console.log(`Scraping page ${i}/${maxPage} from ${url}`);
        await scrapeCurrentPage(initialPage);
        await initialPage.goto(`${url}&Pager=${i}`);
      }

      await initialPage.close();
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
