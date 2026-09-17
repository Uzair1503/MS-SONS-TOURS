import { useQuery } from "@tanstack/react-query";
import { roomTypeApi } from "@/services/api";

export function useRoomTypes() {
  return useQuery({
    queryKey: ["room-types"],
    queryFn: async () => {
      const { data } = await roomTypeApi.getAll();
      return data;
    },
  });
}
