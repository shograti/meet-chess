import { parseDate } from "../../utils";
import styles from "./styles.module.css";

function EventCard({ event }) {
  return (
    <div className={styles.card}>
      <div className={styles.card_header}>
        <h3>{event.name}</h3>
        {event.beginsAt === event.endsAt ? (
          <p>{parseDate(event.beginsAt)}</p>
        ) : (
          <p>
            Du {parseDate(event.beginsAt).toLowerCase()} au{" "}
            {parseDate(event.endsAt).toLowerCase()}
          </p>
        )}
      </div>
    </div>
  );
}

export default EventCard;
