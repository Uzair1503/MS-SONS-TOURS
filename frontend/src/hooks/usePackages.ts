import { useQuery } from "@tanstack/react-query";
import { packageApi } from "@/services/api";

export function usePackages(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["packages", filters],
    queryFn: async () => {
      const { data } = await packageApi.getAll(filters);
      return data;
    },
  });
}

export function useFeaturedPackages(days: number) {
  return useQuery({
    queryKey: ["featured-packages", days],
    queryFn: async () => {
      const { data } = await packageApi.getFeatured(days);
      return data;
    },
  });
}

export function usePackage(id: string) {
  return useQuery({
    queryKey: ["package", id],
    queryFn: async () => {
      const { data } = await packageApi.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function usePackageCounts() {
  return useQuery({
    queryKey: ["package-counts"],
    queryFn: async () => {
      const { data } = await packageApi.getCounts();
      return data;
    },
  });
}
