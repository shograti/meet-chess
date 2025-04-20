import { useGetUnmatchedTimeControls } from "../../hooks/queries/use-get-unmatched-time-controls";
import { useTriggerScrapping } from "../../hooks/queries/useTriggerScrapping";
import RowForm from "./row-form";
import styles from "./styles.module.css";

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
    </div>
  );
}

export default AdminPage;
