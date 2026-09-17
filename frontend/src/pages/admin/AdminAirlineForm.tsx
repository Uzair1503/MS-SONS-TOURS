import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { adminApi, airlineApi } from "@/services/api";

export default function AdminAirlineForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existingData } = useQuery({
    queryKey: ["admin-airline", id],
    queryFn: async () => { const { data } = await airlineApi.getById(id!); return data; },
    enabled: isEdit,
  });

  const [form, setForm] = useState({
    name: "", code: "", description: "", baggageAllowance: "", departureCity: "Islamabad", arrivalCity: "Jeddah", active: true,
  });

  useEffect(() => {
    if (existingData?.data) {
      const a = existingData.data;
      setForm({ name: a.name, code: a.code, description: a.description || "", baggageAllowance: a.baggageAllowance || "", departureCity: a.departureCity, arrivalCity: a.arrivalCity, active: a.active });
    }
  }, [existingData]);

  const mutation = useMutation({
    mutationFn: async (data: any) => isEdit ? adminApi.updateAirline(id!, data) : adminApi.createAirline(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-airlines"] }); navigate("/admin/airlines"); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/airlines")}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <h2 className="text-2xl font-display font-bold">{isEdit ? "Edit Airline" : "New Airline"}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Airline Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="block text-sm font-medium mb-1">Code *</label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
              <div><label className="block text-sm font-medium mb-1">Departure City</label><Input value={form.departureCity} onChange={(e) => setForm({ ...form, departureCity: e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Arrival City</label><Input value={form.arrivalCity} onChange={(e) => setForm({ ...form, arrivalCity: e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Baggage Allowance</label><Input value={form.baggageAllowance} onChange={(e) => setForm({ ...form, baggageAllowance: e.target.value })} placeholder="e.g. 30kg checked + 7kg hand" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm font-medium">Active</span>
            </label>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/airlines")}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : isEdit ? "Update Airline" : "Create Airline"}</Button>
        </div>
      </form>
    </div>
  );
}
