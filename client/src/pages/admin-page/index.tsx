import { useEffect, useState } from "react";
import io from "socket.io-client";
import { useGetUnmatchedTimeControls } from "../../hooks/queries/use-get-unmatched-time-controls";
import { useTriggerScrapping } from "../../hooks/queries/useTriggerScrapping";
import RowForm from "./row-form";
import styles from "./styles.module.css";

const socket = io('http://localhost:3000'); // Replace with your backend URL

interface TimeControl {
  id: string;
  raw: string;
  time?: string;
  increment?: number;
  additionalTime?: number | null;
}

function AdminPage() {
  const { data: unmatchedTimeControls } = useGetUnmatchedTimeControls();
  const { mutate: triggerScrap, isPending } = useTriggerScrapping();

  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    socket.on('scrapper-log', ({ message }) => {
      setLogs(prev => [...prev, message]);
    });

    socket.on('scrapper-complete', ({ summary }) => {
      setLogs(prev => [...prev, summary]);
    });

    return () => {
      socket.off('scrapper-log');
      socket.off('scrapper-complete');
    };
  }, []);

  return (
    <div className="">
      {unmatchedTimeControls && (
        <div className={styles.container}>
          {unmatchedTimeControls.map((timeControl: TimeControl) => (
            <RowForm key={timeControl.id} timeControl={timeControl} />
          ))}
        </div>
      )}
      <button onClick={() => triggerScrap()} disabled={isPending}>
        {isPending ? "Scraping..." : "Trigger Scraping"}
      </button>

      <div className={styles.log_console}>
        <h3>Live Scraping Logs</h3>
        <pre className={styles.logs}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </pre>
      </div>
    </div>
  );
}

export default AdminPage;
