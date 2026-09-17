import { Link } from "react-router-dom";
import {
  Plane, MapPin, Calendar, Check, X as XIcon,
  MessageCircle, Calculator, Luggage
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, generateWhatsAppMessage, parseDateList, formatShortDate } from "@/lib/utils";
import { getHotelImageUrl, getHotelImageFallback, getHotelAlt } from "@/lib/hotelImages";
import { useSettings } from "@/hooks/useSettings";
import StarRating from "@/components/hotels/StarRating";
import type { Package } from "@/types";

interface PackageDetailViewProps {
  pkg: Package;
}

export default function PackageDetailView({ pkg }: PackageDetailViewProps) {
  const { data: settings } = useSettings();
  const whatsappNumber = settings?.whatsapp_number || "923713011519";

  const startPrice = pkg.roomPrices.length > 0
    ? Math.min(...pkg.roomPrices.map((rp) => rp.price))
    : null;

  const departureDates = parseDateList(pkg.departureDates);
  const returnDates = parseDateList(pkg.returnDates);
  const singleDeparture = pkg.departureDate ? pkg.departureDate.split("T")[0] : null;
  const singleReturn = pkg.returnDate ? pkg.returnDate.split("T")[0] : null;

  const whatsAppMsg = generateWhatsAppMessage({
    packageName: pkg.title,
    duration: pkg.durationDays,
    airline: pkg.airline?.name || undefined,
    hotelMakkah: pkg.makkahHotel?.hotel?.name
      ? `${pkg.makkahHotel.hotel.name}${pkg.makkahDistance ? ` (${pkg.makkahDistance} from Masjid al-Haram)` : ""}`
      : undefined,
    hotelMadinah: pkg.madinahHotel?.hotel?.name
      ? `${pkg.madinahHotel.hotel.name}${pkg.madinahDistance ? ` (${pkg.madinahDistance} from Masjid an-Nabawi)` : ""}`
      : undefined,
    persons: 1,
    estimatedTotal: startPrice || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="bg-brand-green rounded-xl p-6 text-white">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge variant="secondary" className="bg-brand-gold text-white">{pkg.durationDays} Days</Badge>
          {pkg.status === "ACTIVE" && <Badge variant="success">Available</Badge>}
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">{pkg.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Flight Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {pkg.airline && (
                <div className="flex items-center gap-3">
                  <Plane className="w-5 h-5 text-brand-green" />
                  <div>
                    <p className="font-medium dark:text-gray-100">{pkg.airline.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{pkg.departureCity} → {pkg.arrivalCity}</p>
                  </div>
                </div>
              )}
              {(departureDates.length > 0 || singleDeparture) ? (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium dark:text-gray-100">Departures: {departureDates.length > 0 ? departureDates.map(formatShortDate).join(" · ") : formatShortDate(singleDeparture!)}</p>
                    {(returnDates.length > 0 || singleReturn) && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Returns: {returnDates.length > 0 ? returnDates.map(formatShortDate).join(" · ") : formatShortDate(singleReturn!)}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-brand-green" />
                  <p className="font-medium dark:text-gray-100">Departures: TBA</p>
                </div>
              )}
              {pkg.baggageDetails && (
                <div className="flex items-center gap-3">
                  <Luggage className="w-5 h-5 text-brand-green" />
                  <p className="font-medium dark:text-gray-100">Baggage: {pkg.baggageDetails}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Makkah Hotel</CardTitle></CardHeader>
              <CardContent>
                {pkg.makkahHotel ? (
                  <Link to={`/hotels/${pkg.makkahHotel.hotel.id}`} className="group block space-y-3">
                    <div className="relative rounded-xl overflow-hidden h-40">
                      <picture>
                        <source type="image/webp" srcSet={getHotelImageUrl(pkg.makkahHotel.hotel)} />
                        <img
                          src={getHotelImageFallback(pkg.makkahHotel.hotel)}
                          alt={getHotelAlt(pkg.makkahHotel.hotel)}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            if (!e.currentTarget.src.endsWith("placeholder-hotel.svg")) {
                              e.currentTarget.src = "/images/hotels/placeholder-hotel.svg";
                            }
                          }}
                        />
                      </picture>
                      {pkg.makkahNights && <Badge className="absolute top-3 left-3 bg-brand-green/90 backdrop-blur">{pkg.makkahNights} Nights</Badge>}
                    </div>
                    <p className="font-semibold text-lg group-hover:text-brand-green transition-colors dark:text-gray-100">{pkg.makkahHotel.hotel.name}</p>
                    {pkg.makkahHotel.hotel.starRating && <StarRating rating={pkg.makkahHotel.hotel.starRating} />}
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {pkg.makkahHotel.hotel.location && (
                        <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-green" /> {pkg.makkahHotel.hotel.location}</p>
                      )}
                      {pkg.makkahDistance && <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.makkahDistance} from Masjid al-Haram</p>}
                      {pkg.makkahHotel.hotel.shuttleAvailable && <p className="text-sm text-green-600 font-medium">Free Shuttle</p>}
                    </div>
                  </Link>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Not specified</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Madinah Hotel</CardTitle></CardHeader>
              <CardContent>
                {pkg.madinahHotel ? (
                  <Link to={`/hotels/${pkg.madinahHotel.hotel.id}`} className="group block space-y-3">
                    <div className="relative rounded-xl overflow-hidden h-40">
                      <picture>
                        <source type="image/webp" srcSet={getHotelImageUrl(pkg.madinahHotel.hotel)} />
                        <img
                          src={getHotelImageFallback(pkg.madinahHotel.hotel)}
                          alt={getHotelAlt(pkg.madinahHotel.hotel)}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            if (!e.currentTarget.src.endsWith("placeholder-hotel.svg")) {
                              e.currentTarget.src = "/images/hotels/placeholder-hotel.svg";
                            }
                          }}
                        />
                      </picture>
                      {pkg.madinahNights && <Badge className="absolute top-3 left-3 bg-brand-gold text-white">{pkg.madinahNights} Nights</Badge>}
                    </div>
                    <p className="font-semibold text-lg group-hover:text-brand-green transition-colors dark:text-gray-100">{pkg.madinahHotel.hotel.name}</p>
                    {pkg.madinahHotel.hotel.starRating && <StarRating rating={pkg.madinahHotel.hotel.starRating} />}
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {pkg.madinahHotel.hotel.location && (
                        <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-green" /> {pkg.madinahHotel.hotel.location}</p>
                      )}
                      {pkg.madinahDistance && <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.madinahDistance} from Masjid an-Nabawi</p>}
                      {pkg.madinahHotel.hotel.shuttleAvailable && <p className="text-sm text-green-600 font-medium">Free Shuttle</p>}
                    </div>
                  </Link>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Not specified</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Included Services</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Visa", included: pkg.visaIncluded },
                  { label: "Ticket", included: pkg.ticketIncluded },
                  { label: "Hotel", included: pkg.hotelIncluded },
                  { label: "Transport", included: pkg.transportIncluded },
                  { label: "Guide", included: pkg.guideIncluded },
                  { label: "Ziyarat", included: pkg.ziyaratIncluded },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    {s.included ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <XIcon className="w-4 h-4 text-red-400" />
                    )}
                    <span className={s.included ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}>{s.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {(pkg.infantRate || pkg.childRate) && (
            <Card>
              <CardHeader><CardTitle>Special Rates</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pkg.childRate && (
                  <p className="text-sm dark:text-gray-100"><span className="font-medium">Child Rate:</span> {formatPrice(pkg.childRate)}</p>
                )}
                {pkg.childWithoutBedRate && (
                  <p className="text-sm dark:text-gray-100"><span className="font-medium">Child (No Bed):</span> {formatPrice(pkg.childWithoutBedRate)}</p>
                )}
                {pkg.infantRate && (
                  <p className="text-sm dark:text-gray-100"><span className="font-medium">Infant Rate:</span> {formatPrice(pkg.infantRate)}</p>
                )}
              </CardContent>
            </Card>
          )}

          {pkg.description && (
            <Card>
              <CardHeader><CardTitle>Description</CardTitle></CardHeader>
              <CardContent><p className="text-gray-600 dark:text-gray-400">{pkg.description}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {pkg.roomPrices.map((rp) => (
                <div key={rp.id} className="flex items-center justify-between py-2 border-b last:border-0 dark:border-white/10">
                  <span className="font-medium dark:text-gray-100">{rp.roomType.name}</span>
                  <span className="font-bold text-brand-green">{formatPrice(rp.price)}</span>
                </div>
              ))}
              {startPrice && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Per person, starting from</p>
              )}

              <div className="space-y-3 pt-4">
                <Button className="w-full" asChild>
                  <Link to={`/calculator?packageId=${pkg.id}`}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Price
                  </Link>
                </Button>
                <Button variant="secondary" className="w-full" asChild>
                  <Link to={`/booking?packageId=${pkg.id}`}>
                    Book / Inquire Now
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsAppMsg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp Us
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
