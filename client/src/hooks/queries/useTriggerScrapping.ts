import { useMutation, useQueryClient } from "@tanstack/react-query";
import { triggerScrapping } from "../../api/admin";

export function useTriggerScrapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerScrapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unmatched-time-controls"] });
    },
  });
}
