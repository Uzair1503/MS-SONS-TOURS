import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi } from "@/services/api";
import { getStatusColor, formatDate } from "@/lib/utils";
import ErrorState from "@/components/shared/ErrorState";

export default function AdminInquiries() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-inquiries", statusFilter, search],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await adminApi.getInquiries(params);
      return data;
    },
  });

  const { data: detailData } = useQuery({
    queryKey: ["admin-inquiry", selectedId],
    queryFn: async () => {
      const { data } = await adminApi.getInquiry(selectedId!);
      return data;
    },
    enabled: !!selectedId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...rest }: any) => adminApi.updateInquiry(id, rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inquiry"] });
      setSavedNote(detailData?.data?.adminNotes || "");
    },
  });

  const selected = detailData?.data;

  useEffect(() => {
    setNotesDraft(selected?.adminNotes || "");
    setSavedNote(selected?.adminNotes || "");
  }, [selected?.id, selected?.adminNotes]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Inquiries</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name, phone, reference..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["NEW", "CONTACTED", "QUOTED", "CONFIRMED", "CANCELLED", "COMPLETED"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {isError ? (
            <ErrorState message={(error as any)?.response?.data?.error || "Failed to load inquiries. Check that the backend is running."} onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />)}</div>
          ) : (data?.data || []).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No inquiries found.</p>
          ) : (
            (data?.data || []).map((inquiry: any) => (
              <Card key={inquiry.id} className={`cursor-pointer hover:shadow-md transition-shadow ${selectedId === inquiry.id ? "ring-2 ring-brand-green" : ""}`} onClick={() => setSelectedId(inquiry.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{inquiry.fullName}</p>
                        <Badge className={getStatusColor(inquiry.status)}>{inquiry.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{inquiry.referenceNumber} | {inquiry.whatsappNumber} | {formatDate(inquiry.createdAt)}</p>
                    </div>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div>
          {selected ? (
            <Card className="sticky top-24">
              <CardHeader><CardTitle className="text-lg">{selected.fullName}</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <p><span className="text-gray-500">Ref:</span> {selected.referenceNumber}</p>
                  <p><span className="text-gray-500">WhatsApp:</span> {selected.whatsappNumber}</p>
                  {selected.email && <p><span className="text-gray-500">Email:</span> {selected.email}</p>}
                  <p><span className="text-gray-500">Adults:</span> {selected.adults} | Children: {selected.children} | Infants: {selected.infants}</p>
                  {selected.package && <p><span className="text-gray-500">Package:</span> {selected.package.title}</p>}
                  {selected.message && <p><span className="text-gray-500">Message:</span> {selected.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Update Status</label>
                  <Select value={selected.status} onValueChange={(v) => updateMutation.mutate({ id: selected.id, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["NEW", "CONTACTED", "QUOTED", "CONFIRMED", "CANCELLED", "COMPLETED"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Admin Notes</label>
                  <Textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={3}
                    placeholder="Add notes..."
                  />
                  <div className="flex items-center justify-end gap-3 mt-2">
                    {notesDraft !== savedNote && <span className="text-xs text-gray-400">Unsaved changes</span>}
                    <Button
                      size="sm"
                      disabled={updateMutation.isPending || notesDraft === savedNote}
                      onClick={() => updateMutation.mutate({ id: selected.id, adminNotes: notesDraft })}
                    >
                      <Save className="w-4 h-4 mr-1" /> {updateMutation.isPending ? "Saving..." : "Save Notes"}
                    </Button>
                  </div>
                  {updateMutation.isError && <p className="text-red-500 text-xs mt-1">Failed to save. Please try again.</p>}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <p>Select an inquiry to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
