import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/services/api";
import type { UmrahSettings } from "@/types";
import ErrorState from "@/components/shared/ErrorState";

function NumField({ label, hint, value, onChange, step = "1" }: { label: string; hint?: string; value: string; onChange: (v: string) => void; step?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Input type="number" min={0} step={step} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function AdminRates() {
  const queryClient = useQueryClient();

  const [validity, setValidity] = useState("2026-09-30");
  const [condition, setCondition] = useState("");
  const [groupPaxMin, setGroupPaxMin] = useState("1");
  const [groupPaxMax, setGroupPaxMax] = useState("49");
  const [sarToPkr, setSarToPkr] = useState("75");
  const [visaBase, setVisaBase] = useState("580");
  const [tier1, setTier1] = useState("705");
  const [tier2, setTier2] = useState("680");
  const [tier3, setTier3] = useState("655");
  const [tier4, setTier4] = useState("630");
  const [infantVisa, setInfantVisa] = useState("465");
  const [ziaratMakkah, setZiaratMakkah] = useState("12");
  const [ziaratMadina, setZiaratMadina] = useState("12");
  const [terms, setTerms] = useState<string[]>([""]);
  const [saveError, setSaveError] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-umrah-settings"],
    queryFn: async () => { const { data } = await adminApi.getUmrahSettings(); return data; },
  });

  useEffect(() => {
    const s = data?.data as UmrahSettings | undefined;
    if (!s) return;
    setValidity(s.validity);
    setCondition(s.condition);
    setGroupPaxMin(String(s.groupPax.min));
    setGroupPaxMax(String(s.groupPax.max));
    setSarToPkr(String(s.currency.sarToPkr));
    setVisaBase(String(s.visa.base));
    setTier1(String(s.visa.flightTiers["1"] ?? ""));
    setTier2(String(s.visa.flightTiers["2"] ?? ""));
    setTier3(String(s.visa.flightTiers["3"] ?? ""));
    setTier4(String(s.visa.flightTiers["4"] ?? ""));
    setInfantVisa(String(s.visa.infant));
    setZiaratMakkah(String(s.ziarat.makkah));
    setZiaratMadina(String(s.ziarat.madinah));
    setTerms(s.terms.length > 0 ? s.terms : [""]);
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updateUmrahSettings({
        validity,
        condition,
        groupPaxMin: Number(groupPaxMin),
        groupPaxMax: Number(groupPaxMax),
        sarToPkr: Number(sarToPkr),
        visaBase: Number(visaBase),
        flightTiers: { 1: Number(tier1), 2: Number(tier2), 3: Number(tier3), 4: Number(tier4) },
        infantVisa: Number(infantVisa),
        ziaratMakkah: Number(ziaratMakkah),
        ziaratMadina: Number(ziaratMadina),
        terms: terms.map((t) => t).filter((t) => t.trim().length > 0),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["umrah-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-umrah-settings"] });
      setSaveError("");
    },
    onError: (err: any) => setSaveError(err?.response?.data?.error || "Failed to save rates"),
  });

  if (isError) {
    return <ErrorState message={(error as any)?.response?.data?.error || "Failed to load umrah rates."} onRetry={() => refetch()} />;
  }

  if (isLoading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Umrah Rates &amp; Settings</h2>
          <p className="text-sm text-gray-500">Everything is stored in the database and reflected on the Custom Package builder instantly.</p>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {mutation.isPending ? "Saving..." : "Save All"}
        </Button>
      </div>

      {saveError && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{saveError}</p>}
      {mutation.isSuccess && !saveError && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">Rates saved and published.</p>}

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Validity (check-in date)</label>
              <Input type="date" value={validity} onChange={(e) => setValidity(e.target.value)} />
            </div>
            <div><label className="block text-sm font-medium mb-1">Condition</label><Input value={condition} onChange={(e) => setCondition(e.target.value)} /></div>
            <NumField label="Group Pax Minimum" value={groupPaxMin} onChange={setGroupPaxMin} />
            <NumField label="Group Pax Maximum" value={groupPaxMax} onChange={setGroupPaxMax} />
            <NumField label="SAR → PKR Exchange Rate" hint="1 SAR equals this many PKR. Changing it updates all final PKR prices." value={sarToPkr} onChange={setSarToPkr} step="0.01" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Visa &amp; Flight (SAR)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <NumField label="Visa Base Rate (per person)" value={visaBase} onChange={setVisaBase} />
            <NumField label="Flight — 1 Pax (per person)" value={tier1} onChange={setTier1} />
            <NumField label="Flight — 2 Pax (per person)" value={tier2} onChange={setTier2} />
            <NumField label="Flight — 3 Pax (per person)" value={tier3} onChange={setTier3} />
            <NumField label="Flight — 4+ Pax (per person)" value={tier4} onChange={setTier4} />
            <NumField label="Infant Visa Rate (per infant)" value={infantVisa} onChange={setInfantVisa} />
          </div>
          <p className="text-xs text-gray-400 mt-3">Flight tier applies by group size (adults + children): 1 pax → 1 pax rate, 2 → 2 pax, 3 → 3 pax, 4+ → 4 pax.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ziarat Add-ons (SAR)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumField label="Makkah Ziarat (per person)" value={ziaratMakkah} onChange={setZiaratMakkah} />
            <NumField label="Madinah Ziarat (per person)" value={ziaratMadina} onChange={setZiaratMadina} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Terms &amp; Conditions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {terms.map((term, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={term}
                onChange={(e) => setTerms(terms.map((t, i) => (i === idx ? e.target.value : t)))}
                placeholder={`Term ${idx + 1}`}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setTerms(terms.filter((_, i) => i !== idx))} disabled={terms.length === 1}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setTerms([...terms, ""])}>
            <Plus className="w-4 h-4 mr-2" /> Add Term
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        {saveError && <p className="text-sm text-red-600 self-center">{saveError}</p>}
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {mutation.isPending ? "Saving..." : "Save All"}
        </Button>
      </div>
    </div>
  );
}