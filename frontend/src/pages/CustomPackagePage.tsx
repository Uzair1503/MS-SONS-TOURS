import { useState, useMemo } from "react";
import SeoHead from "@/components/shared/Seo";
import {
  Users, Bed, Plane, MapPin, Calendar, CheckCircle2, MessageCircle,
  Send, Minus, Plus, AlertCircle, Loader2, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useHotels } from "@/hooks/useHotels";
import { useSettings } from "@/hooks/useSettings";
import { useUmrahSettings } from "@/hooks/useUmrahSettings";
import { customPackageApi, inquiryApi } from "@/services/api";
import { formatSAR, formatPKR, roomsRequiredFor } from "@/lib/currency";
import { computeCustomEstimate, validateCustomInput, customSummaryMessage, findRoomPrice } from "@/lib/customPackage";
import type { CustomPackageInput, CustomPackageResult, Hotel } from "@/types";
import ErrorState from "@/components/shared/ErrorState";

const stepperButton =
  "w-8 h-8 rounded-lg border border-gray-300 hover:bg-brand-green hover:text-white hover:border-brand-green transition-colors disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-gray-300 dark:border-gray-600 dark:text-gray-200 dark:disabled:hover:bg-gray-900 dark:disabled:hover:text-gray-500 dark:disabled:hover:border-gray-600";

const selectableSelected = "border-brand-green bg-brand-green/5 ring-2 ring-brand-green/20";
const selectableUnselected = "border-gray-200 hover:border-brand-green/50 dark:border-gray-700 dark:hover:border-brand-green/60";

function Stepper({ label, value, onChange, min = 0, labelAbove = false }: { label: string; value: number; onChange: (v: number) => void; min?: number; labelAbove?: boolean }) {
  const set = (n: number) => onChange(Math.max(min, Math.max(0, Math.floor(n))));
  const controls = (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => set(value - 1)} disabled={value <= min} className={stepperButton}>
        <Minus className="w-4 h-4 mx-auto" />
      </button>
      <input
        value={value}
        onChange={(e) => { const n = parseInt(e.target.value, 10); set(Number.isNaN(n) ? min : n); }}
        inputMode="numeric"
        className="w-14 h-8 text-center rounded-lg border border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
      />
      <button type="button" onClick={() => set(value + 1)} className={stepperButton}>
        <Plus className="w-4 h-4 mx-auto" />
      </button>
    </div>
  );
  if (labelAbove) {
    return (
      <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700">
        <label className="block font-medium text-gray-800 text-sm dark:text-gray-200 mb-2">{label}</label>
        {controls}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700">
      <span className="font-medium text-gray-800 text-sm dark:text-gray-200">{label}</span>
      {controls}
    </div>
  );
}

function NightStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <Stepper label="Nights" labelAbove value={value} onChange={(v) => onChange(Math.max(1, v))} min={1} />;
}

type SectionKey = "adults" | "children" | "infants" | "makkahHotelId" | "makkahRoomTypeId" | "makkahNights" | "madinahHotelId" | "madinahRoomTypeId" | "madinahNights" | "ziaratMakkah" | "ziaratMadina";

