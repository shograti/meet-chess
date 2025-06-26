async function triggerScrapping() {
  const response = await fetch(

    `${import.meta.env.VITE_API_URL}/Scraper/trigger-scrapping`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch unmatched time controls");
  }
  return response.json();
}

async function getUnmatchedTimeControls() {
  const response = await fetch(

    `${import.meta.env.VITE_API_URL}/game-formats/unmatched-time-controls`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch unmatched time controls");
  }
  return response.json();
}

async function addTimeControl(
  raw: string,
  time: string,
  increment: number | null,
  additionalTime: number | null
) {
  const response = await fetch(
    //meta vite env
    `${import.meta.env.VITE_API_URL}/game-formats/add-time-control`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw,
        time,
        increment,
        additionalTime,
      }),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to add time control");
  }
  return response.json();
}

export { getUnmatchedTimeControls, addTimeControl, triggerScrapping };
