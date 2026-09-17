import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminApi, airlineApi } from "@/services/api";
import ErrorState from "@/components/shared/ErrorState";

export default function AdminAirlines() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-airlines"],
    queryFn: async () => { const { data } = await airlineApi.getAll(); return data; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAirline(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-airlines"] }),
    onError: (err: any) => alert(err?.response?.data?.error || "Failed to delete airline"),
  });

  if (isError) {
    return <ErrorState message={(error as any)?.response?.data?.error || "Failed to load airlines."} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Airlines</h2>
        <Button asChild><Link to="/admin/airlines/new"><Plus className="w-4 h-4 mr-2" /> Add Airline</Link></Button>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.data || []).map((airline: any) => (
            <Card key={airline.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={airline.active ? "success" : "destructive"}>{airline.active ? "Active" : "Inactive"}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" asChild><Link to={`/admin/airlines/${airline.id}/edit`}><Edit className="w-4 h-4" /></Link></Button>
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(airline.id); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
                <p className="font-semibold">{airline.name}</p>
                <p className="text-sm text-gray-500">{airline.code} | {airline.departureCity} → {airline.arrivalCity}</p>
                {airline.baggageAllowance && <p className="text-xs text-gray-400 mt-1">{airline.baggageAllowance}</p>}
                {airline._count && <p className="text-xs text-brand-green mt-1">{airline._count.packages} packages</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
