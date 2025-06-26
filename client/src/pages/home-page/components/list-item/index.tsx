import { formatToDDMMYYYY } from "../../../../utils";
import styles from "./styles.module.css";

function EventItem({ event }) {

    function formatChessTimeControl(time: string): string {
        const [hours, minutes, seconds] = time.split(':').map(Number);

        if (hours > 0 && minutes > 0) return `${hours}h${minutes}`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}`;
        return `${seconds}`;
    }

    function parseGameFormat(gameFormat: string) {
        if (!gameFormat) return "No time control";
        if (gameFormat.time && gameFormat.increment && (gameFormat.additionalTime || !gameFormat.additionalTime === 0)) {
            return `${formatChessTimeControl(gameFormat.time)}+${gameFormat.increment} (+${gameFormat.additionalTime})`;
        }
        if (gameFormat.time && gameFormat.increment) {
            return `${formatChessTimeControl(gameFormat.time)}+${gameFormat.increment}`;
        }
        return ""
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.header_left}>
                    <p className={styles.event_name}>{event.name}</p>

                    <p>{event.rounds} rounds {parseGameFormat(event.gameFormat)}</p>

                </div>
                <div className={styles.header_right}>
                    <p>{(formatToDDMMYYYY(event.beginsAt))}</p>
                    <p>{event.address.city} ({event.address.zip.slice(0, 2)})</p>
                </div>
            </div>
        </div>
    )
}

export default EventItem