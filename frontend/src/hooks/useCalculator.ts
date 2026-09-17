import { useMutation } from "@tanstack/react-query";
import { packageApi } from "@/services/api";

export function useCalculator() {
  return useMutation({
    mutationFn: (data: { packageId: string; roomTypeId: string; adults: number; children: number; infants: number }) =>
      packageApi.calculate(data).then((res) => res.data),
  });
}
