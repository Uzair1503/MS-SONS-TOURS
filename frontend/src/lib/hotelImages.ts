import { Hotel } from "@/types";

export function getHotelImageUrl(hotel: Hotel): string {
  return hotel.images?.[0] || "/images/hotels/placeholder-hotel.svg";
}

export function getHotelImageFallback(hotel: Hotel): string {
  return hotel.images?.[1] || hotel.images?.[0] || "/images/hotels/placeholder-hotel.svg";
}

export function getHotelImages(hotel: Hotel): string[] {
  return hotel.images?.length ? hotel.images : ["/images/hotels/placeholder-hotel.svg"];
}

// Images are stored as [webp, jpg-fallback, webp, jpg-fallback, ...] pairs.
// This collapses each pair to a single displayable entry for galleries.
export function getGalleryImages(hotel: Hotel): string[] {
  const images = getHotelImages(hotel);
  const collapsed: string[] = [];
  for (let i = 0; i < images.length; i += 2) collapsed.push(images[i]);
  if (collapsed.length === 0) collapsed.push(images[images.length - 1]);
  return collapsed;
}

export function isRepresentativeImage(hotel: Hotel): boolean {
  return (hotel.images || []).some((img) => img.toLowerCase().endsWith(".svg"));
}

export function getHotelDistance(hotel: Hotel): string {
  if (hotel.city === "Madinah") return hotel.distanceFromMasjidNabawi || "";
  return hotel.distanceFromHaram || "";
}

export function getDistanceLabel(hotel: Hotel): string {
  const distance = getHotelDistance(hotel);
  if (!distance) return "";
  return hotel.city === "Madinah" ? `${distance} from Masjid an-Nabawi` : `${distance} from Masjid al-Haram`;
}

export function getHotelAlt(hotel: Hotel): string {
  const distance = getDistanceLabel(hotel);
  if (hotel.city === "Madinah") {
    return `${hotel.name} hotel in Madinah${distance ? `, ${distance}` : ""}`;
  }
  return `${hotel.name} hotel in Makkah${distance ? `, ${distance}` : ""}`;
}