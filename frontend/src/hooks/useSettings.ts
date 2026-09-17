import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/services/api";

export function useSettings() {
  return useQuery<Record<string, string>>({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await settingsApi.getPublic();
      return data.data;
    },
  });
}
