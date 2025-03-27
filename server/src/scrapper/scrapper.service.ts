import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { EventsService } from 'src/events/events.service';

@Injectable()
export class ScrapperService {
  constructor(private eventService: EventsService) {}

  @Cron('54 17 * * *')
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

        if (
          !properties.street ||
          !properties.city ||
          !properties.postcode ||
          !geometry?.coordinates
        ) {
          console.warn('Incomplete address data:', properties);
          return null;
        }

        const houseNumber = properties.housenumber || '';
        const street = houseNumber
          ? `${houseNumber} ${properties.street}`
          : properties.street;

        return {
          street,
          city: properties.city,
          zip: properties.postcode,
          country: 'France',
          latitude: geometry.coordinates[1],
          longitude: geometry.coordinates[0],
        };
      } else {
        console.warn('No address found for the provided query.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      return null;
    }
  }

  parseTimings(timings: string) {
    switch (timings) {
      case "50' + [10'']":
        return { time: '00:50:00', increment: 10, additionalTime: null };
      case "1h30 + [30'']":
        return { time: '01:30:00', increment: 30, additionalTime: null };
      case "60' + [30'']":
        return { time: '01:00:00', increment: 30, additionalTime: null };
      case "1h30/40 - 30' + [30'']":
      case `1h30/40 - 30' + [30"]`:
        return { time: '01:30:00', increment: 30, additionalTime: 30 };
      case "10' + [2'']":
        return { time: '00:10:00', increment: 2, additionalTime: null };
      case "15' + [5'']":
      case `15' + [5"]`:
        return { time: '00:15:00', increment: 5, additionalTime: null };
      case "8' + [3'']":
        return { time: '00:08:00', increment: 3, additionalTime: null };
      case "12' + [3'']":
      case '12 min + 3 s':
      case '12mn+3s':
        return { time: '00:12:00', increment: 3, additionalTime: null };
      case "10' + [1'']":
        return { time: '00:10:00', increment: 1, additionalTime: null };
      case "15' + [3'']":
        return { time: '00:15:00', increment: 3, additionalTime: null };
      case "15' Ko":
        return { time: '00:15:00', increment: null, additionalTime: null };
      case '15 min + 5sec':
        return { time: '00:15:00', increment: 5, additionalTime: null };
      case "10' + [3'']":
        return { time: '00:10:00', increment: 3, additionalTime: null };
      case "10' + [5'']":
        return { time: '00:10:00', increment: 5, additionalTime: null };
      case "10' Ko":
        return { time: '00:10:00', increment: null, additionalTime: null };
      case `"3' + [2"]`:
      case "3' + [2'']":
        return { time: '00:03:00', increment: 2, additionalTime: null };
      case "5' + [2'']":
        return { time: '00:05:00', increment: 2, additionalTime: null };
      case "5' + [3'']":
        return { time: '00:05:00', increment: 3, additionalTime: null };
      case "5' Ko":
        return { time: '00:05:00', increment: null, additionalTime: null };
      case "11' Ko":
        return { time: '00:11:00', increment: null, additionalTime: null };
      case "1' + [4'']":
        return { time: '00:01:00', increment: 4, additionalTime: null };
      case "4' + [2'']":
        return { time: '00:04:00', increment: 2, additionalTime: null };
      default:
        return null;
    }
  }

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

        const name = await tournamentPage.$eval(
          '#ctl00_ContentPlaceHolderMain_LabelNom',
          (el) => el.textContent.trim(),
        );

        const pageElements = await tournamentPage.$$(
          '.tableau_violet_c, .tableau_blanc',
        );
        const tournamentData: any = { link: tournamentUrl, name };

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
              tournamentData['pairingSystem'] = pairingMap[value] || value;
            }

            if (label.includes('Adresse')) {
              const parsedAddress = await this.parseAddress(value);
              if (parsedAddress) {
                tournamentData['address'] = parsedAddress;
              } else {
                console.warn(
                  `Skipping tournament due to incomplete address: ${tournamentUrl}`,
                );
                continue; // Skip this tournament entry
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

    const dataDir = '../data';
    const dataFilePath = path.join(dataDir, 'scrapedData.json');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(results, null, 2), 'utf8');

    //Temporary master user

    const user = { id: '62379359-5328-4def-99b6-4b22f30fa225' };

    results.forEach((result) => {
      this.eventService.create(result, user);
    });

    console.log(`Data saved to ${dataFilePath}`);
  }
}
