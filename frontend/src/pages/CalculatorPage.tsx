import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SeoHead from "@/components/shared/Seo";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import {
  Bed, Users, ChevronLeft, CheckCircle, MessageCircle, Phone,
  ArrowRight, Star, Calendar, Plane, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePackages } from "@/hooks/usePackages";
import { useCalculator } from "@/hooks/useCalculator";
import { useSettings } from "@/hooks/useSettings";
import { formatPrice, generateWhatsAppMessage } from "@/lib/utils";
import { getHotelImageUrl, getHotelImageFallback, getHotelAlt, isRepresentativeImage } from "@/lib/hotelImages";
import StarRating from "@/components/hotels/StarRating";
import type { Package, CalculatorResult } from "@/types";

function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  const spring = useSpring(value, { stiffness: 120, damping: 22 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    spring.set(value);
    const unsubscribe = spring.on("change", (latest) => setDisplay(latest));
    return () => unsubscribe();
  }, [value, spring]);

  return <span className={className}>{Math.round(display).toLocaleString("en-PK")}</span>;
}

function StepIndicator({ title, step, totalSteps }: { title: string; step: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center text-white text-sm font-bold">
        {step}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Step {step} of {totalSteps}</p>
        <p className="font-semibold text-gray-900 dark:text-gray-100">{title}</p>
      </div>
    </div>
  );
}

function PeopleStepper({
  label, subtitle, icon, value, onChange, min = 0,
}: {
  label: string; subtitle: string; icon: React.ReactNode; value: number; onChange: (v: number) => void; min?: number;
}) {
  const handleInput = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      onChange(min);
    } else {
      onChange(Math.max(min, parsed));
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 hover:border-brand-green/40 transition-colors dark:border-gray-700 dark:hover:border-brand-green/60">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-xs text-gray-500 truncate dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-9 h-9 rounded-lg border border-gray-300 hover:bg-brand-green hover:text-white hover:border-brand-green transition-colors disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 text-lg leading-none dark:border-gray-700 dark:text-gray-200 dark:disabled:hover:bg-gray-800 dark:disabled:hover:text-gray-500 dark:disabled:hover:border-gray-700"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          inputMode="numeric"
          className="w-16 h-9 text-center rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-gold"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-lg border border-gray-300 hover:bg-brand-green hover:text-white hover:border-brand-green transition-colors text-lg leading-none dark:border-gray-700 dark:text-gray-200"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function hotelDistanceLine(hotelName: string | null | undefined, distance: string | null, city: "Makkah" | "Madinah") {
  if (!hotelName) return `${city} Hotel: TBA`;
  const ref = city === "Makkah" ? "Masjid al-Haram" : "Masjid an-Nabawi";
  return `${hotelName}${distance ? ` - ${distance} from ${ref}` : ""}`;
}

