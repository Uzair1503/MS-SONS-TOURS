import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, airlineApi } from "@/services/api";
import { formatDate } from "@/lib/utils";
import ErrorState from "@/components/shared/ErrorState";

interface FlightForm {
  id?: string;
  airlineId: string;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  returnDate: string;
  flightNumber: string;
  baggageDetails: string;
  status: string;
}

const emptyForm: FlightForm = {
  airlineId: "",
  departureCity: "Islamabad",
  arrivalCity: "Jeddah",
  departureDate: "",
  returnDate: "",
  flightNumber: "",
  baggageDetails: "",
  status: "active",
};

export default function AdminFlights() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FlightForm>(emptyForm);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data, isLoading, isError, error: queryError, refetch } = useQuery({
    queryKey: ["admin-flights", page],
    queryFn: async () => {
      const { data } = await adminApi.getFlights({ limit: String(pageSize), page: String(page) });
      return data;
    },
  });

  const { data: airlinesData } = useQuery({
    queryKey: ["airlines-flights"],
    queryFn: async () => { const { data } = await airlineApi.getAll({ limit: "100" }); return data; },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: FlightForm) => {
      const body = {
        airlineId: payload.airlineId,
        departureCity: payload.departureCity,
        arrivalCity: payload.arrivalCity,
        departureDate: payload.departureDate,
        returnDate: payload.returnDate || null,
        flightNumber: payload.flightNumber || null,
        baggageDetails: payload.baggageDetails || null,
        status: payload.status,
      };
      return form.id ? adminApi.updateFlight(form.id, body) : adminApi.createFlight(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flights"] });
      setForm(emptyForm);
      setError("");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || "Failed to save flight schedule");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFlight(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-flights"] }),
  });

  const airlines = airlinesData?.data || [];
  const flights = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.airlineId || !form.departureDate) {
      setError("Airline and departure date are required");
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Flight Schedules</h2>
        <p className="text-sm text-gray-500">{data?.pagination?.total ?? 0} flights</p>
      </div>

      {isError ? (
        <ErrorState message={(queryError as any)?.response?.data?.error || "Failed to load flight schedules."} onRetry={() => refetch()} />
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>{form.id ? "Edit Flight" : "Add Flight"}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Airline *</label>
                    <Select value={form.airlineId} onValueChange={(v) => setForm({ ...form, airlineId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select airline" /></SelectTrigger>
                      <SelectContent>
                        {airlines.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Departure Date *</label>
                    <Input type="date" value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Return Date</label>
                    <Input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Flight Number</label>
                    <Input value={form.flightNumber} onChange={(e) => setForm({ ...form, flightNumber: e.target.value })} placeholder="e.g. PF 715" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Departure City</label>
                    <Input value={form.departureCity} onChange={(e) => setForm({ ...form, departureCity: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Arrival City</label>
                    <Input value={form.arrivalCity} onChange={(e) => setForm({ ...form, arrivalCity: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Baggage Details</label>
                    <Input value={form.baggageDetails} onChange={(e) => setForm({ ...form, baggageDetails: e.target.value })} placeholder="e.g. 30kg checked + 7kg hand" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  {form.id && (
                    <Button type="button" variant="outline" onClick={() => { setForm(emptyForm); setError(""); }}>
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={saveMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" /> {form.id ? "Update Flight" : "Add Flight"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />)}</div>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y divide-gray-100">
                {flights.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No flight schedules yet. Add one above.</p>
                ) : (
                  flights.map((f: any) => (
                    <div key={f.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold">{f.airline?.name || "Unknown airline"}</p>
                          {f.flightNumber && <Badge variant="outline">{f.flightNumber}</Badge>}
                          <Badge variant={f.status === "active" ? "success" : "secondary"}>{f.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {f.departureCity} → {f.arrivalCity} | {formatDate(f.departureDate)}
                          {f.returnDate ? ` → ${formatDate(f.returnDate)}` : ""}
                        </p>
                        {f.baggageDetails && <p className="text-xs text-gray-400 mt-0.5">{f.baggageDetails}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setForm({
                          id: f.id,
                          airlineId: f.airlineId,
                          departureCity: f.departureCity,
                          arrivalCity: f.arrivalCity,
                          departureDate: f.departureDate?.split("T")[0] || "",
                          returnDate: f.returnDate ? f.returnDate.split("T")[0] : "",
                          flightNumber: f.flightNumber || "",
                          baggageDetails: f.baggageDetails || "",
                          status: f.status,
                        })}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this flight schedule?")) deleteMutation.mutate(f.id); }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}