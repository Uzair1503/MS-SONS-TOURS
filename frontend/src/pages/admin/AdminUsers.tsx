import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, X, Save, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi } from "@/services/api";
import { formatDate } from "@/lib/utils";
import ErrorState from "@/components/shared/ErrorState";
import { useAuth } from "@/context/AuthContext";
import type { AdminUser } from "@/types";

interface UserForm {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  active: boolean;
}

const emptyForm: UserForm = { name: "", email: "", password: "", role: "STAFF", active: true };

function useCurrentUser() {
  const auth = useAuth();
  return { user: auth.user };
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useCurrentUser();
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [error, setError] = useState("");

  const { data, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await adminApi.getUsers({ limit: "100" });
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: UserForm) => {
      const body: any = { name: payload.name, role: payload.role, active: payload.active };
      if (payload.email) body.email = payload.email;
      if (!payload.id && payload.password) body.password = payload.password;
      if (payload.id && payload.password) body.password = payload.password;
      return form.id ? adminApi.updateUser(form.id, body) : adminApi.createUser(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setForm(emptyForm);
      setError("");
    },
    onError: (err: any) => setError(err?.response?.data?.error || "Failed to save user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (err: any) => setError(err?.response?.data?.error || "Failed to delete user"),
  });

  const toggleMutation = useMutation({
    mutationFn: (u: AdminUser & { __self?: boolean }) => adminApi.updateUser(u.id, { active: !u.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users = data?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { setError("Name and email are required"); return; }
    if (form.password && form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Staff & Admins</h2>
        <p className="text-sm text-gray-500">{users.length} users</p>
      </div>

      {isError ? (
        <ErrorState message={(loadError as any)?.response?.data?.error || "Failed to load users. Admin access required."} onRetry={() => refetch()} />
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-green" /> {form.id ? "Edit User" : "Add New User"}</p>
                {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{form.id ? "New Password" : "Password *"}</label>
                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={form.id ? "Leave blank to keep" : "Min 6 characters"} required={!form.id} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                  <div className="flex gap-3">
                    {form.id && (
                      <Button type="button" variant="outline" onClick={() => { setForm(emptyForm); setError(""); }}>
                        <X className="w-4 h-4 mr-2" /> Cancel
                      </Button>
                    )}
                    <Button type="submit" disabled={saveMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" /> {form.id ? "Update User" : "Add User"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />)}</div>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y divide-gray-100">
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No users found.</p>
                ) : (
                  users.map((u: AdminUser & { __self?: boolean }) => {
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <div key={u.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold">{u.name} {isSelf && <span className="text-xs text-gray-400 font-normal">(you)</span>}</p>
                            {u.role === "ADMIN" ? <Badge className="bg-brand-gold-dark text-white"><Shield className="w-3 h-3 mr-1" />Admin</Badge> : <Badge variant="outline"><ShieldCheck className="w-3 h-3 mr-1" />Staff</Badge>}
                            <Badge variant={u.active ? "success" : "destructive"}>{u.active ? "Active" : "Inactive"}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">{u.email} | Joined {formatDate(u.createdAt)}{u.lastLoginAt ? ` | Last login ${formatDate(u.lastLoginAt)}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => setForm({
                            id: u.id, name: u.name, email: u.email, password: "", role: u.role, active: u.active,
                          })}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate(u)} title={u.active ? "Deactivate" : "Activate"}>
                            <Badge variant="outline" className="text-xs">{u.active ? "Deactivate" : "Activate"}</Badge>
                          </Button>
                          <Button variant="ghost" size="sm" disabled={isSelf} onClick={() => { if (confirm(`Delete user "${u.name}"?`)) deleteMutation.mutate(u.id); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}