import { parseDate } from "../../../../utils";
import styles from "./styles.module.css";

interface Event {
  name: string;
  beginsAt: string;
  endsAt: string;
}

function EventCard({ event }: { event: Event }) {
  const eventDate =
    event.beginsAt === event.endsAt
      ? parseDate(event.beginsAt)
      : `Du ${parseDate(event.beginsAt).toLowerCase()} au 
            ${parseDate(event.endsAt).toLowerCase()}`;

  return (
    <div className={styles.card}>
      <div className={styles.card_header}>
        <h3>{event.name}</h3>
        <p>{eventDate}</p>
      </div>
    </div>
  );
}

export default EventCard;
