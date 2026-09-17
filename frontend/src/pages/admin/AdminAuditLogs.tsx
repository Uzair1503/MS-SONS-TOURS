import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi } from "@/services/api";
import { formatDate } from "@/lib/utils";
import ErrorState from "@/components/shared/ErrorState";

const entities = [
  { value: "", label: "All entities" },
  { value: "package", label: "Packages" },
  { value: "hotel", label: "Hotels" },
  { value: "airline", label: "Airlines" },
  { value: "roomType", label: "Room Types" },
  { value: "inquiry", label: "Inquiries" },
  { value: "flightSchedule", label: "Flights" },
  { value: "adminUser", label: "Users" },
  { value: "setting", label: "Settings" },
];

const actionColor: Record<string, string> = {
  created: "bg-green-100 text-green-800",
  updated: "bg-blue-100 text-blue-800",
  deleted: "bg-red-100 text-red-800",
};

export default function AdminAuditLogs() {
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-audit-logs", entity, page],
    queryFn: async () => {
      const params: Record<string, string> = { limit: String(pageSize), page: String(page) };
      if (entity) params.entity = entity;
      const { data } = await adminApi.getAuditLogs(params);
      return data;
    },
  });

  const logs = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <History className="w-6 h-6 text-brand-green" /> Audit Logs
        </h2>
        <p className="text-sm text-gray-500">{data?.pagination?.total ?? 0} entries</p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={entity} onValueChange={(v) => { setEntity(v); setPage(1); }}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Filter by entity" /></SelectTrigger>
          <SelectContent>
            {entities.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState message={(error as any)?.response?.data?.error || "Failed to load audit logs."} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />)}</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="p-3 font-medium">Action</th>
                    <th className="p-3 font-medium">Entity</th>
                    <th className="p-3 font-medium">Performed By</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">No audit entries found.</td></tr>
                  ) : (
                    logs.map((log: any) => (
                      <tr key={log.id}>
                        <td className="p-3">
                          <Badge className={actionColor[log.action] || "bg-gray-100 text-gray-800"}>{log.action}</Badge>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{log.entity}</p>
                          {log.entityId && <p className="text-xs text-gray-400 truncate max-w-[200px]">{log.entityId}</p>}
                        </td>
                        <td className="p-3">{log.admin ? `${log.admin.name} (${log.admin.email})` : <span className="text-gray-400">System</span>}</td>
                        <td className="p-3 text-gray-500">{formatDate(log.createdAt)}</td>
                        <td className="p-3 text-gray-400">{log.ipAddress || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}