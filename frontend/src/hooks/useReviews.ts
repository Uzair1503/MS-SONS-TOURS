import { useQuery } from "@tanstack/react-query";
import { reviewApi } from "@/services/api";
import type { Review } from "@/types";

export function useReviews() {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data } = await reviewApi.getAll();
      // Map the API shape (comment/city/createdAt) onto the Review type used by
      // the testimonials section (text/location/date).
      return (data.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        text: r.comment,
        city: r.city,
        location: r.city,
        date: r.createdAt,
        imageUrl: r.imageUrl,
      } as Review));
    },
  });
}