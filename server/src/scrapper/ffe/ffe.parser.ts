import { parseFFETimeControls, parseFFEDate } from './ffe.utils';

export async function parseTournamentData(page, url: string): Promise<any | null> {
    try {
        const name = await page.$eval('#ctl00_ContentPlaceHolderMain_LabelNom', (el) =>
            el.textContent.trim(),
        );
        const pageElements = await page.$$('.tableau_violet_c, .tableau_blanc');
        const data: any = { link: url, name };

        for (const element of pageElements) {
            try {
                const label = await element.$eval('td:first-child', (el) => el.textContent.trim());
                const value = await element.$eval('td:nth-child(2)', (el) => el.textContent.trim());

                if (label.includes('Nombre de rondes')) {
                    data.rounds = parseInt(value, 10);
                }

                if (label.includes('Cadence')) {
                    const format = parseFFETimeControls(value);
                    if (format) {
                        data.gameFormat = format;
                    } else {
                        return { error: 'unmatched-time-control', raw: value };
                    }
                }

                if (label.includes('Appariements')) {
                    const pairingMap = {
                        SAD: 'Swiss system',
                        'S.A.D': 'Swiss system',
                        'S.A.D.': 'Swiss system',
                        Suisse: 'Swiss system',
                        'Toutes Rondes': 'Round Robin',
                        Hayley: 'Hayley',
                    };
                    data.pairingSystem = pairingMap[value] || value;
                }

                if (label.includes('Adresse')) data.address = value;

                if (label.includes('Dates')) {
                    const { beginsAt, endsAt } = parseFFEDate(value);
                    data.beginsAt = beginsAt;
                    data.endsAt = endsAt;
                }

                if (label.includes('Total des prix')) {
                    data.cashPrize = parseInt(value.replace(/\D/g, ''), 10) * 100;
                }

                if (label.includes('Inscription Senior')) {
                    data.seniorRegistrationFee = parseInt(value.replace(/\D/g, ''), 10) * 100;
                }

                if (label.includes('Inscription Jeunes')) {
                    data.juniorRegistrationFee = parseInt(value.replace(/\D/g, ''), 10) * 100;
                }

                if (label.includes('Annonce')) {
                    data.description = value;
                }
            } catch { }
        }

        return data;
    } catch (err) {
        console.error(`Failed to parse page ${url}:`, err);
        return null;
    }
}
