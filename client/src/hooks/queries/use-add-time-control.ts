import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTimeControl } from "../../api/admin";

export const useAddTimeControl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      raw,
      time,
      increment,
      additionalTime,
    }: {
      raw: string;
      time: string;
      increment: number | null;
      additionalTime: number | null;
    }) => addTimeControl(raw, time, increment, additionalTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unmatched-time-controls"] });
    },
  });
};
