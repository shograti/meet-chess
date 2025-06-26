import * as puppeteer from 'puppeteer';
import { parseFFETimeControls, parseFFEDate } from './ffe.utils';

export async function scrapeFFETournaments(
    log: (msg: string) => void = console.log,
): Promise<{
    results: any[];
    skippedTournaments: any[];
    unmatchedTimeControls: string[];
}> {
    const browser = await puppeteer.launch();
    const results = [];
    const skippedTournaments = [];
    const unmatchedTimeControls: string[] = [];

    const scrapeCurrentPage = async (page): Promise<void> => {
        const elements = await page.$$('.liste_fonce, .liste_clair');

        for (const element of elements) {
            let tournamentUrl: string;

            try {
                const link = await element.$eval('.lien_texte', (el) => el.getAttribute('href'));
                if (!link) continue;

                tournamentUrl = `https://www.echecs.asso.fr/${link}`;
                const tournamentPage = await browser.newPage();

                try {
                    await tournamentPage.goto(tournamentUrl, {
                        timeout: 15000,
                        waitUntil: 'domcontentloaded',
                    });
                } catch (err) {
                    log(`❌ Failed to load ${tournamentUrl}: ${err.message}`);
                    skippedTournaments.push({ reason: 'goto failed', url: tournamentUrl });
                    await tournamentPage.close();
                    continue;
                }

                const name = await tournamentPage.$eval(
                    '#ctl00_ContentPlaceHolderMain_LabelNom',
                    (el) => el.textContent?.trim(),
                );

                const pageElements = await tournamentPage.$$('.tableau_violet_c, .tableau_blanc');
                const tournamentData: any = { link: tournamentUrl, name };

                for (const pageElement of pageElements) {
                    try {
                        const label = await pageElement.$eval('td:first-child', (el) => el.textContent.trim());
                        const value = await pageElement.$eval('td:nth-child(2)', (el) => el.textContent.trim());

                        if (label.includes('Nombre de rondes')) tournamentData.rounds = parseInt(value, 10);

                        if (label.includes('Cadence')) {
                            const timeControl = parseFFETimeControls(value);
                            if (timeControl) {
                                tournamentData.gameFormat = timeControl;
                            } else {
                                log(`⚠️ Unmatched time control: ${value}`);
                                unmatchedTimeControls.push(value);
                            }
                        }

                        if (label.includes('Appariements')) {
                            const mapping = {
                                SAD: 'Swiss system',
                                'S.A.D': 'Swiss system',
                                'S.A.D.': 'Swiss system',
                                Suisse: 'Swiss system',
                                'Toutes Rondes': 'Round Robin',
                            };
                            tournamentData.pairingSystem = mapping[value] || value;
                        }

                        if (label.includes('Adresse')) tournamentData.address = value;
                        if (label.includes('Dates')) Object.assign(tournamentData, parseFFEDate(value));
                        if (label.includes('Total des prix')) tournamentData.cashPrize = parseInt(value.replace(/\D/g, ''), 10) * 100;
                        if (label.includes('Inscription Senior')) tournamentData.seniorRegistrationFee = parseInt(value.replace(/\D/g, ''), 10) * 100;
                        if (label.includes('Inscription Jeunes')) tournamentData.juniorRegistrationFee = parseInt(value.replace(/\D/g, ''), 10) * 100;
                        if (label.includes('Annonce')) tournamentData.description = value;

                    } catch (err) {
                        log(`⚠️ Error reading tournament detail in ${tournamentUrl}`);
                    }
                }

                await tournamentPage.close();

                if (tournamentData.address && tournamentData.gameFormat) {
                    results.push(tournamentData);
                } else {
                    const missing = [];
                    if (!tournamentData.address) missing.push('address');
                    if (!tournamentData.gameFormat) missing.push('gameFormat');
                    log(`⚠️ Skipping ${tournamentUrl} — missing ${missing.join(', ')}`);
                    skippedTournaments.push({ reason: `Missing ${missing.join(', ')}`, url: tournamentUrl });
                }
            } catch (err) {
                log(`❌ Unexpected error on ${tournamentUrl || 'unknown page'}`);
                skippedTournaments.push({ reason: 'unexpected error', url: tournamentUrl || '[unknown]' });
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
        const page = await browser.newPage();
        try {
            log(`➡️ Navigating to ${url}`);
            await page.goto(url, { timeout: 15000 });
            const paginationElements = await page.$$('.Pager a.lien_texte');
            const maxPage = paginationElements.length
                ? Math.max(...(await Promise.all(paginationElements.map(el => el.evaluate(e => parseInt(e.textContent.trim(), 10)))))
                )
                : 1;

            await scrapeCurrentPage(page);
            for (let i = 1; i < maxPage; i++) {
                log(`➡️ Moving to page ${i + 1} of ${maxPage}`);
                await page.evaluate((index) => {
                    (window as any).__doPostBack('ctl00$ContentPlaceHolderMain$PagerFooter', String(index));
                }, i);
                await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
                await scrapeCurrentPage(page);
            }
        } catch (err) {
            log(`❌ Error loading list page: ${url}`);
        } finally {
            await page.close();
        }
    }

    await browser.close();
    return { results, skippedTournaments, unmatchedTimeControls };
}
