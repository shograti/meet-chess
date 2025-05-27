import { useState } from "react";
import { useGetEvents } from "../../hooks/queries/use-get-events";
import styles from "./styles.module.css";
import EventCard from "./components/event-card";

function HomePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, isFetching } = useGetEvents(page);

  const events = data?.items || [];
  const totalPages = data?.meta?.totalPages || 1;

  const handlePrev = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className={styles.container}>
      <h1>Events</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Something went wrong</p>
      ) : (
        <>
          <div className={styles.grid}>
            {events.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>

          <div className={styles.pagination}>
            <button onClick={handlePrev} disabled={page === 1}>
              ← Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button onClick={handleNext} disabled={page === totalPages}>
              Next →
            </button>
            {isFetching && <span> Loading...</span>}
          </div>
        </>
      )}
    </div>
  );
}

export default HomePage;
