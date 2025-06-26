function parseDate(dateString: string): string {
  const date = new Date(dateString);

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // +1 because months are 0-based
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

type TimeControl = {
  time: string; // "HH:MM:SS"
  increment: number; // in seconds
  additionalTime: number | null;
};

function formatTimeControl({ time, increment }: TimeControl): string {
  const [hoursStr, minutesStr, secondsStr] = time.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const seconds = parseInt(secondsStr, 10);

  let timePart: string;

  if (hours > 0) {
    timePart = `${hours}h${String(minutes).padStart(2, "0")}`;
  } else {
    const totalMinutes = minutes + Math.round(seconds / 60);
    timePart = `${totalMinutes}`;
  }

  return `${timePart}+${increment}`;
}

function formatToDDMMYYYY(isoString: string): string {
  const date = new Date(isoString);

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = String(date.getUTCFullYear());

  return `${day}/${month}/${year}`;
}


export { parseDate, capitalizeFirstLetter, formatTimeControl, formatToDDMMYYYY };
