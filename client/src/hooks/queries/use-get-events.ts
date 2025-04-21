import { useQuery } from "@tanstack/react-query";
import { getEvents } from "../../api/events";

export const useGetEvents = (page: number) => {
  return useQuery({
    queryKey: ["events", page],
    queryFn: () => getEvents(page),
    staleTime: 1000 * 60,
  });
};
