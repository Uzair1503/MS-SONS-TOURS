import { useQuery } from "@tanstack/react-query";
import { hotelApi } from "@/services/api";

export function useHotels(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["hotels", filters],
    queryFn: async () => {
      const { data } = await hotelApi.getAll(filters);
      return data;
    },
  });
}

export function useHotel(id: string) {
  return useQuery({
    queryKey: ["hotel", id],
    queryFn: async () => {
      const { data } = await hotelApi.getById(id);
      return data;
    },
    enabled: !!id,
  });
}
