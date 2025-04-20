import { useState } from "react";
import { useAddTimeControl } from "../../hooks/queries/use-add-time-control";

interface TimeControl {
  raw: string;
  time?: string;
  increment?: number;
  additionalTime?: number | null;
}

function RowForm({ timeControl }: { timeControl: TimeControl }) {
  const { mutate: addTimeControl } = useAddTimeControl();
  const [gameFormatData, setGameFormatData] = useState({
    raw: timeControl.raw,
    time: timeControl.time || "",
    increment: timeControl.increment || null,
    additionalTime: timeControl.additionalTime || null,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setGameFormatData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const normalizeTiming = (str: string) =>
    str
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[‘’‛´`]/g, "'")
      .replace(/[“”„‟]/g, '"')
      .replace(/[\u200B-\u200D\uFEFF]/g, "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedRaw = normalizeTiming(gameFormatData.raw);
    addTimeControl({ ...gameFormatData, raw: normalizedRaw });
  };

  return (
    <form onSubmit={handleSubmit} className="row">
      <input type="text" disabled value={timeControl.raw} />
      <input
        type="text"
        name="time"
        required
        onChange={handleChange}
        placeholder="Time"
      />
      <input
        type="number"
        name="increment"
        onChange={handleChange}
        placeholder="Increment"
      />
      <input
        type="number"
        name="additionalTime"
        onChange={handleChange}
        placeholder="Additional Time"
      />
      <button type="submit">Submit</button>
    </form>
  );
}

export default RowForm;
