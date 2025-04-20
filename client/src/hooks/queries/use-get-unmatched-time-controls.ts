import { useQuery } from "@tanstack/react-query";
import { getUnmatchedTimeControls } from "../../api/admin";

export const useGetUnmatchedTimeControls = () => {
  return useQuery({
    queryKey: ["unmatched-time-controls"],
    queryFn: getUnmatchedTimeControls,
    staleTime: 0,
  });
};
