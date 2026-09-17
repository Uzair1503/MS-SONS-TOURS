import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, packageApi, airlineApi, hotelApi, roomTypeApi } from "@/services/api";

export default function AdminPackageForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: airlinesData } = useQuery({ queryKey: ["airlines-admin"], queryFn: async () => { const { data } = await airlineApi.getAll(); return data; } });
  const { data: hotelsData } = useQuery({ queryKey: ["hotels-admin"], queryFn: async () => { const { data } = await hotelApi.getAll({ limit: "100" }); return data; } });
  const { data: roomTypesData } = useQuery({ queryKey: ["roomtypes-admin"], queryFn: async () => { const { data } = await roomTypeApi.getAll(); return data; } });

  const { data: existingData } = useQuery({
    queryKey: ["admin-package", id],
    queryFn: async () => {
      const { data } = await packageApi.getById(id!);
      return data;
    },
    enabled: isEdit,
  });

  const [form, setForm] = useState({
    title: "", packageCode: "", durationDays: 14, status: "DRAFT", description: "", provider: "",
    sortOrder: "",
    airlineId: "", departureCity: "Islamabad", arrivalCity: "Jeddah",
    departureDate: "", returnDate: "", departureDates: "", returnDates: "", baggageDetails: "",
    infantRate: "", childRate: "", childWithoutBedRate: "",
    visaIncluded: true, ticketIncluded: true, hotelIncluded: true, transportIncluded: true, guideIncluded: false, ziyaratIncluded: false,
    makkahHotelId: "", makkahNights: "", makkahDistance: "",
    madinahHotelId: "", madinahNights: "", madinahDistance: "",
    termsAndConditions: "",
  });

  const [roomPrices, setRoomPrices] = useState<{ roomTypeId: string; price: string; available: boolean }[]>([
    { roomTypeId: "", price: "", available: true },
  ]);

  useEffect(() => {
    if (existingData?.data) {
      const pkg = existingData.data;
      setForm({
        title: pkg.title || "", packageCode: pkg.packageCode || "", durationDays: pkg.durationDays || 14,
        status: pkg.status || "DRAFT", description: pkg.description || "", provider: pkg.provider || "",
        sortOrder: pkg.sortOrder?.toString() || "0",
        airlineId: pkg.airlineId || "", departureCity: pkg.departureCity || "Islamabad", arrivalCity: pkg.arrivalCity || "Jeddah",
        departureDate: pkg.departureDate ? pkg.departureDate.split("T")[0] : "",
        returnDate: pkg.returnDate ? pkg.returnDate.split("T")[0] : "",
        departureDates: pkg.departureDates || "",
        returnDates: pkg.returnDates || "",
        baggageDetails: pkg.baggageDetails || "",
        infantRate: pkg.infantRate?.toString() || "", childRate: pkg.childRate?.toString() || "",
        childWithoutBedRate: pkg.childWithoutBedRate?.toString() || "",
        visaIncluded: pkg.visaIncluded, ticketIncluded: pkg.ticketIncluded, hotelIncluded: pkg.hotelIncluded,
        transportIncluded: pkg.transportIncluded, guideIncluded: pkg.guideIncluded, ziyaratIncluded: pkg.ziyaratIncluded,
        makkahHotelId: pkg.makkahHotel?.hotel?.id || "", makkahNights: pkg.makkahNights?.toString() || "", makkahDistance: pkg.makkahDistance || "",
        madinahHotelId: pkg.madinahHotel?.hotel?.id || "", madinahNights: pkg.madinahNights?.toString() || "", madinahDistance: pkg.madinahDistance || "",
        termsAndConditions: pkg.termsAndConditions || "",
      });
      if (pkg.roomPrices?.length) {
        setRoomPrices(pkg.roomPrices.map((rp: any) => ({ roomTypeId: rp.roomTypeId, price: rp.price.toString(), available: rp.available })));
      }
    }
  }, [existingData]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) return adminApi.updatePackage(id!, data);
      return adminApi.createPackage(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-package", id] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package"] });
      queryClient.invalidateQueries({ queryKey: ["featured-packages"] });
      navigate("/admin/packages");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nullableText = (v: string) => (v && v.trim() ? v.trim() : null);
    const nullableNumber = (v: string) => {
      const t = v?.trim();
      if (!t || Number.isNaN(Number(t))) return null;
      return Number(t);
    };
    const payload = {
      title: form.title,
      packageCode: nullableText(form.packageCode),
      durationDays: Number(form.durationDays),
      status: form.status,
      description: nullableText(form.description),
      provider: nullableText(form.provider),
      sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
      airlineId: form.airlineId || null,
      departureCity: form.departureCity || "Islamabad",
      arrivalCity: form.arrivalCity || "Jeddah",
      departureDate: form.departureDate || null,
      returnDate: form.returnDate || null,
      departureDates: nullableText(form.departureDates),
      returnDates: nullableText(form.returnDates),
      baggageDetails: nullableText(form.baggageDetails),
      infantRate: nullableNumber(form.infantRate),
      childRate: nullableNumber(form.childRate),
      childWithoutBedRate: nullableNumber(form.childWithoutBedRate),
      visaIncluded: form.visaIncluded,
      ticketIncluded: form.ticketIncluded,
      hotelIncluded: form.hotelIncluded,
      transportIncluded: form.transportIncluded,
      guideIncluded: form.guideIncluded,
      ziyaratIncluded: form.ziyaratIncluded,
      makkahHotelId: form.makkahHotelId || null,
      makkahNights: nullableNumber(form.makkahNights),
      makkahDistance: nullableText(form.makkahDistance),
      madinahHotelId: form.madinahHotelId || null,
      madinahNights: nullableNumber(form.madinahNights),
      madinahDistance: nullableText(form.madinahDistance),
      termsAndConditions: nullableText(form.termsAndConditions),
      roomPrices: roomPrices.filter((rp) => rp.roomTypeId && rp.price).map((rp) => ({
        roomTypeId: rp.roomTypeId, price: Number(rp.price), available: rp.available,
      })),
    };
    mutation.mutate(payload);
  };

  const airlines = airlinesData?.data || [];
  const hotels = hotelsData?.data || [];
  const roomTypes = roomTypesData?.data || [];

  return (
    <>
      <Helmet><title>{isEdit ? "Edit" : "New"} Package | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/packages")}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
          <h2 className="text-2xl font-display font-bold">{isEdit ? "Edit Package" : "New Package"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Title *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                <div><label className="block text-sm font-medium mb-1">Package Code</label><Input value={form.packageCode} onChange={(e) => setForm({ ...form, packageCode: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Duration (Days) *</label><Input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} required /></div>
                <div><label className="block text-sm font-medium mb-1">Sort Order</label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} placeholder="Lower shows first" /></div>
                <div><label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem><SelectItem value="SOLD_OUT">Sold Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Provider</label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Flight Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Airline</label>
                  <Select value={form.airlineId} onValueChange={(v) => setForm({ ...form, airlineId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select airline" /></SelectTrigger>
                    <SelectContent>{airlines.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Departure City</label><Input value={form.departureCity} onChange={(e) => setForm({ ...form, departureCity: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Arrival City</label><Input value={form.arrivalCity} onChange={(e) => setForm({ ...form, arrivalCity: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Baggage</label><Input value={form.baggageDetails} onChange={(e) => setForm({ ...form, baggageDetails: e.target.value })} placeholder="e.g. 30kg checked + 7kg hand" /></div>
                <div><label className="block text-sm font-medium mb-1">Departure Date</label><Input type="date" value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Return Date</label><Input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} /></div>
                <div className="col-span-1 md:col-span-2"><label className="block text-sm font-medium mb-1">Departure Dates (multiple)</label><Input value={form.departureDates} onChange={(e) => setForm({ ...form, departureDates: e.target.value })} placeholder="Comma-separated, e.g. 2026-09-13, 2026-09-16" /></div>
                <div className="col-span-1 md:col-span-2"><label className="block text-sm font-medium mb-1">Return Dates (multiple)</label><Input value={form.returnDates} onChange={(e) => setForm({ ...form, returnDates: e.target.value })} placeholder="Comma-separated, e.g. 2026-10-03, 2026-10-05" /></div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Makkah Hotel</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Hotel</label>
                  <Select value={form.makkahHotelId} onValueChange={(v) => setForm({ ...form, makkahHotelId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select hotel" /></SelectTrigger>
                    <SelectContent>{hotels.filter((h: any) => h.city === "Makkah").map((h: any) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Nights</label><Input type="number" value={form.makkahNights} onChange={(e) => setForm({ ...form, makkahNights: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Distance</label><Input value={form.makkahDistance} onChange={(e) => setForm({ ...form, makkahDistance: e.target.value })} placeholder="e.g. Walking distance" /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Madinah Hotel</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Hotel</label>
                  <Select value={form.madinahHotelId} onValueChange={(v) => setForm({ ...form, madinahHotelId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select hotel" /></SelectTrigger>
                    <SelectContent>{hotels.filter((h: any) => h.city === "Madinah").map((h: any) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Nights</label><Input type="number" value={form.madinahNights} onChange={(e) => setForm({ ...form, madinahNights: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Distance</label><Input value={form.madinahDistance} onChange={(e) => setForm({ ...form, madinahDistance: e.target.value })} placeholder="e.g. Near Masjid Nabawi" /></div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Room Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {roomPrices.map((rp, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Select value={rp.roomTypeId} onValueChange={(v) => { const updated = [...roomPrices]; updated[i].roomTypeId = v; setRoomPrices(updated); }}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Room type" /></SelectTrigger>
                    <SelectContent>{roomTypes.map((rt: any) => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" placeholder="Price (PKR)" value={rp.price} onChange={(e) => { const updated = [...roomPrices]; updated[i].price = e.target.value; setRoomPrices(updated); }} className="w-40" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRoomPrices(roomPrices.filter((_, idx) => idx !== i))} disabled={roomPrices.length <= 1}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setRoomPrices([...roomPrices, { roomTypeId: "", price: "", available: true }])}>
                <Plus className="w-4 h-4 mr-2" /> Add Room Price
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Child & Infant Rates (Optional)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">Child Rate (PKR)</label><Input type="number" value={form.childRate} onChange={(e) => setForm({ ...form, childRate: e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Child Without Bed (PKR)</label><Input type="number" value={form.childWithoutBedRate} onChange={(e) => setForm({ ...form, childWithoutBedRate: e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Infant Rate (PKR)</label><Input type="number" value={form.infantRate} onChange={(e) => setForm({ ...form, infantRate: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Included Services</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(["visaIncluded", "ticketIncluded", "hotelIncluded", "transportIncluded", "guideIncluded", "ziyaratIncluded"] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm capitalize">{key.replace("Included", "")}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            {mutation.isError && (
              <p className="text-red-500 text-sm flex-1">
                {(mutation.error as any)?.response?.data?.error || "Failed to save package. Please try again."}
              </p>
            )}
            <Button type="button" variant="outline" onClick={() => navigate("/admin/packages")}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : isEdit ? "Update Package" : "Create Package"}</Button>
          </div>
        </form>
      </div>
    </>
  );
}
