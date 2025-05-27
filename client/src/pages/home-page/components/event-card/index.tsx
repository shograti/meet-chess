import {
  capitalizeFirstLetter,
  formatTimeControl,
  parseDate,
} from "../../../../utils";
import styles from "./styles.module.css";

interface Event {
  name: string;
  beginsAt: string;
  endsAt: string;
  pairingSystem: string;
  link: string;
  cashprize?: number;
  address: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  gameFormat: {
    time: string;
    increment: number;
    additionalTime?: number;
  };
}

function EventCard({ event }: { event: Event }) {
  console.log(event);
  const eventDate =
    event.beginsAt === event.endsAt
      ? parseDate(event.beginsAt)
      : `${parseDate(event.beginsAt).toLowerCase()} -
            ${parseDate(event.endsAt).toLowerCase()}`;

  const eventAddress = `${capitalizeFirstLetter(event.address.street)}, ${
    event.address.zip
  } - ${event.address.city}, ${event.address.country}`;

  return (
    <div className={styles.card}>
      <div className={styles.card_header}>
        <h3>{event.name}</h3>
      </div>
      <div className={styles.card_body}>
        <p>Date(s) : {eventDate}</p>
        <p>
          Time controls : {formatTimeControl(event.gameFormat)}{" "}
          {event.gameFormat.additionalTime && (
            <span>
              / {event.gameFormat.additionalTime} bonus time past 40 moves.
            </span>
          )}
        </p>
        <p>Pairings : {event.pairingSystem}</p>
        {event.cashprize && <p>{event.cashprize}</p>}
      </div>
      <div className={styles.card_footer}>
        <p>
          {" "}
          Address :{" "}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              eventAddress
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {eventAddress}
          </a>
        </p>
        <a
          className={styles.federation_link}
          href={event.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Federation link
        </a>
      </div>
    </div>
  );
}

export default EventCard;
