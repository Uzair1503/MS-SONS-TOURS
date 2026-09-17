import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number | null | undefined;
  className?: string;
  withLabel?: boolean;
  tone?: "default" | "light";
  label?: string;
}

export default function StarRating({ rating, className = "", withLabel = true, tone = "default", label }: StarRatingProps) {
  if (!rating || rating < 1 || rating > 5) return null;
  const emptyClass = tone === "light" ? "text-white/40" : "text-gray-300 dark:text-gray-600";
  const textClass = tone === "light" ? "text-white/80" : "text-gray-600 dark:text-gray-400";
  const starText = label ?? `${rating} Star${rating === 1 ? "" : "s"}`;
  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-label={label ?? `${rating} star${rating === 1 ? "" : "s"}`}>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? "text-brand-gold fill-brand-gold" : emptyClass}`}
          />
        ))}
      </div>
      {withLabel && <span className={`text-sm ${textClass}`}>{starText}</span>}
    </div>
  );
}