export default function CalculatorPage() {
  const [searchParams] = useSearchParams();
  const preselectedPackageId = searchParams.get("packageId") || "";

  const [step, setStep] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(preselectedPackageId);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [daysFilter, setDaysFilter] = useState<number | "all">("all");

  const { data: settings } = useSettings();
  const whatsappNumber = settings?.whatsapp_number || "923713011519";

  const { data: packagesData, isLoading: packagesLoading } = usePackages({ status: "ACTIVE", limit: "100" });

  const allPackages = useMemo(() => packagesData?.data || [], [packagesData]);

  const groupedPackages = useMemo(() => {
    const groups: Record<number, Package[]> = {};
    for (const p of allPackages) {
      (groups[p.durationDays] = groups[p.durationDays] || []).push(p);
    }
    return groups;
  }, [allPackages]);

  const filteredDurationKeys = useMemo(() => {
    const keys = Object.keys(groupedPackages).sort();
    return daysFilter === "all" ? keys : keys.filter((k) => Number(k) === daysFilter);
  }, [groupedPackages, daysFilter]);

  useEffect(() => {
    if (preselectedPackageId && allPackages.some((p) => p.id === preselectedPackageId)) {
      setSelectedPackageId(preselectedPackageId);
      setStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPackages, preselectedPackageId]);

  const selectedPackage = useMemo(
    () => allPackages.find((p: Package) => p.id === selectedPackageId) || null,
    [allPackages, selectedPackageId]
  );

  const roomPrices = selectedPackage?.roomPrices || [];
  const selectedRoomPrice = roomPrices.find((rp) => rp.roomTypeId === selectedRoomTypeId) || null;

  const calculateMutation = useCalculator();

  const liveEstimate = useMemo(() => {
    if (!selectedRoomPrice) return null;
    const price = selectedRoomPrice.price;
    const childRate = selectedPackage?.childRate || price * 0.75;
    const infantRate = selectedPackage?.infantRate || 0;
    const total = adults * price + children * childRate + infants * infantRate;
    return { total, currency: selectedRoomPrice.currency, pricePerPerson: price };
  }, [selectedRoomPrice, selectedPackage, adults, children, infants]);

  const displayTotal = result ? result.grandTotal : liveEstimate?.total || 0;
  const displayCurrency = result ? result.currency : liveEstimate?.currency || "PKR";
  const displayRoomPrice = result ? result.pricePerPerson : liveEstimate?.pricePerPerson || 0;

  const makkahLine = result
    ? hotelDistanceLine(result.makkahHotel, null, "Makkah")
    : hotelDistanceLine(
        selectedPackage?.makkahHotel?.hotel?.name,
        selectedPackage?.makkahDistance || selectedPackage?.makkahHotel?.distance || null,
        "Makkah"
      );

  const madinahLine = result
    ? hotelDistanceLine(result.madinahHotel, null, "Madinah")
    : hotelDistanceLine(
        selectedPackage?.madinahHotel?.hotel?.name,
        selectedPackage?.madinahDistance || selectedPackage?.madinahHotel?.distance || null,
        "Madinah"
      );

  const whatsAppMsg = result
    ? generateWhatsAppMessage({
        packageName: result.packageTitle,
        duration: result.durationDays,
        airline: result.airline || undefined,
        hotelMakkah: makkahLine,
        hotelMadinah: madinahLine,
        room: result.roomType,
        adults: result.adults,
        children: result.children,
        infants: result.infants,
        estimatedTotal: result.grandTotal,
        currency: result.currency,
      })
    : "";

  const handleCalculate = async () => {
    if (!selectedPackageId || !selectedRoomTypeId || adults < 1) return;
    try {
      const res = await calculateMutation.mutateAsync({
        packageId: selectedPackageId,
        roomTypeId: selectedRoomTypeId,
        adults,
        children,
        infants,
      });
      setResult(res.data);
      setStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Calculation failed", err);
    }
  };

  const reset = () => {
    setResult(null);
    setStep(1);
    setSelectedPackageId("");
    setSelectedRoomTypeId("");
    setAdults(1);
    setChildren(0);
    setInfants(0);
  };

  return (
    <>
      <SeoHead
        title="Umrah Price Calculator"
        description="Calculate your Umrah package price online - select duration, package, room type, passengers and get an instant estimate in PKR."
        path="/calculator"
      />

      <section className="bg-brand-green py-12 md:py-16">
        <div className="container-custom mx-auto px-4 text-center">
          <Badge variant="secondary" className="bg-brand-gold text-white mb-3">Instant Quote</Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Umrah Price Calculator</h1>
          <p className="text-white/70 mt-3">Get an estimated price for your Umrah package</p>
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6 md:p-8">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <StepIndicator title="Select Package" step={1} totalSteps={5} />
                        {packagesLoading ? (
                          <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse dark:bg-gray-800" />)}
                          </div>
                        ) : allPackages.length === 0 ? (
                          <p className="text-gray-500 text-center py-8 dark:text-gray-400">No packages available right now. Contact us on WhatsApp for the latest availability.</p>
                        ) : (
                          <>
                          <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter packages by duration">
                            <button
                              type="button"
                              onClick={() => setDaysFilter("all")}
                              aria-pressed={daysFilter === "all"}
                              className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all ${daysFilter === "all" ? "border-brand-green bg-brand-green text-white" : "border-gray-200 bg-white text-gray-600 hover:border-brand-green/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"}`}
                            >
                              All ({allPackages.length})
                            </button>
                            {Object.keys(groupedPackages).sort().map((key) => {
                              const d = Number(key);
                              const active = daysFilter === d;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => setDaysFilter(d)}
                                  aria-pressed={active}
                                  className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all ${active ? "border-brand-green bg-brand-green text-white" : "border-gray-200 bg-white text-gray-600 hover:border-brand-green/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"}`}
                                >
                                  {d} Days ({groupedPackages[d].length})
                                </button>
                              );
                            })}
                          </div>
                          <div className="space-y-6 max-h-[560px] overflow-y-auto pr-1">
                            {filteredDurationKeys.map((daysStr) => {
                              const days = Number(daysStr);
                              const pkgs = groupedPackages[days];
                              return (
                                <div key={days}>
                                  <p className="text-xs font-semibold text-gray-400 tracking-wide mb-2 dark:text-gray-500">{days} Days Packages</p>
                                  <div className="space-y-3">
                                    {pkgs.map((pkg) => {
                                      const startPrice = pkg.roomPrices.length > 0
                                        ? Math.min(...pkg.roomPrices.map((rp) => rp.price))
                                        : null;
                                      const selected = selectedPackageId === pkg.id;
                                      return (
                                        <button
                                          key={pkg.id}
                                          onClick={() => { setSelectedPackageId(pkg.id); setSelectedRoomTypeId(""); setResult(null); setStep(2); }}
                                          className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                                            selected ? "border-brand-green bg-brand-green/5 ring-2 ring-brand-green/20" : "border-gray-200 hover:border-brand-green/50 dark:border-gray-700 dark:hover:border-brand-green/60"
                                          }`}
                                        >
                                          <div className="flex justify-between items-start gap-3 mb-2">
                                            <div>
                                              <p className="font-semibold text-gray-900 dark:text-gray-100">{pkg.title}</p>
                                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 dark:text-gray-400">
                                                <Plane className="w-3.5 h-3.5" />
                                                {pkg.airline?.name || "TBA"} · {days} Days
                                              </p>
                                            </div>
                                            {startPrice && (
                                <Badge
                                  variant="outline"
                                  className="text-sm font-semibold text-brand-green bg-brand-green/10 border-brand-green/30 px-3 py-1 shrink-0 dark:text-brand-gold dark:bg-brand-gold/10 dark:border-brand-gold/30"
                                >
                                  From {formatPrice(startPrice)}
                                </Badge>
                              )}
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-start gap-2">
                                              <Bed className="w-4 h-4 text-brand-green mt-0.5 flex-shrink-0" />
                                              <span className="text-gray-700 dark:text-gray-300">
                                                <span className="text-xs text-gray-400 uppercase">Makkah </span>
                                                {pkg.makkahHotel?.hotel?.name || "TBA"}
                                                {pkg.makkahNights ? <span className="text-gray-400"> · {pkg.makkahNights} nt</span> : null}
                                                <span className="text-brand-green font-medium">
                                                  {(pkg.makkahDistance || pkg.makkahHotel?.distance) && ` · ${pkg.makkahDistance || pkg.makkahHotel?.distance}`}
                                                </span>
                                              </span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                              <Bed className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
                                              <span className="text-gray-700 dark:text-gray-300">
                                                <span className="text-xs text-gray-400 uppercase">Madinah </span>
                                                {pkg.madinahHotel?.hotel?.name || "TBA"}
                                                {pkg.madinahNights ? <span className="text-gray-400"> · {pkg.madinahNights} nt</span> : null}
                                                <span className="text-brand-green font-medium">
                                                  {(pkg.madinahDistance || pkg.madinahHotel?.distance) && ` · ${pkg.madinahDistance || pkg.madinahHotel?.distance}`}
                                                </span>
                                              </span>
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          </>
                        )}
                      </motion.div>
                    )}

                    {step === 2 && selectedPackage && (
                      <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <StepIndicator title="Your Hotels" step={2} totalSteps={5} />
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 tracking-wide mb-2 dark:text-gray-500">
                              {selectedPackage.title} · {selectedPackage.durationDays} Days · {selectedPackage.airline?.name || "TBA"}
                            </p>
                            {[selectedPackage.makkahHotel, selectedPackage.madinahHotel].map((ph, idx) => {
                              if (!ph) return null;
                              const hotel = ph.hotel;
                              const isMakkah = idx === 0;
                              const hotelLine = isMakkah
                                ? `${selectedPackage.makkahDistance || ph.distance || ""} from Masjid al-Haram`
                                : `${selectedPackage.madinahDistance || ph.distance || ""} from Masjid an-Nabawi`;
                              const nights = isMakkah ? selectedPackage.makkahNights : selectedPackage.madinahNights;
                              return (
                                <div key={ph.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                                  <div className="relative sm:w-52 w-full h-40 sm:h-auto rounded-lg overflow-hidden flex-shrink-0">
                                    <picture>
                                      <source type="image/webp" srcSet={getHotelImageUrl(hotel)} />
                                      <img src={getHotelImageFallback(hotel)} alt={getHotelAlt(hotel)} className="w-full h-full object-cover" onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        if (!e.currentTarget.src.endsWith("placeholder-hotel.svg")) {
                                          e.currentTarget.src = "/images/hotels/placeholder-hotel.svg";
                                        }
                                      }} />
                                    </picture>
                                    {isRepresentativeImage(hotel) && (
                                      <span className="absolute bottom-2 left-2 bg-brand-green/90 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded">Representative Image</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                                      {hotel.name}
                                      <StarRating rating={hotel.starRating} withLabel={false} />
                                    </p>
                                    <p className="text-sm text-brand-green font-medium">{isMakkah ? "Makkah" : "Madinah"}{nights ? ` · ${nights} Nights` : ""}</p>
                                    <div className="mt-1 text-sm text-gray-600 space-y-0.5 dark:text-gray-400">
                                      {hotel.location && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-brand-green" /> {hotel.location}</p>}
                                      <p>{hotelLine}</p>
                                      {hotel.shuttleAvailable && <p className="text-green-600 font-medium">Free Shuttle</p>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Your package includes {selectedPackage.makkahNights} nights in Makkah and {selectedPackage.madinahNights} nights in Madinah.
                          </p>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <Button variant="ghost" onClick={() => setStep(1)}>
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back
                          </Button>
                          <Button onClick={() => setStep(3)}>
                            Looks Good <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <StepIndicator title="Select Room Type" step={3} totalSteps={5} />
                        {roomPrices.length === 0 ? (
                          <p className="text-gray-500 text-center py-4 dark:text-gray-400">No room types available for this package.</p>
                        ) : (
                          <div className="space-y-3">
                            {roomPrices.map((rp) => (
                              <button
                                key={rp.id}
                                onClick={() => { setSelectedRoomTypeId(rp.roomType.id); setResult(null); setStep(4); }}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${
                                  selectedRoomTypeId === rp.roomType.id ? "border-brand-green bg-brand-green/5 ring-2 ring-brand-green/20" : "border-gray-200 hover:border-brand-green/50 dark:border-gray-700 dark:hover:border-brand-green/60"
                                }`}
                              >
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">{rp.roomType.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{rp.available ? "Available" : "Limited availability"}</p>
                                </div>
                                <p className="font-bold text-brand-green">{formatPrice(rp.price, rp.currency)}</p>
                              </button>
                            ))}
                          </div>
                        )}
                        <Button variant="ghost" className="mt-4" onClick={() => setStep(2)}>
                          <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <StepIndicator title="Number of People" step={4} totalSteps={5} />
                        <div className="space-y-4">
                          <PeopleStepper
                            label="Adults"
                            subtitle="Minimum 1 adult required"
                            icon={<Users className="w-5 h-5" />}
                            value={adults}
                            min={1}
                            onChange={setAdults}
                          />
                          <PeopleStepper
                            label="Children"
                            subtitle="Ages 2 to 11 (child rate applies)"
                            icon={<Star className="w-5 h-5" />}
                            value={children}
                            min={0}
                            onChange={setChildren}
                          />
                          <PeopleStepper
                            label="Infants"
                            subtitle="Below 2 years (no seat required)"
                            icon={<Users className="w-5 h-5" />}
                            value={infants}
                            min={0}
                            onChange={setInfants}
                          />

                          {selectedRoomPrice && (
                            <div className="rounded-xl bg-brand-cream p-4 flex justify-between items-center dark:bg-gray-800/50">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedPackage?.title} · {selectedRoomPrice.roomType.name}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatPrice(selectedRoomPrice.price, selectedRoomPrice.currency)} / person
                              </span>
                            </div>
                          )}

                          <Button className="w-full" onClick={handleCalculate} disabled={calculateMutation.isPending || !selectedRoomPrice}>
                            {calculateMutation.isPending ? "Calculating..." : "Calculate Price"}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                        <Button variant="ghost" className="mt-4" onClick={() => setStep(3)}>
                          <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                      </motion.div>
                    )}

                    {step === 5 && result && (
                      <motion.div key="step5" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-green-900/40">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">Your Package Estimate</h2>
                          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                            {result.packageTitle} · {result.durationDays} Days
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl bg-brand-green text-white p-6 text-center">
                            <p className="text-sm text-white/70 mb-1">Estimated Total</p>
                            <p className="text-4xl md:text-5xl font-display font-bold">
                              {displayCurrency} <AnimatedNumber value={result.grandTotal} />
                            </p>
                            <p className="text-xs text-white/60 mt-2">{formatPrice(result.pricePerPerson)} per person</p>
                          </div>

                          <div className="bg-brand-cream rounded-xl p-5 dark:bg-gray-800/50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Airline</p>
                                <p className="font-semibold text-gray-900 flex items-center gap-1.5 dark:text-gray-100">
                                  <Plane className="w-4 h-4 text-brand-green" /> {result.airline || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Room Type</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{result.roomType}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Makkah Hotel</p>
                                <p className="font-semibold text-gray-900 flex items-start gap-1.5 dark:text-gray-100">
                                  <Bed className="w-4 h-4 text-brand-green mt-0.5 flex-shrink-0" /> {result.makkahHotel || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Madinah Hotel</p>
                                <p className="font-semibold text-gray-900 flex items-start gap-1.5 dark:text-gray-100">
                                  <Bed className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" /> {result.madinahHotel || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white border rounded-xl p-5 dark:bg-gray-900 dark:border-white/10">
                            <h3 className="font-semibold mb-3 dark:text-gray-100">Price Breakdown</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="dark:text-gray-400">Adults × {result.adults}</span>
                                <span className="dark:text-gray-100">{formatPrice(result.adultTotal, result.currency)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="dark:text-gray-400">Children × {result.children}</span>
                                <span className="dark:text-gray-100">{formatPrice(result.childTotal, result.currency)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="dark:text-gray-400">Infants × {result.infants}</span>
                                <span className="dark:text-gray-100">{formatPrice(result.infantTotal, result.currency)}</span>
                              </div>
                              <div className="border-t pt-2 flex justify-between font-bold text-lg dark:border-white/10 dark:text-gray-100">
                                <span>Total</span>
                                <span className="text-brand-green">{formatPrice(result.grandTotal, result.currency)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-brand-cream rounded-xl p-5 dark:bg-gray-800/50">
                            <h3 className="font-semibold mb-2 text-sm dark:text-gray-100">Included Services</h3>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(result.includedServices).map(([key, val]) => (
                                val && <Badge key={key} variant="success" className="capitalize">{key}</Badge>
                              ))}
                            </div>
                            {result.flightInfo && (
                              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mt-3 dark:text-gray-400">
                                <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {result.flightInfo.departureDate ? new Date(result.flightInfo.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBA"}</span>
                                {result.flightInfo.baggage && <span>{result.flightInfo.baggage}</span>}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-3 pt-2">
                            <Button className="w-full" asChild>
                              <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsAppMsg)}`} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                WhatsApp This Quotation
                              </a>
                            </Button>
                            <Button variant="secondary" className="w-full" asChild>
                              <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsAppMsg)}`} target="_blank" rel="noopener noreferrer">
                                <Phone className="w-4 h-4 mr-2" />
                                Request Booking
                              </a>
                            </Button>
                            <Button variant="ghost" onClick={reset}>Start Over</Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* Live Summary Sidebar */}
            <div>
              <Card className="lg:sticky lg:top-24">
                <CardHeader>
                  <h2 className="text-xl font-semibold leading-none tracking-tight dark:text-gray-100">Selection Summary</h2>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Duration</span>
                    <span className="font-medium dark:text-gray-100">{selectedPackage ? `${selectedPackage.durationDays} Days` : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Makkah Hotel</span>
                    <span className="font-medium text-right truncate max-w-[180px] dark:text-gray-100">{makkahLine.split(" - ")[0] || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Madinah Hotel</span>
                    <span className="font-medium text-right truncate max-w-[180px] dark:text-gray-100">{madinahLine.split(" - ")[0] || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Room</span>
                    <span className="font-medium dark:text-gray-100">{selectedRoomPrice?.roomType.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">People</span>
                    <span className="font-medium dark:text-gray-100">{adults} adult{adults === 1 ? "" : "s"}, {children} child{children === 1 ? "" : "ren"}, {infants} infant{infants === 1 ? "" : "s"}</span>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">
                      {result ? "Estimated Total" : "Indicative Total"}
                    </p>
                    {result || liveEstimate ? (
                      <p className="text-xl font-display font-bold text-brand-green">
                        {displayCurrency}{" "}
                        <AnimatedNumber value={displayTotal} />
                      </p>
                    ) : (
                      <p className="text-xl font-display font-bold text-brand-green">TBD</p>
                    )}
                    {displayRoomPrice > 0 && (
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">{formatPrice(displayRoomPrice)} per person</p>
                    )}
                    {!result && !liveEstimate && (
                      <p className="text-xs text-gray-400 mt-2 dark:text-gray-500">Select a room type to see a live estimate.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}