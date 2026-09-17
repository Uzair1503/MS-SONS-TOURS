import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Eye, EyeOff, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/services/api";
import { formatDate } from "@/lib/utils";
import ErrorState from "@/components/shared/ErrorState";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`w-3.5 h-3.5 ${star <= rating ? "text-brand-gold fill-brand-gold" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data } = await adminApi.getReviews();
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleReviewApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const reviews = (data?.data || []).filter((r: any) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (r.name || "").toLowerCase().includes(q) || (r.city || "").toLowerCase().includes(q) || (r.comment || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Reviews</h2>
        <p className="text-sm text-gray-500">{reviews.length} review(s)</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      {isError ? (
        <ErrorState message={(error as any)?.response?.data?.error || "Failed to load reviews. Check that the backend is running."} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No reviews found.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reviews.map((review: any) => (
            <Card key={review.id} className={`${review.isApproved ? "" : "opacity-75"}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {review.imageUrl ? (
                      <img src={review.imageUrl} alt={review.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 text-brand-gold fill-brand-gold" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{review.name}</p>
                        <Badge className={review.isApproved ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {review.isApproved ? "Approved" : "Hidden"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        <Stars rating={review.rating} /> <span className="ml-1">{review.city || "—"} | {formatDate(review.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">"{review.comment}"</p>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMutation.mutate(review.id)}
                    disabled={toggleMutation.isPending || deleteMutation.isPending}
                  >
                    {review.isApproved ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {review.isApproved ? "Hide" : "Unhide"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => { if (window.confirm("Delete this review permanently?")) deleteMutation.mutate(review.id); }}
                    disabled={toggleMutation.isPending || deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}