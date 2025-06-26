import { GameFormat } from 'src/game-formats/entities/game-format.entity';
import * as timeControls from '../../constants/time-controls.json';

function normalizeFFETiming(timing: string | undefined | null): string {
    return (timing ?? '')
        .trim()
        .replace(/\s+/g, ' ') // Collapse extra whitespace
        .replace(/[‘’‛´`]/g, "'") // Normalize apostrophes
        .replace(/[“”„‟]/g, '"') // Normalize quotes
        .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width chars
}

function parseFFETimeControls(timings: string): GameFormat | null {
    const normalized = normalizeFFETiming(timings);
    return (timeControls as Record<string, any>)[normalized] || null;
}

function parseFFEDate(datesString: string): {
    beginsAt: string;
    endsAt: string;
} {
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

export { normalizeFFETiming, parseFFETimeControls, parseFFEDate };