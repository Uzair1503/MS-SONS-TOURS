import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminApi, packageApi } from "@/services/api";
import { formatPrice, getStatusColor } from "@/lib/utils";
import ErrorState from "@/components/shared/ErrorState";

export default function AdminPackages() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-packages", search],
    queryFn: async () => {
      const params: Record<string, string> = { limit: "100" };
      if (search) params.search = search;
      const { data } = await packageApi.getAll(params);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePackage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const toggleStatus = useMutation({
    mutationFn: (pkg: any) => adminApi.updatePackage(pkg.id, { status: pkg.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package"] });
      queryClient.invalidateQueries({ queryKey: ["featured-packages"] });
    },
  });

  if (isError) {
    return (
      <ErrorState
        message={(error as any)?.response?.data?.error || "Failed to load packages. Check that the backend is running."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Packages</h2>
        <Button asChild><Link to="/admin/packages/new"><Plus className="w-4 h-4 mr-2" /> Add Package</Link></Button>
      </div>

      <Input placeholder="Search packages..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.data || []).map((pkg: any) => (
            <Card key={pkg.id}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={pkg.durationDays === 14 ? "secondary" : "default"}>{pkg.durationDays}D</Badge>
                    <Badge className={getStatusColor(pkg.status)}>{pkg.status}</Badge>
                  </div>
                  <p className="font-semibold">{pkg.title}</p>
                  <p className="text-sm text-gray-500">{pkg.airline?.name || "No airline"} | {pkg.roomPrices?.length || 0} room types</p>
                  {pkg.roomPrices?.length > 0 && (
                    <p className="text-sm text-brand-green font-medium">From {formatPrice(Math.min(...pkg.roomPrices.map((rp: any) => rp.price)))}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleStatus.mutate(pkg)}>
                    {pkg.status === "ACTIVE" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" asChild><Link to={`/admin/packages/${pkg.id}/edit`}><Edit className="w-4 h-4" /></Link></Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this package?")) deleteMutation.mutate(pkg.id); }}>
                    <Trash2 className="w-4 h-4 text-red-500" />
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
