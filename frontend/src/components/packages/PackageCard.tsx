import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Bed, Users, MessageCircle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, generateWhatsAppMessage, parseDateList, formatShortDate } from "@/lib/utils";
import { getHotelImageUrl, getHotelAlt } from "@/lib/hotelImages";
import { useSettings } from "@/hooks/useSettings";
import StarRating from "@/components/hotels/StarRating";
import type { Package } from "@/types";

interface PackageCardProps {
  pkg: Package;
  showDurationBadge?: boolean;
  thumbnailSrc?: string;
  thumbnailAlt?: string;
}

const MAX_VISIBLE_DATES = 3;

export default function PackageCard({ pkg, showDurationBadge = true, thumbnailSrc, thumbnailAlt }: PackageCardProps) {
  const { data: settings } = useSettings();
  const whatsappNumber = settings?.whatsapp_number || "923713011519";

  const startingPrice = pkg.roomPrices.length > 0
    ? Math.min(...pkg.roomPrices.map((rp) => rp.price))
    : null;

  const roomTypes = pkg.roomPrices.map((rp) => rp.roomType.name).join(", ");

  const departureDates = parseDateList(pkg.departureDates);
  const returnDates = parseDateList(pkg.returnDates);
  const shownDepartures = departureDates.slice(0, MAX_VISIBLE_DATES);
  const extraDepartures = departureDates.length - shownDepartures.length;
  const shownReturns = returnDates.slice(0, MAX_VISIBLE_DATES);
  const extraReturns = returnDates.length - shownReturns.length;
  const singleDeparture = pkg.departureDate
    ? formatShortDate(pkg.departureDate.split("T")[0])
    : null;
  const singleReturn = pkg.returnDate ? formatShortDate(pkg.returnDate.split("T")[0]) : null;

  const makkahDistance = pkg.makkahDistance || pkg.makkahHotel?.distance || null;
  const madinahDistance = pkg.madinahDistance || pkg.madinahHotel?.distance || null;

  // TODO: Replace with a dedicated per-package image when available; for now
  // uses the Makkah/Madinah hotel photo with a site-wide themed placeholder fallback.
  const thumbHotel = pkg.makkahHotel?.hotel || pkg.madinahHotel?.hotel;
  const thumbUrl = thumbnailSrc || (thumbHotel ? getHotelImageUrl(thumbHotel) : "/images/hotels/placeholder-hotel.svg");
  const thumbAlt = thumbnailAlt || (thumbHotel ? getHotelAlt(thumbHotel) : `${pkg.title} hotel accommodation`);

  const whatsAppMsg = generateWhatsAppMessage({
    packageName: pkg.title,
    duration: pkg.durationDays,
    airline: pkg.airline?.name || undefined,
    hotelMakkah: pkg.makkahHotel?.hotel?.name
      ? `${pkg.makkahHotel.hotel.name}${makkahDistance ? ` (${makkahDistance} from Masjid al-Haram)` : ""}`
      : undefined,
    hotelMadinah: pkg.madinahHotel?.hotel?.name
      ? `${pkg.madinahHotel.hotel.name}${madinahDistance ? ` (${madinahDistance} from Masjid an-Nabawi)` : ""}`
      : undefined,
    persons: 1,
    estimatedTotal: startingPrice || undefined,
  });

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="relative h-40 flex-shrink-0">
          <img
            src={thumbUrl}
            alt={thumbAlt}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              if (!e.currentTarget.src.endsWith("placeholder-hotel.svg")) {
                e.currentTarget.src = "/images/hotels/placeholder-hotel.svg";
              }
            }}
          />
        </div>
        <div className="bg-brand-green px-4 py-2 flex items-center justify-between gap-2">
          {showDurationBadge && (
            <Badge variant={pkg.durationDays === 14 ? "secondary" : "default"} className="bg-brand-gold text-white">
              {pkg.durationDays} DAYS
            </Badge>
          )}
          {pkg.airline && (
            <span className={`text-white text-xs font-medium ${showDurationBadge ? "" : "ml-auto"}`}>{pkg.airline.name}</span>
          )}
        </div>

        <CardContent className="p-5 flex flex-col flex-1">
          <div className="mb-3">
            <h3 className="font-display font-semibold text-lg text-gray-900 line-clamp-2 dark:text-gray-100">
              {pkg.title}
            </h3>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-5 flex-1 dark:text-gray-400">
            <div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                {(departureDates.length > 0 || singleDeparture) ? (
                  <span>
                    Depart: {departureDates.length > 0 ? (
                      <>
                        {shownDepartures.map(formatShortDate).join(", ")}
                        {extraDepartures > 0 && <span className="text-gray-400 dark:text-gray-500"> +{extraDepartures} more</span>}
                      </>
                    ) : singleDeparture}
                  </span>
                ) : (
                  <span className="text-gray-400">Depart: TBA</span>
                )}
              </div>
              {(returnDates.length > 0 || singleReturn) && (
                <div className="flex items-start gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Return: {returnDates.length > 0 ? (
                      <>
                        {shownReturns.map(formatShortDate).join(", ")}
                        {extraReturns > 0 && <span className="text-gray-400 dark:text-gray-500"> +{extraReturns} more</span>}
                      </>
                    ) : singleReturn}
                  </span>
                </div>
              )}
            </div>
            {pkg.makkahHotel && (
              <div>
                <p className="text-xs font-semibold text-brand-green dark:text-brand-gold tracking-wide mb-1">Makkah</p>
                <div className="flex items-start gap-2">
                  <Bed className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="block">
                      {pkg.makkahHotel.hotel.name}
                      <span className="text-gray-400"> ({pkg.makkahNights} nights)</span>
                    </span>
                    {makkahDistance && (
                      <span className="block text-xs text-brand-green font-medium mt-0.5 flex items-center gap-1 dark:text-brand-gold">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {makkahDistance} from Haram
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
            {pkg.makkahHotel?.hotel.starRating && (
              <div className="pl-6">
                <StarRating rating={pkg.makkahHotel.hotel.starRating} />
              </div>
            )}
            {pkg.madinahHotel && (
              <div className="border-t border-gray-100 pt-5 dark:border-white/10">
                <p className="text-xs font-semibold text-brand-green dark:text-brand-gold tracking-wide mb-1">Madinah</p>
                <div className="flex items-start gap-2">
                  <Bed className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="block">
                      {pkg.madinahHotel.hotel.name}
                      <span className="text-gray-400"> ({pkg.madinahNights} nights)</span>
                    </span>
                    {madinahDistance && (
                      <span className="block text-xs text-brand-green font-medium mt-0.5 flex items-center gap-1 dark:text-brand-gold">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {madinahDistance} from Nabawi
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
            {pkg.madinahHotel?.hotel.starRating && (
              <div className="pl-6">
                <StarRating rating={pkg.madinahHotel.hotel.starRating} />
              </div>
            )}
            {roomTypes && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span className="truncate">{roomTypes}</span>
              </div>
            )}
          </div>

          {startingPrice && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">Starting from</p>
              <p className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
                {formatPrice(startingPrice)}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
            <Button variant="default" size="sm" className="flex-1" asChild>
              <Link to={`/package/${pkg.id}`}>View Details</Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 border-green-500 text-green-500 hover:bg-green-500 hover:border-green-500 hover:text-white dark:border-green-500 dark:text-green-500 dark:hover:bg-green-500 dark:hover:border-green-500 dark:hover:text-white" asChild>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsAppMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ask about this package on WhatsApp"
                title="Ask about this package on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                Ask
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}