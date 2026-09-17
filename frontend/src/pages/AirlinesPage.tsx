import SeoHead from "@/components/shared/Seo";
import { Plane, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAirlines } from "@/hooks/useAirlines";
import ScrollReveal from "@/components/shared/ScrollReveal";
import EmptyState from "@/components/shared/EmptyState";
import AirlineLogo from "@/components/airlines/AirlineLogo";

export default function AirlinesPage() {
  const { data, isLoading } = useAirlines();
  const airlines = data?.data || [];

  return (
    <>
      <SeoHead
        title="Umrah Airlines from Pakistan"
        description="Choose from Saudia, PIA, and AirSial for your Umrah flight from Pakistan to Saudi Arabia. Compare airlines on MS Sons Tours."
        path="/airlines"
      />

      <section className="bg-brand-green py-12 md:py-16">
        <div className="container-custom mx-auto px-4 text-center">
          <Badge variant="secondary" className="bg-brand-gold text-white mb-3">Flight Partners</Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Our Airline Partners</h1>
          <p className="text-white/70 mt-3">Trusted airlines for your sacred journey</p>
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse dark:bg-gray-800" />)}
            </div>
          ) : airlines.length === 0 ? (
            <EmptyState title="No airlines found" description="Airlines will appear here once added." icon={<Plane className="w-12 h-12" />} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {airlines.map((airline: any, i: number) => (
                <ScrollReveal key={airline.id} delay={i * 0.1}>
                  <Card className="card-hover h-full text-center">
                    <CardContent className="p-8 flex flex-col h-full">
                      <AirlineLogo airlineName={airline.name} size="lg" />
                      <h2 className="font-display font-semibold text-2xl mb-2 dark:text-gray-100">{airline.name}</h2>
                      <p className="text-gray-500 text-sm mb-1 dark:text-gray-400">Code: {airline.code}</p>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{airline.departureCity} → {airline.arrivalCity}</span>
                      </div>
                      {airline.baggageAllowance && (
                        <p className="text-sm text-gray-500 mb-3 dark:text-gray-400">Baggage: {airline.baggageAllowance}</p>
                      )}
                      {airline.description && (
                        <p className="text-sm text-gray-600 mb-4 dark:text-gray-400">{airline.description}</p>
                      )}
                      {airline._count && (
                        <Badge variant="success" className="mb-4">{airline._count.packages} packages</Badge>
                      )}
                      <div className="mt-auto pt-4">
                        <Button variant="outline" asChild>
                          <Link to={`/packages?airlineId=${airline.id}`}>View Packages</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
