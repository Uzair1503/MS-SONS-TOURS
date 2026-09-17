import { useQuery } from "@tanstack/react-query";
import { umrahApi } from "@/services/api";

export function useUmrahSettings() {
  return useQuery({
    queryKey: ["umrah-settings"],
    queryFn: async () => {
      const { data } = await umrahApi.getSettings();
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}