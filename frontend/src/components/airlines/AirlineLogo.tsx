import { useState } from "react";
import { Plane } from "lucide-react";
import { getAirlineLogo } from "@/lib/airlineLogos";

interface AirlineLogoProps {
  airlineName: string;
  size?: "md" | "lg";
}

export default function AirlineLogo({ airlineName, size = "md" }: AirlineLogoProps) {
  const [error, setError] = useState(false);
  const src = getAirlineLogo(airlineName);
  const showImg = src && !error;
  const badgeClass = size === "lg" ? "w-20 h-20" : "w-16 h-16";
  const iconClass = size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const boxClass = size === "lg" ? "h-16 w-40" : "h-12 w-32";
  const imgClass = size === "lg" ? "h-11 w-auto" : "h-9 w-auto";

  if (showImg) {
    return (
      <div className={`flex items-center justify-center mx-auto mb-3 max-w-full ${boxClass}`}>
        <img
          src={src}
          alt={`${airlineName} logo`}
          loading="lazy"
          className={`object-contain max-w-full ${imgClass}`}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-3 ${badgeClass}`}>
      <Plane className={`text-brand-green ${iconClass}`} />
    </div>
  );
}