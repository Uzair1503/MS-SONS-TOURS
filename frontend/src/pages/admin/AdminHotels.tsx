import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminApi, hotelApi, packageApi } from "@/services/api";
import ErrorState from "@/components/shared/ErrorState";

export default function AdminHotels() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-hotels", search],
    queryFn: async () => {
      const params: Record<string, string> = { limit: "100" };
      if (search) params.search = search;
      const { data } = await hotelApi.getAll(params);
      return data;
    },
  });

  const { data: packagesData } = useQuery({
    queryKey: ["admin-hotel-associations"],
    queryFn: async () => {
      const { data } = await packageApi.getAll({ limit: "100" });
      return data;
    },
    staleTime: 60_000,
  });

  const associationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (packagesData?.data || []).forEach((pkg: any) => {
      if (pkg.makkahHotel?.hotel?.id) counts[pkg.makkahHotel.hotel.id] = (counts[pkg.makkahHotel.hotel.id] || 0) + 1;
      if (pkg.madinahHotel?.hotel?.id) counts[pkg.madinahHotel.hotel.id] = (counts[pkg.madinahHotel.hotel.id] || 0) + 1;
    });
    return counts;
  }, [packagesData]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteHotel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-hotels"] }),
  });

  if (isError) {
    return (
      <ErrorState
        message={(error as any)?.response?.data?.error || "Failed to load hotels. Check that the backend is running."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Hotels</h2>
        <Button asChild><Link to="/admin/hotels/new"><Plus className="w-4 h-4 mr-2" /> Add Hotel</Link></Button>
      </div>
      <Input placeholder="Search hotels..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      {deleteMutation.isError && (
        <p className="text-red-500 text-sm">{(deleteMutation.error as any)?.response?.data?.error || "Could not delete this hotel. It may be linked to packages."}</p>
      )}
      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {(data?.data || []).map((hotel: any) => {
            const assocCount = associationCounts[hotel.id] || 0;
            return (
              <Card key={hotel.id}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <img
                      src={hotel.images?.[0] || "/images/hotels/placeholder-hotel.svg"}
                      alt={hotel.name}
                      className="w-20 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/hotels/placeholder-hotel.svg";
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold truncate">{hotel.name}</p>
                        <Badge variant={hotel.city === "Makkah" ? "default" : "secondary"}>{hotel.city}</Badge>
                        <Badge variant="outline">{hotel.category}</Badge>
                        {hotel.active ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {hotel.distanceFromHaram || hotel.distanceFromMasjidNabawi || "No distance info"}
                        {hotel.location ? ` | ${hotel.location}` : ""}
                      </p>
                      <p className="text-xs text-brand-green mt-0.5">
                        {assocCount > 0 ? `${assocCount} package${assocCount === 1 ? "" : "s"} • ` : ""}
                        {Array.isArray(hotel.images) && hotel.images.length > 0 ? `${Math.ceil(hotel.images.length / 2)} photo${Math.ceil(hotel.images.length / 2) === 1 ? "" : "s"}` : <span className="inline-flex items-center gap-1"><ImageOff className="w-3 h-3" /> No photos</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" asChild><Link to={`/admin/hotels/${hotel.id}/edit`}><Edit className="w-4 h-4" /></Link></Button>
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this hotel?")) deleteMutation.mutate(hotel.id); }}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {(data?.data || []).length === 0 && (
            <p className="text-gray-500 text-center py-8">No hotels found.</p>
          )}
        </div>
      )}
    </div>
  );
}