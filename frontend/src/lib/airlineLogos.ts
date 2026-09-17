const AIRLINE_LOGOS: Record<string, string> = {
  airsial: "/images/airlines/airsial-logo.png",
  pia: "/images/airlines/pia-logo.png",
  saudia: "/images/airlines/saudia-logo.png",
};

export function getAirlineLogo(name: string | null | undefined): string | null {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  return AIRLINE_LOGOS[key] || null;
}