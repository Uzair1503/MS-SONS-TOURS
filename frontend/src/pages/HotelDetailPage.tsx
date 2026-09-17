import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Bus, Bed, CameraOff, ArrowRight, Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHotel } from "@/hooks/useHotels";
import { usePackages } from "@/hooks/usePackages";
import {
  getHotelImageUrl,
  getGalleryImages,
  getDistanceLabel,
  getHotelAlt,
  isRepresentativeImage,
} from "@/lib/hotelImages";
import PackageCard from "@/components/packages/PackageCard";
import ScrollReveal from "@/components/shared/ScrollReveal";
import StarRating from "@/components/hotels/StarRating";
import SeoHead from "@/components/shared/Seo";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { canonicalUrl } from "@/lib/seo";

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: hotelData, isLoading } = useHotel(id || "");
  const { data: packagesData, isLoading: packagesLoading } = usePackages({
    status: "ACTIVE",
    hotelRefId: id || "",
    limit: "50",
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightIndex, setLightIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  const hotel = hotelData?.data;
  const gallery = hotel ? getGalleryImages(hotel) : [];
  const packages = packagesData?.data || [];

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
        return;
      }
      if (gallery.length > 1 && e.key === "ArrowRight") {
        setLightIndex((i) => Math.min(i + 1, gallery.length - 1));
        setZoom(1);
      }
      if (gallery.length > 1 && e.key === "ArrowLeft") {
        setLightIndex((i) => Math.max(i - 1, 0));
        setZoom(1);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, gallery.length]);

  if (isLoading) {
    return (
      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto">
          <div className="h-80 bg-gray-200 rounded-xl animate-pulse dark:bg-gray-800" />
          <div className="mt-6 h-10 bg-gray-200 rounded-lg animate-pulse w-1/2 dark:bg-gray-800" />
          <div className="mt-4 h-4 bg-gray-200 rounded animate-pulse w-2/3 dark:bg-gray-800" />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-72 bg-gray-200 rounded-xl animate-pulse dark:bg-gray-800" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!hotel) {
    return (
      <section className="section-padding bg-brand-cream min-h-[60vh] dark:bg-gray-950">
        <div className="container-custom mx-auto text-center py-16">
          <CameraOff className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-gray-500" />
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-2 dark:text-gray-100">Hotel not found</h1>
          <p className="text-gray-500 mb-6 dark:text-gray-400">The hotel you are looking for does not exist.</p>
          <Button asChild>
            <Link to="/hotels">Browse All Hotels</Link>
          </Button>
        </div>
      </section>
    );
  }

  const distance = getDistanceLabel(hotel);
  const representative = isRepresentativeImage(hotel);
  const hotelName = hotel.name;

  const gallerySafeIndex = Math.min(activeIndex, Math.max(gallery.length - 1, 0));

  const mainImage = gallery[gallerySafeIndex] || getHotelImageUrl(hotel);
  const mainImageIndex = hotel.images.indexOf(mainImage);
  const mainFallback = mainImageIndex >= 0 && mainImageIndex + 1 < hotel.images.length
    ? hotel.images[mainImageIndex + 1]
    : mainImage;

  const thumbFor = (webp: string) => {
    const idx = hotel.images.indexOf(webp);
    return idx >= 0 && idx + 1 < hotel.images.length ? hotel.images[idx + 1] : webp;
  };

  const openLightbox = (index: number) => {
    setLightIndex(index);
    setZoom(1);
    setLightboxOpen(true);
  };

  const hairline = hotel.images?.[0];
  const hotelImage = hairline && !hairline.toLowerCase().endsWith(".svg") ? hairline : undefined;

  return (
    <>
      <SeoHead
        title={`${hotel.name} ${hotel.city === "Madinah" ? "Madinah" : "Makkah"} | Umrah Hotel`}
        description={`${hotel.name} hotel in ${hotel.city}, ${distance}. Book through MS Sons Tours Umrah packages from Pakistan.`}
        path={`/hotels/${id}`}
        image={hotelImage ? `${canonicalUrl("/")}${hotelImage}` : undefined}
        imageAlt={getHotelAlt(hotel)}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mssons.com/" },
              { "@type": "ListItem", position: 2, name: "Hotels in Makkah & Madinah", item: "https://www.mssons.com/hotels" },
              { "@type": "ListItem", position: 3, name: hotel.name, item: `https://www.mssons.com/hotels/${id}` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Hotel",
            name: hotel.name,
            url: `https://www.mssons.com/hotels/${id}`,
            image: hotelImage ? `${canonicalUrl("/")}${hotelImage}` : `https://www.mssons.com/favicon.svg`,
            ...(hotel.location ? { address: { "@type": "PostalAddress", addressLocality: hotel.city, streetAddress: hotel.location } } : {}),
            ...(hotel.description ? { description: hotel.description } : {}),
          },
        ]}
      />

      <section className="bg-brand-green py-12 md:py-16">
        <div className="container-custom mx-auto px-4 text-center">
          <div className="flex justify-center">
            <Breadcrumbs
              tone="light"
              items={[
                { label: "Hotels in Makkah & Madinah", to: "/hotels" },
                { label: hotel.name },
              ]}
            />
          </div>
          <div className="flex justify-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-brand-gold text-white">{hotel.city}</Badge>
            <Badge variant="outline" className="text-white border-white/40">{hotel.category}</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">{hotel.name}</h1>
          {hotel.starRating && (
            <div className="mt-3 flex justify-center">
              <StarRating rating={hotel.starRating} tone="light" label={`${hotel.starRating} Star Hotel`} />
            </div>
          )}
          <p className="text-white/70 mt-3">{distance}</p>
          <div className="mt-6 flex justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/calculator">
                Start with this hotel <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto">
          <ScrollReveal>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-10 dark:bg-gray-900 dark:border dark:border-white/10">
              <div className="relative group cursor-zoom-in" onClick={() => openLightbox(gallerySafeIndex)}>
                <picture>
                  <source type="image/webp" srcSet={mainImage} />
                  <img
                    src={mainFallback}
                    alt={getHotelAlt(hotel)}
                    className="w-full h-56 sm:h-80 md:h-[440px] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      if (!e.currentTarget.src.endsWith("placeholder-hotel.svg")) {
                        e.currentTarget.src = "/images/hotels/placeholder-hotel.svg";
                      }
                    }}
                  />
                </picture>
                {representative && (
                  <Badge className="absolute top-4 left-4 bg-brand-green/90 backdrop-blur">
                    Representative Image
                  </Badge>
                )}
                {distance && (
                  <Badge className="absolute bottom-4 left-4 bg-brand-gold text-white">
                    {distance}
                  </Badge>
                )}
                <span className="absolute bottom-4 right-4 bg-black/40 backdrop-blur text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
                  <Maximize2 className="w-4 h-4" />
                </span>
              </div>

              {gallery.length > 1 && (
                <div className="flex gap-2 sm:gap-3 p-4 overflow-x-auto">
                  {gallery.map((img, i) => (
                    <button
                      key={img + i}
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      className={`group flex-shrink-0 rounded-xl overflow-hidden w-20 h-16 sm:w-28 sm:h-20 shadow-sm cursor-pointer transition-all duration-300 ${
                        activeIndex === i
                          ? "ring-2 ring-brand-green ring-offset-2 shadow-md dark:ring-offset-gray-900"
                          : "opacity-75 hover:opacity-100"
                      }`}
                      aria-label={`View photo ${i + 1} of ${hotel.name}`}
                    >
                      <img src={thumbFor(img)} alt={`${hotel.name} photo ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" onError={(e) => {
                        e.currentTarget.onerror = null;
                        if (!e.currentTarget.src.endsWith("placeholder-hotel.svg")) {
                          e.currentTarget.src = "/images/hotels/placeholder-hotel.svg";
                        }
                      }} />
                    </button>
                  ))}
                </div>
              )}

              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-600 mb-6 dark:text-gray-400">
                  {hotel.location && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-green" /> {hotel.location}
                    </span>
                  )}
                  {hotel.shuttleAvailable && (
                    <span className="inline-flex items-center gap-2 text-green-600 font-medium">
                      <Bus className="w-4 h-4" /> Free Shuttle
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <Bed className="w-4 h-4 text-brand-green" /> {hotel.category}
                  </span>
                </div>

                {representative && (
                  <p className="text-xs text-gray-500 italic mb-6 dark:text-gray-400">
                    The official photo for this hotel is coming soon. The image shown above is representative.
                  </p>
                )}

                {hotel.description && (
                  <p className="text-gray-700 leading-relaxed mb-6 dark:text-gray-300">{hotel.description}</p>
                )}

                {hotel.amenities.length > 0 && (
                  <div className="mb-6">
                    <h2 className="font-display font-semibold text-lg mb-3 dark:text-gray-100">Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.map((a) => (
                        <Badge key={a} variant="outline">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </ScrollReveal>

          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
              Packages including {hotelName}
            </h2>
            <p className="text-gray-600 mt-2 dark:text-gray-400">
              {packagesLoading ? "Loading packages..." : `${packages.length} active package${packages.length === 1 ? "" : "s"} available`}
            </p>
          </div>

          {packages.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No active packages are currently associated with this hotel. Contact us on WhatsApp for the latest availability.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg, i) => (
                <ScrollReveal key={pkg.id} delay={i * 0.05}>
                  <PackageCard
                    pkg={pkg}
                    thumbnailSrc={gallery.length > 1 ? thumbFor(gallery[(i + 1) % gallery.length]) : undefined}
                    thumbnailAlt={getHotelAlt(hotel)}
                  />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${hotel.name} photo viewer`}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 text-white z-10" style={{ width: "100%" }}>
              <span className="text-sm text-white/80">
                {gallery.length > 1 ? `Photo ${lightIndex + 1} of ${gallery.length}` : hotel.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(z + 0.5, 3))}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(z - 0.5, 0.5))}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="bg-white/10 hover:bg-red-500 text-white rounded-full p-2 transition-colors ml-2"
                  aria-label="Close viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-2 sm:px-8 pb-4 overflow-hidden" onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2))}>
              <motion.img
                key={lightIndex}
                src={thumbFor(gallery[lightIndex] || gallery[gallery.length - 1] || mainImage)}
                alt={`${getHotelAlt(hotel)} enlarged`}
                className="max-h-full max-w-full rounded-lg object-contain select-none shadow-2xl"
                animate={{ scale: zoom }}
                transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.8 }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  if (!e.currentTarget.src.endsWith("placeholder-hotel.svg")) {
                    e.currentTarget.src = "/images/hotels/placeholder-hotel.svg";
                  }
                }}
              />
            </div>

            {gallery.length > 1 && (
              <div className="flex items-center justify-center gap-5 pb-5 text-white">
                <button
                  type="button"
                  onClick={() => {
                    setLightIndex((i) => Math.max(i - 1, 0));
                    setZoom(1);
                  }}
                  disabled={lightIndex === 0}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-full p-3 transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-sm text-white/50">
                  {lightIndex + 1} / {gallery.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLightIndex((i) => Math.min(i + 1, gallery.length - 1));
                    setZoom(1);
                  }}
                  disabled={lightIndex >= gallery.length - 1}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-full p-3 transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}