import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as timeControls from '../constants/time-controls.json';
import { getProjectRootPath } from 'src/utils/path.util';
import { EventsService } from 'src/events/events.service';
import { GameFormat } from 'src/game-formats/entities/game-format.entity';

const unmatchedTimeControls: string[] = [];

@Injectable()
export class ScrapperService {
  constructor(private eventService: EventsService) { }

  @Cron('03 20 * * *')
  async handleCron() {
    console.log('Running scheduled scraping job...');
    await this.scrapeData();
  }

  normalizeTiming(timing: string | undefined | null): string {
    return (timing ?? '')
      .trim()
      .replace(/\s+/g, ' ') // Collapse extra whitespace
      .replace(/[‘’‛´`]/g, "'") // Normalize apostrophes
      .replace(/[“”„‟]/g, '"') // Normalize quotes
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width chars
  }

  parseTimeControls(timings: string): GameFormat | null {
    const normalized = this.normalizeTiming(timings);
    return (timeControls as Record<string, any>)[normalized] || null;
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

  async scrapeData(): Promise<any> {
    const browser = await puppeteer.launch();
    const results = [];
    const skippedTournaments = [];

    const scrapeCurrentPage = async (page): Promise<void> => {
      const elements = await page.$$('.liste_fonce, .liste_clair');

      for (const element of elements) {
        let tournamentUrl: string;

        try {
          const link: string = await element.$eval(
            '.lien_texte',
            (el: Element) => el.getAttribute('href'),
          );

          if (!link) {
            console.warn('Missing tournament link, skipping.');
            continue;
          }

          tournamentUrl = `https://www.echecs.asso.fr/${link}`;
          const tournamentPage = await browser.newPage();

          try {
            await tournamentPage.goto(tournamentUrl, {
              timeout: 15000,
              waitUntil: 'domcontentloaded',
            });
          } catch (err) {
            console.error(`Failed to load ${tournamentUrl}: ${err.message}`);
            await tournamentPage.close();
            skippedTournaments.push({
              reason: 'goto failed',
              url: tournamentUrl,
            });
            continue;
          }

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
                const timeControls = this.parseTimeControls(value);
                if (timeControls) {
                  tournamentData['gameFormat'] = timeControls;
                } else {
                  console.warn(`Unmatched timing format: ${value}`);
                  unmatchedTimeControls.push(value);
                  continue;
                }
              }

              if (label.includes('Appariements')) {
                const pairingMap = {
                  SAD: 'Swiss system',
                  'S.A.D': 'Swiss system',
                  Suisse: 'Swiss system',
                  'Toutes Rondes': 'Round Robin',
                  Hayley: 'Hayley',
                };
                tournamentData['pairingSystem'] = pairingMap[value] || value;
              }

              if (label.includes('Adresse')) {
                tournamentData['address'] = value;
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
            } catch (innerError) {
              console.warn(
                `Error scraping element on ${tournamentUrl}`,
                innerError,
              );
            }
          }

          await tournamentPage.close();

          const missingFields: string[] = [];

          if (!tournamentData.address) missingFields.push('address');
          if (!tournamentData.gameFormat) missingFields.push('gameFormat');

          if (missingFields.length === 0) {
            results.push(tournamentData);
          } else {
            const reason = `Missing field(s): ${missingFields.join(', ')}`;
            console.warn(`Skipping tournament ${tournamentUrl} - ${reason}`);
            skippedTournaments.push({ reason, url: tournamentUrl });
          }
        } catch (outerError) {
          console.error(`Unexpected error scraping tournament`, outerError);
          skippedTournaments.push({
            reason: 'unexpected error',
            url: tournamentUrl || '[unknown]',
          });
        }
      }
    };

    const urls = [
      'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=1',
      'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=2',
      'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=3',
      'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=4',
    ];

    for (const url of urls) {
      const initialPage = await browser.newPage();
      try {
        console.log(`Going to page: ${url}`);
        await initialPage.goto(url, { timeout: 15000 });

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

        await scrapeCurrentPage(initialPage);

        for (let i = 1; i < maxPage; i++) {
          console.log(`Navigating to page ${i + 1} of ${maxPage}`);

          await initialPage.evaluate((pageIndex) => {
            (window as any).__doPostBack(
              'ctl00$ContentPlaceHolderMain$PagerFooter',
              String(pageIndex),
            );
          }, i);

          // Wait for the new page to load
          await initialPage.waitForNavigation({
            waitUntil: 'domcontentloaded',
          });

          await scrapeCurrentPage(initialPage);
        }
      } catch (pageError) {
        console.error(
          `Error navigating tournament list page: ${url}`,
          pageError,
        );
      } finally {
        await initialPage.close();
      }
    }

    await browser.close();

    const tempDir = getProjectRootPath('src', 'temp');
    const unmatchedFilePath = path.join(
      tempDir,
      'unmatched-time-controls.json',
    );

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(
      unmatchedFilePath,
      JSON.stringify([...new Set(unmatchedTimeControls)].sort(), null, 2),
      'utf8',
    );

    console.log(`Unmatched time controls saved to ${unmatchedFilePath}`);

    // Temporary master user
    const user = { id: '0792d5c5-9e7f-41aa-b777-468788cbdd01' };

    for (const result of results) {
      try {
        await this.eventService.create(result, user);
      } catch (createError) {
        console.error('Error saving event:', result.link, createError);
      }
    }

    console.log(`Scraped ${results.length} tournaments`);
    console.log(`Skipped ${skippedTournaments.length} tournaments`);

    return { success: true, message: 'Scraping completed successfully!' };
  }
}
