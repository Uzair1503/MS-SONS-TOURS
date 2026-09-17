import { useQuery } from "@tanstack/react-query";
import { airlineApi } from "@/services/api";

export function useAirlines(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["airlines", filters],
    queryFn: async () => {
      const { data } = await airlineApi.getAll(filters);
      return data;
    },
  });
}
