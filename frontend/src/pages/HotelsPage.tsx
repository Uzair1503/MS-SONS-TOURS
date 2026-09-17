import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import SeoHead from "@/components/shared/Seo";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Bed, MapPin, Bus, ArrowRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHotels } from "@/hooks/useHotels";
import ScrollReveal from "@/components/shared/ScrollReveal";
import EmptyState from "@/components/shared/EmptyState";
import {
  getHotelImageUrl,
  getHotelImageFallback,
  getDistanceLabel,
  getHotelAlt,
  isRepresentativeImage,
} from "@/lib/hotelImages";
import type { Hotel } from "@/types";
import StarRating from "@/components/hotels/StarRating";

function HotelCard({ hotel }: { hotel: Hotel }) {
  const distance = getDistanceLabel(hotel);
  const representative = isRepresentativeImage(hotel);

  return (
    <Card className="card-hover h-full flex flex-col overflow-hidden">
      <Link to={`/hotels/${hotel.id}`} className="block relative">
        <div className="relative h-48 overflow-hidden">
          <picture>
            <source type="image/webp" srcSet={getHotelImageUrl(hotel)} />
            <img
              src={getHotelImageFallback(hotel)}
              alt={getHotelAlt(hotel)}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                if (!e.currentTarget.src.endsWith("placeholder-hotel.svg")) {
                  e.currentTarget.src = "/images/hotels/placeholder-hotel.svg";
                }
              }}
            />
          </picture>
          {distance && (
            <Badge className="absolute bottom-3 left-3 bg-brand-gold text-white">
              {distance}
            </Badge>
          )}
          {representative && (
            <Badge className="absolute top-3 right-3 bg-brand-green/90 backdrop-blur">
              Representative
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant={hotel.city === "Makkah" ? "default" : "secondary"}>{hotel.city}</Badge>
          <Badge variant="outline">{hotel.category}</Badge>
        </div>
        {hotel.starRating && <StarRating rating={hotel.starRating} className="mb-2" />}
        <Link to={`/hotels/${hotel.id}`}>
          <h3 className="font-display font-semibold text-lg text-gray-900 mb-2 hover:text-brand-green transition-colors dark:text-gray-100 dark:hover:text-brand-gold">
            {hotel.name}
          </h3>
        </Link>

        <div className="space-y-1.5 text-sm text-gray-600 mb-4 flex-1 dark:text-gray-400">
          {hotel.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-green flex-shrink-0" />
              <span className="truncate">{hotel.location}</span>
            </div>
          )}
          {hotel.shuttleAvailable && (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <Bus className="w-4 h-4 flex-shrink-0" /> Free Shuttle
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link to={`/hotels/${hotel.id}`}>
            View Hotel <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function HotelsPage() {
  const [city, setCity] = useState("");
  const [star, setStar] = useState("");
  const filters: Record<string, string> = { active: "true", limit: "50" };
  if (city && city !== "all") filters.city = city;
  if (star && star !== "all") filters.starRating = star;
  const { data, isLoading } = useHotels(filters);

  const hotels = data?.data || [];

  const starSections = useMemo(() => {
    if (star && star !== "all") return null;
    const groups: { rating: number | null; label: string; hotels: Hotel[] }[] = [];
    const byRating = new Map<number, Hotel[]>();
    const unrated: Hotel[] = [];
    for (const h of hotels) {
      if (h.starRating) {
        const list = byRating.get(h.starRating) || [];
        list.push(h);
        byRating.set(h.starRating, list);
      } else {
        unrated.push(h);
      }
    }
    for (let r = 5; r >= 1; r--) {
      const hs = byRating.get(r);
      if (hs && hs.length > 0) groups.push({ rating: r, label: `${r} Star Hotel${r > 1 ? "s" : ""}`, hotels: hs });
    }
    if (unrated.length > 0) groups.push({ rating: null, label: "Rating Not Available", hotels: unrated });
    return groups;
  }, [hotels, star]);

  return (
    <>
      <SeoHead
        title="Hotels in Makkah & Madinah for Umrah"
        description="Browse Umrah hotels in Makkah and Madinah - see distance from Masjid al-Haram and Masjid an-Nabawi, room types and prices for your Umrah journey."
        path="/hotels"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mssons.com/" },
            { "@type": "ListItem", position: 2, name: "Hotels in Makkah & Madinah", item: "https://www.mssons.com/hotels" },
          ],
        }}
      />

      <section className="bg-brand-green py-12 md:py-16">
        <div className="container-custom mx-auto px-4 text-center">
          <Breadcrumbs
            tone="light"
            items={[{ label: "Hotels in Makkah & Madinah" }]}
          />
          <Badge variant="secondary" className="bg-brand-gold text-white mb-3">Accommodation</Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Hotels in Makkah & Madinah</h1>
          <p className="text-white/70 mt-3">Quality hotels near the Haram for your spiritual journey</p>
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Makkah">Makkah</SelectItem>
                <SelectItem value="Madinah">Madinah</SelectItem>
              </SelectContent>
            </Select>
            <Select value={star} onValueChange={setStar}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Star Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hotels</SelectItem>
                <SelectItem value="1">⭐ 1 Star</SelectItem>
                <SelectItem value="2">⭐⭐ 2 Stars</SelectItem>
                <SelectItem value="3">⭐⭐⭐ 3 Stars</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ 4 Stars</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse dark:bg-gray-800" />
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <EmptyState title="No hotels found" description="Hotels will appear here once added." icon={<Bed className="w-12 h-12" />} />
          ) : starSections ? (
            <div className="space-y-12">
              {starSections.map((group) => (
                <div key={group.rating ?? "unrated"}>
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    {group.rating ? (
                      <div className="flex gap-1">
                        {Array.from({ length: group.rating }, (_, i) => (
                          <Star key={i} className="w-5 h-5 text-brand-gold fill-brand-gold" />
                        ))}
                      </div>
                    ) : (
                      <Star className="w-5 h-5 text-gray-400" />
                    )}
                    <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
                      {group.label}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({group.hotels.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.hotels.map((hotel: Hotel, i: number) => (
                      <ScrollReveal key={hotel.id} delay={i * 0.05}>
                        <HotelCard hotel={hotel} />
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel: Hotel, i: number) => (
                <ScrollReveal key={hotel.id} delay={i * 0.05}>
                  <HotelCard hotel={hotel} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}