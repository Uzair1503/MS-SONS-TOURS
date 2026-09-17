import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/services/api";
import ErrorState from "@/components/shared/ErrorState";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => { const { data } = await adminApi.getSettings(); return data; },
  });

  useEffect(() => {
    if (data?.data) {
      const map: Record<string, string> = {};
      data.data.forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = Object.entries(settings).map(([key, value]) => {
        const existing = data?.data?.find((s: any) => s.key === key);
        return { key, value, category: existing?.category || "general" };
      });
      return adminApi.setSettingsBulk(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-settings"] }); setSaveError(""); },
    onError: (err: any) => setSaveError(err?.response?.data?.error || "Failed to save settings"),
  });

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isError) {
    return <ErrorState message={(error as any)?.response?.data?.error || "Failed to load settings."} onRetry={() => refetch()} />;
  }

  if (isLoading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Settings</h2>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="w-4 h-4 mr-2" /> {mutation.isPending ? "Saving..." : "Save All"}
        </Button>
      </div>

      {saveError && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{saveError}</p>}

      <Card>
        <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Business Name</label><Input value={settings.business_name || ""} onChange={(e) => updateSetting("business_name", e.target.value)} /></div>
            <div><label className="block text-sm font-medium mb-1">WhatsApp Number</label><Input value={settings.whatsapp_number || ""} onChange={(e) => updateSetting("whatsapp_number", e.target.value)} /></div>
            <div><label className="block text-sm font-medium mb-1">Phone Number</label><Input value={settings.phone_number || ""} onChange={(e) => updateSetting("phone_number", e.target.value)} /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><Input value={settings.email || ""} onChange={(e) => updateSetting("email", e.target.value)} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Address</label><Input value={settings.address || ""} onChange={(e) => updateSetting("address", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Website Title</label><Input value={settings.website_title || ""} onChange={(e) => updateSetting("website_title", e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1">Website Description</label><Textarea value={settings.website_description || ""} onChange={(e) => updateSetting("website_description", e.target.value)} rows={3} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Rates Disclaimer</label><Textarea value={settings.terms_rates || ""} onChange={(e) => updateSetting("terms_rates", e.target.value)} rows={2} /></div>
          <div><label className="block text-sm font-medium mb-1">Booking Terms</label><Textarea value={settings.terms_booking || ""} onChange={(e) => updateSetting("terms_booking", e.target.value)} rows={2} /></div>
          <div><label className="block text-sm font-medium mb-1">Cancellation Policy</label><Textarea value={settings.terms_cancellation || ""} onChange={(e) => updateSetting("terms_cancellation", e.target.value)} rows={2} /></div>
          <div><label className="block text-sm font-medium mb-1">Visa Terms</label><Textarea value={settings.terms_visa || ""} onChange={(e) => updateSetting("terms_visa", e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