function HotelPicker({
  city, hotels, input, setInput, roomsError,
}: {
  city: "Makkah" | "Madinah";
  hotels: Hotel[];
  input: CustomPackageInput;
  setInput: (p: Partial<Record<SectionKey, any>>) => void;
  roomsError?: string;
}) {
  const isMakkah = city === "Makkah";
  const selectedId = isMakkah ? input.makkahHotelId : input.madinahHotelId;
  const selectedRoom = isMakkah ? input.makkahRoomTypeId : input.madinahRoomTypeId;
  const nights = isMakkah ? input.makkahNights ?? 0 : input.madinahNights ?? 0;
  const selectedHotel = hotels.find((h) => h.id === selectedId);
  const pricedRooms = selectedHotel
    ? (selectedHotel.roomPrices || []).filter((rp) => rp.available)
    : [];
  const roomPriceSelected = selectedRoom ? pricedRooms.find((rp) => rp.roomTypeId === selectedRoom) : undefined;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {hotels.map((hotel) => {
          const active = selectedId === hotel.id;
          return (
            <button
              key={hotel.id}
              type="button"
              onClick={() => {
                setInput({
                  [isMakkah ? "makkahHotelId" : "madinahHotelId"]: hotel.id,
                  [isMakkah ? "makkahRoomTypeId" : "madinahRoomTypeId"]: "",
                });
              }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${active ? selectableSelected : selectableUnselected}`}
            >
              <p className="font-semibold text-gray-900 dark:text-gray-100">{hotel.name}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 dark:text-gray-400">
                <MapPin className="w-3 h-3 text-brand-green" />
                {hotel.location || "Makkah"} · {isMakkah ? hotel.distanceFromHaram || "—" : hotel.distanceFromMasjidNabawi || "—"}
              </p>
            </button>
          );
        })}
      </div>

      {selectedHotel && (
        <div className="space-y-2">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wide mb-2 dark:text-gray-500">Select Room Type</p>
            {pricedRooms.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No room rates available for this hotel right now.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pricedRooms.map((rp) => {
                  const active = selectedRoom === rp.roomTypeId;
                  return (
                    <button
                      key={rp.id}
                      type="button"
                      onClick={() => setInput({ [isMakkah ? "makkahRoomTypeId" : "madinahRoomTypeId"]: rp.roomTypeId })}
                      className={`px-4 py-2.5 rounded-xl border-2 text-left transition-all ${active ? "border-brand-green bg-brand-green text-white ring-2 ring-brand-green/30" : `${selectableUnselected} bg-white dark:bg-gray-900`}`}
                    >
                      <p className={`text-sm font-semibold ${active ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>{rp.roomType.name}</p>
                      <p className={`text-xs ${active ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>{formatSAR(rp.price)} / person / night</p>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="max-w-xs mt-3">
              <NightStepper
                value={nights}
                onChange={(v) => setInput({ [isMakkah ? "makkahNights" : "madinahNights"]: v })}
              />
            </div>
            {roomsError && !selectedRoom && (
              <p className="flex items-start gap-1.5 text-sm font-medium text-red-600 mt-2 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {roomsError}
              </p>
            )}
          </div>

          {roomPriceSelected && nights > 0 && (
            <div className="rounded-xl bg-brand-cream px-4 py-3 text-sm flex justify-between items-center dark:bg-gray-800/50">
              <span className="text-gray-600 dark:text-gray-400">
                {roomPriceSelected.roomType.name} × {nights} night(s)
              </span>
              <span className="font-semibold text-brand-green">
                {formatSAR(roomPriceSelected.price)}/person/night
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomPackagePage() {
  const { data: hotelsRes, isLoading: hotelsLoading, isError: hotelsError, refetch: refetchHotels } = useHotels({ active: "true", limit: "100" });
  const { data: settings, isError: settingsError, refetch: refetchSettings } = useUmrahSettings();
  const { data: siteSettings } = useSettings();

  const [input, setInputState] = useState<CustomPackageInput>({
    adults: 2, children: 0, infants: 0,
    makkahHotelId: "", makkahRoomTypeId: "", makkahNights: 5,
    madinahHotelId: "", madinahRoomTypeId: "", madinahNights: 4,
    ziaratMakkah: false, ziaratMadina: false,
  });
  const [result, setResult] = useState<CustomPackageResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiry, setInquiry] = useState({ fullName: "", whatsappNumber: "", email: "" });
  const [submitState, setSubmitState] = useState<{ loading: boolean; done?: boolean; error?: string; reference?: string }>({ loading: false });

  const setInput = (patch: Partial<Record<SectionKey, any>>) => {
    setInputState((prev) => ({ ...prev, ...patch }));
    setResult(null);
  };

  const hotels = hotelsRes?.data || [];
  const makkahHotels = useMemo(() => hotels.filter((h) => h.city === "Makkah" && h.active), [hotels]);
  const madinahHotels = useMemo(() => hotels.filter((h) => h.city === "Madinah" && h.active), [hotels]);

  const estimate = useMemo(() => {
    if (!settings) return null;
    return computeCustomEstimate(input, { makkah: makkahHotels, madinah: madinahHotels }, settings);
  }, [input, makkahHotels, madinahHotels, settings]);

  const validation = useMemo(() => (settings ? validateCustomInput(input, settings) : { valid: false }), [input, settings]);

  const totalPax = (input.adults || 0) + (input.children || 0) + (input.infants || 0);
  const whatsappNumber = siteSettings?.whatsapp_number || "923713011519";

  const paxError = settings && totalPax > settings.groupPax.max
    ? `Maximum ${settings.groupPax.max} person(s) allowed per group.`
    : settings && totalPax < settings.groupPax.min ? `Minimum ${settings.groupPax.min} person(s) required.` : "";
  const overPax = settings ? totalPax > settings.groupPax.max : false;

  const handleCalculate = async () => {
    if (!validation.valid || !settings || overPax) { setCalcError(validation.hotelError || validation.paxError || paxError || "Complete your selection first."); return; }
    setCalcError("");
    setCalculating(true);
    try {
      const res = await customPackageApi.calculate({
        ...input,
        adults: input.adults, children: input.children, infants: input.infants,
        ziaratMakkah: input.ziaratMakkah, ziaratMadina: input.ziaratMadina,
      });
      setResult(res.data.data);
    } catch (err: any) {
      setCalcError(err?.response?.data?.error || "Could not calculate. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmitInquiry = async () => {
    if (!inquiry.fullName.trim() || !inquiry.whatsappNumber.trim()) {
      setSubmitState({ loading: false, error: "Name and WhatsApp number are required." });
      return;
    }
    setSubmitState({ loading: true, error: undefined });
    try {
      const message = customSummaryMessage(result || estimate!, whatsappNumber).text;
      const selections = {
        makkah: showMakkahSummary(), madinah: showMadinahSummary(),
        makkahRoom: input.makkahRoomTypeId || "", madinahRoom: input.madinahRoomTypeId || "",
        ziaratMakkah: input.ziaratMakkah, ziaratMadina: input.ziaratMadina,
      };
      await inquiryApi.create({
        fullName: inquiry.fullName.trim(),
        whatsappNumber: inquiry.whatsappNumber.trim(),
        email: inquiry.email.trim() || undefined,
        adults: input.adults, children: input.children, infants: input.infants,
        durationDays: (input.makkahNights || 0) + (input.madinahNights || 0),
        packageId: undefined,
        hotelPreference: selections.makkah && selections.madinah
          ? `${selections.makkah} | ${selections.madinah}`
          : selections.makkah || selections.madinah,
        roomType: [selections.makkahRoom, selections.madinahRoom].filter(Boolean).join(" / ") || undefined,
        specialRequirements: JSON.stringify(selections),
        message,
        estimatedPrice: (result || estimate!)!.pkrTotal,
        currency: "PKR",
      });
      setSubmitState({ loading: false, done: true });
    } catch (err: any) {
      setSubmitState({ loading: false, error: err?.response?.data?.error || "Failed to submit. Please try again or contact us on WhatsApp." });
    }
  };

  function showMakkahSummary() {
    if (!input.makkahHotelId) return "";
    const hotel = makkahHotels.find((h) => h.id === input.makkahHotelId);
    const rp = hotel ? findRoomPrice(hotel, input.makkahRoomTypeId) : undefined;
    return [hotel?.name, rp?.roomType.name, `${input.makkahNights} night(s)`].filter(Boolean).join(" · ");
  }
  function showMadinahSummary() {
    if (!input.madinahHotelId) return "";
    const hotel = madinahHotels.find((h) => h.id === input.madinahHotelId);
    const rp = hotel ? findRoomPrice(hotel, input.madinahRoomTypeId) : undefined;
    return [hotel?.name, rp?.roomType.name, `${input.madinahNights} night(s)`].filter(Boolean).join(" · ");
  }

  const indicative = estimate!;
  const shownResult = result || indicative;

  if (hotelsError || settingsError) {
    return (
      <ErrorState
        message="Could not load umrah rates. Check that the backend is running."
        onRetry={() => { refetchHotels(); refetchSettings(); }}
      />
    );
  }

  const roomsBadge = result?.makkah?.roomTypeName
    ? `${roomsRequiredFor(result.seatPax, result.makkah.roomTypeName)} room(s)`
    : undefined;

  return (
    <>
      <SeoHead
        title="Custom Umrah Package Builder"
        description="Build your own Umrah package from Pakistan - choose Makkah & Madinah hotels, room type, nights and ziarat, and see your total price in PKR instantly."
        path="/custom-package"
      />

      <section className="bg-brand-green py-12 md:py-16">
        <div className="container-custom mx-auto px-4 text-center">
          <Badge variant="secondary" className="bg-brand-gold text-white mb-3 text-sm px-3 py-1">Build Your Own</Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Custom Umrah Package</h1>
          <p className="text-white/70 mt-3">Choose your hotels, room type and nights — see your final price in PKR instantly</p>
          {settings && (
            <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 text-xs text-white/80">
              <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full"><Calendar className="w-3.5 h-3.5" /> Rates valid till {new Date(settings.validity + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })} check-in</span>
              <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full"><Users className="w-3.5 h-3.5" /> Group size {settings.groupPax.min}–{settings.groupPax.max} pax</span>
            </div>
          )}
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-green" />
                    <h2 className="text-xl font-display font-bold dark:text-gray-100">Passengers</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Stepper label="Adults" value={input.adults} min={1} onChange={(v) => setInput({ adults: v })} />
                    <Stepper label="Children" value={input.children} onChange={(v) => setInput({ children: v })} />
                    <Stepper label="Infants" value={input.infants} onChange={(v) => setInput({ infants: v })} />
                  </div>
                  {paxError && (
                    <p className={`flex items-center gap-1.5 text-sm ${overPax ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
                      <AlertCircle className="w-4 h-4" /> {paxError}
                    </p>
                  )}
                  <div className="rounded-xl bg-brand-cream px-4 py-3 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">So far</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {input.adults} adult(s) · {input.children} child(ren) · {input.infants} infant(s)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-brand-green" />
                    <h2 className="text-xl font-display font-bold dark:text-gray-100">Visa &amp; Flight</h2>
                  </div>
                  {settings && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"><p className="text-xs text-gray-500 dark:text-gray-400">Visa (per person)</p><p className="font-semibold dark:text-gray-100">{formatSAR(settings.visa.base)}</p></div>
                      <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"><p className="text-xs text-gray-500 dark:text-gray-400">Flight (per person)</p><p className="font-semibold dark:text-gray-100">{formatSAR(settings.visa.flightTiers[input.adults + input.children >= 4 ? "4" : String(Math.max(1, Math.min(3, input.adults + input.children)))] || settings.visa.flightTiers[4])}</p></div>
                      <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"><p className="text-xs text-gray-500 dark:text-gray-400">Infant visa</p><p className="font-semibold dark:text-gray-100">{formatSAR(settings.visa.infant)}</p></div>
                      <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"><p className="text-xs text-gray-500 dark:text-gray-400">Exchange rate</p><p className="font-semibold dark:text-gray-100">1 SAR = {settings.currency.sarToPkr} PKR</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-brand-green" />
                    <h2 className="text-xl font-display font-bold dark:text-gray-100">Makkah Hotel</h2>
                  </div>
                  {hotelsLoading ? (
                    <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse dark:bg-gray-800" />)}</div>
                  ) : makkahHotels.length === 0 ? (
                    <p className="text-gray-500 text-sm dark:text-gray-400">No Makkah hotels with available rates right now.</p>
                  ) : (
                    <HotelPicker city="Makkah" hotels={makkahHotels} input={input} setInput={setInput} roomsError={validation.hotelError as string | undefined} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-brand-gold" />
                    <h2 className="text-xl font-display font-bold dark:text-gray-100">Madinah Hotel</h2>
                  </div>
                  {hotelsLoading ? (
                    <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse dark:bg-gray-800" />)}</div>
                  ) : madinahHotels.length === 0 ? (
                    <p className="text-gray-500 text-sm dark:text-gray-400">No Madinah hotels with available rates right now.</p>
                  ) : (
                    <HotelPicker city="Madinah" hotels={madinahHotels} input={input} setInput={setInput} roomsError={validation.hotelError as string | undefined} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-green" />
                    <h2 className="text-xl font-display font-bold dark:text-gray-100">Ziarat Add-ons</h2>
                  </div>
                  {settings && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`flex items-center justify-between gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${input.ziaratMakkah ? selectableSelected : selectableUnselected}`}>
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                          <input type="checkbox" checked={input.ziaratMakkah} onChange={(e) => setInput({ ziaratMakkah: e.target.checked })} className="w-4 h-4 accent-brand-green" />
                          Makkah Ziarat
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatSAR(settings.ziarat.makkah)} / person</span>
                      </label>
                      <label className={`flex items-center justify-between gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${input.ziaratMadina ? selectableSelected : selectableUnselected}`}>
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                          <input type="checkbox" checked={input.ziaratMadina} onChange={(e) => setInput({ ziaratMadina: e.target.checked })} className="w-4 h-4 accent-brand-green" />
                          Madinah Ziarat
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatSAR(settings.ziarat.madinah)} / person</span>
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div>
                <Button className="w-full md:w-auto" size="lg" onClick={handleCalculate} disabled={calculating || !validation.valid || overPax || !settings}>
                  {calculating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculating...</> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirm My Package</>}
                </Button>
                {calcError && <p className="text-sm text-red-600 mt-2 dark:text-red-400"><AlertCircle className="w-4 h-4 inline mr-1" />{calcError}</p>}
              </div>
            </div>

            {/* Live summary */}
            <div>
              <Card className="lg:sticky lg:top-24">
                <CardHeader><CardTitle className="text-lg">Package Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1.5">
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Adults</span><span className="font-medium">{input.adults}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Children</span><span className="font-medium">{input.children}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Infants</span><span className="font-medium">{input.infants}</span></div>
                    {showMakkahSummary() && <div className="flex justify-between gap-3"><span className="text-gray-500 shrink-0 dark:text-gray-400">Makkah</span><span className="font-medium text-right">{showMakkahSummary()}</span></div>}
                    {showMadinahSummary() && <div className="flex justify-between gap-3"><span className="text-gray-500 shrink-0 dark:text-gray-400">Madinah</span><span className="font-medium text-right">{showMadinahSummary()}</span></div>}
                    {(input.ziaratMakkah || input.ziaratMadina) && (
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Ziarat</span><span className="font-medium">{[input.ziaratMakkah ? "Makkah" : "", input.ziaratMadina ? "Madinah" : ""].filter(Boolean).join(" + ")}</span></div>
                    )}
                  </div>

                  <div className="border-t pt-2 dark:border-gray-700">
                    <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">{result ? "Confirmed Estimate" : "Live Estimate"}</p>
                    {shownResult?.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1 gap-3">
                        <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                        <span className="font-medium whitespace-nowrap">{formatSAR(item.amount)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-2 space-y-1 dark:border-gray-700">
                    <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">SAR subtotal</span><span className="font-semibold">{shownResult ? formatSAR(shownResult.sarSubtotal) : "SAR 0"}</span></div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>Exchange rate</span><span>1 SAR = {shownResult?.exchangeRate || settings?.currency.sarToPkr || 0} PKR</span></div>
                  </div>

                  <div className="rounded-2xl bg-brand-green text-white p-5 text-center">
                    <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Final Price</p>
                    <p className="text-3xl font-display font-bold">{shownResult ? formatPKR(shownResult.pkrTotal) : formatPKR(0)}</p>
                    {shownResult && shownResult.sarSubtotal > 0 && (
                      <p className="text-xs text-white/60 mt-1">(SAR {shownResult.sarSubtotal.toLocaleString("en-PK")})</p>
                    )}
                    {roomsBadge && result && <p className="text-xs text-white/70 mt-2">{roomsBadge} needed for {result.seatPax} seat passenger(s)</p>}
                  </div>

                  {!result && !validation.valid && (
                    <p className="text-xs text-gray-500 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
                      {validation.hotelError || validation.paxError || "Select your hotels to see the full price."}
                    </p>
                  )}

                  <div className="pt-1">
                    {!result ? (
                      <Button className="w-full" onClick={handleCalculate} disabled={calculating || !validation.valid || overPax}>
                        {calculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Confirm My Package
                      </Button>
                    ) : (
                      <>
                        <Button className="w-full mb-2" onClick={() => setShowInquiry(true)}>
                          <MessageCircle className="w-4 h-4 mr-2" /> Submit Inquiry / Booking
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <a href={customSummaryMessage(result, whatsappNumber).url} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp This Package
                          </a>
                        </Button>
                        <Button variant="outline" className="w-full mt-2" onClick={() => setResult(null)}>Adjust Selection</Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {settings && settings.terms.length > 0 && (
            <div className="mt-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="w-5 h-5 text-brand-green" /> Terms &amp; Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-sm text-gray-600 list-decimal list-inside dark:text-gray-400">
                    {settings.terms.map((term, idx) => <li key={idx}>{term.replace(/^\d+\.\s*/, "")}</li>)}
                  </ul>
                  {settings.condition && (
                    <p className="mt-4 text-sm font-medium text-gray-800 dark:text-gray-200"><Calendar className="w-4 h-4 inline mr-1 text-brand-green" /> Condition: {settings.condition}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Inquiry modal */}
          {showInquiry && (
            <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => !submitState.done && setShowInquiry(false)}>
              <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl dark:bg-gray-900 dark:border dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                {submitState.done ? (
                  <div className="text-center space-y-3 py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto dark:bg-green-900/40"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
                    <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">Inquiry Submitted</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Our team will contact you shortly to confirm your custom Umrah package.</p>
                    <Button className="w-full" onClick={() => { setShowInquiry(false); setSubmitState({ loading: false }); setInquiry({ fullName: "", whatsappNumber: "", email: "" }); setResult(null); }}>
                      Done
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-display font-bold text-gray-900 mb-1 dark:text-gray-100">Review &amp; Submit</h3>
                    <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
                      Final price: <span className="font-semibold text-brand-green">{formatPKR((result || estimate!)!.pkrTotal)}</span> (SAR {(result || estimate!)!.sarSubtotal.toLocaleString("en-PK")})
                    </p>
                    <div className="space-y-3">
                      <div><label className="block text-sm font-medium mb-1 dark:text-gray-200">Full Name *</label><Input value={inquiry.fullName} onChange={(e) => setInquiry({ ...inquiry, fullName: e.target.value })} placeholder="Your name" /></div>
                      <div><label className="block text-sm font-medium mb-1 dark:text-gray-200">WhatsApp Number *</label><Input value={inquiry.whatsappNumber} onChange={(e) => setInquiry({ ...inquiry, whatsappNumber: e.target.value })} placeholder="e.g. 923001234567" inputMode="tel" /></div>
                      <div><label className="block text-sm font-medium mb-1 dark:text-gray-200">Email (optional)</label><Input value={inquiry.email} onChange={(e) => setInquiry({ ...inquiry, email: e.target.value })} placeholder="you@example.com" /></div>
                    </div>
                    {submitState.error && <p className="text-sm text-red-600 mt-3 dark:text-red-400"><AlertCircle className="w-4 h-4 inline mr-1" />{submitState.error}</p>}
                    <div className="flex gap-3 mt-5">
                      <Button variant="outline" className="flex-1" onClick={() => setShowInquiry(false)} disabled={submitState.loading}>Cancel</Button>
                      <Button className="flex-1" onClick={handleSubmitInquiry} disabled={submitState.loading}>
                        {submitState.loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Submit
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}