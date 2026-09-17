import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminApi, roomTypeApi } from "@/services/api";
import ErrorState from "@/components/shared/ErrorState";

export default function AdminRoomTypes() {
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ["admin-roomtypes"],
    queryFn: async () => { const { data } = await roomTypeApi.getAll(); return data; },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createRoomType(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-roomtypes"] }); setNewName(""); setNewCode(""); },
    onError: (err: any) => setError(err?.response?.data?.error || "Failed to create room type"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => adminApi.updateRoomType(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-roomtypes"] }); setEditingId(null); },
    onError: (err: any) => setError(err?.response?.data?.error || "Failed to update room type"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteRoomType(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-roomtypes"] }),
    onError: (err: any) => setError(err?.response?.data?.error || "Could not delete. Room type may be in use."),
  });

  if (isError) {
    return <ErrorState message={(loadError as any)?.response?.data?.error || "Failed to load room types."} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Room Types</h2>

      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Input placeholder="Room type name" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-48" />
          <Input placeholder="Code (optional)" value={newCode} onChange={(e) => setNewCode(e.target.value)} className="w-32" />
          <Button onClick={() => { if (newName) createMutation.mutate({ name: newName, code: newCode || undefined }); }} disabled={!newName || createMutation.isPending}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {(data?.data || []).map((rt: any) => (
            <Card key={rt.id}>
              <CardContent className="p-3 flex items-center justify-between">
                {editingId === rt.id ? (
                  <div className="flex items-center gap-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-48" />
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: rt.id, data: { name: editName } })}><Check className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{rt.name}</p>
                    {rt.code && <Badge variant="outline">{rt.code}</Badge>}
                    <Badge variant={rt.active ? "success" : "destructive"}>{rt.active ? "Active" : "Inactive"}</Badge>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(rt.id); setEditName(rt.name); }}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(rt.id); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
