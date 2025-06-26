import * as puppeteer from 'puppeteer';
import { parseTournamentData } from './ffe.parser';

export async function scrapeFFETournaments() {
    const results = [];
    const skippedTournaments = [];
    const unmatchedTimeControls: string[] = [];

    const browser = await puppeteer.launch();
    const urls = [
        'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=1',
        'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=2',
        'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=3',
        'https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=4',
    ];

    for (const url of urls) {
        const page = await browser.newPage();
        try {
            console.log(`🔗 Navigating to: ${url}`);
            await page.goto(url, { timeout: 15000 });

            const paginationElements = await page.$$('.Pager a.lien_texte');
            const maxPage = paginationElements.length
                ? Math.max(
                    ...(await Promise.all(
                        paginationElements.map((el) =>
                            el.evaluate((e) => parseInt(e.innerText.trim(), 10)),
                        ),
                    )),
                )
                : 1;

            await scrapeCurrentPage(page, browser);

            for (let i = 1; i < maxPage; i++) {
                console.log(`➡ Navigating to page ${i + 1} of ${maxPage}`);
                await page.evaluate((pageIndex) => {
                    (window as any).__doPostBack('ctl00$ContentPlaceHolderMain$PagerFooter', String(pageIndex));
                }, i);

                await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
                await scrapeCurrentPage(page, browser);
            }
        } catch (err) {
            console.error(`Error scraping list page: ${url}`, err);
        } finally {
            await page.close();
        }
    }

    await browser.close();
    return { results, skippedTournaments, unmatchedTimeControls };

    async function scrapeCurrentPage(page, browser) {
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

                    const parsed = await parseTournamentData(tournamentPage, tournamentUrl);

                    if (!parsed) {
                        skippedTournaments.push({ reason: 'parse returned null', url: tournamentUrl });
                    } else if ('error' in parsed) {
                        if (parsed.error === 'unmatched-time-control') {
                            unmatchedTimeControls.push(parsed.raw);
                            skippedTournaments.push({ reason: 'unmatched-time-control', url: tournamentUrl });
                        }
                    } else if (!parsed.address || !parsed.gameFormat) {
                        const reason = ['address', 'gameFormat'].filter((key) => !parsed[key]).join(', ');
                        skippedTournaments.push({ reason: `Missing ${reason}`, url: tournamentUrl });
                    } else {
                        results.push(parsed);
                    }
                } catch {
                    skippedTournaments.push({ reason: 'goto failed', url: tournamentUrl });
                } finally {
                    await tournamentPage.close();
                }
            } catch {
                skippedTournaments.push({ reason: 'unexpected error', url: tournamentUrl || '[unknown]' });
            }
        }
    }
}
