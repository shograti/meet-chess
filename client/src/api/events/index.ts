async function getEvents(page = 1, limit = 9) {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/events?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  return response.json();
}

export { getEvents };
