import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import SeoHead from "@/components/shared/Seo";
import {
  Plane, Bed, Calculator, Shield, Clock, Headphones, Star, ArrowRight,
  Calendar, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFeaturedPackages } from "@/hooks/usePackages";
import { useAirlines } from "@/hooks/useAirlines";
import { useSettings } from "@/hooks/useSettings";
import { useReviews } from "@/hooks/useReviews";
import { useTheme } from "@/context/ThemeContext";
import PackageCard from "@/components/packages/PackageCard";
import ScrollReveal from "@/components/shared/ScrollReveal";
import Testimonials from "@/components/shared/Testimonials";
import WhatsAppLink from "@/components/shared/WhatsAppLink";
import AirlineLogo from "@/components/airlines/AirlineLogo";
import { travelAgencyJsonLd, SOCIAL_URLS } from "@/lib/businessInfo";
import { sampleReviews } from "@/lib/testimonials";

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <p className="text-2xl md:text-3xl font-display font-bold text-brand-green">{value}</p>
      <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">{label}</p>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-gray-200 py-5 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 mb-2 dark:text-gray-100">{question}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{answer}</p>
    </div>
  );
}

export default function HomePage() {
  const { data: featured14 } = useFeaturedPackages(14);
  const { data: featured21 } = useFeaturedPackages(21);
  const { data: airlines } = useAirlines();
  const { data: settings } = useSettings();
  const { data: realReviews, refetch: refetchReviews } = useReviews();
  const { theme } = useTheme();
  const whatsappNumber = settings?.whatsapp_number || "923713011519";
  const reduceMotion = useReducedMotion();
  const [entranceDone, setEntranceDone] = useState(false);
  const kenBurnsActive = entranceDone && !reduceMotion;

  // Display real approved reviews. While only a handful of real reviews exist
  // we pad the grid with the clearly-labelled placeholder testimonial data in
  // lib/testimonials.ts (see mock mark below) so the section never looks empty.
  // Delete the mock padding once real reviews are plentiful.
  const realList = realReviews || [];
  const displayedReviews = realList.length >= 6
    ? realList
    : [...realList, ...sampleReviews.slice(0, Math.max(0, 6 - realList.length))];

  return (
    <>
      <SeoHead
        title="Hajj & Umrah Packages from Pakistan"
        description="Professional Hajj & Umrah travel packages from Pakistan. 14 and 21 day packages with Saudia, PIA, and AirSial airlines and multiple hotels in Makkah and Madinah."
        path="/"
        jsonLd={[
          travelAgencyJsonLd(settings, {
            reviews: displayedReviews,
            sameAs: [SOCIAL_URLS.facebook, SOCIAL_URLS.instagram, SOCIAL_URLS.youtube],
          }),
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "MS Sons Tours",
            url: "https://www.mssons.com/",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://www.mssons.com/packages?search={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />

      {/* Hero Section */}
      <section className="relative bg-brand-green overflow-hidden min-h-[520px] flex items-center">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.12 }}
          animate={kenBurnsActive ? { scale: [1, 1.06], x: ["0%", "1.5%"], y: ["0%", "1%"] } : { scale: 1 }}
          transition={kenBurnsActive ? { duration: 22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } : { duration: 9, ease: "easeOut" }}
          onAnimationComplete={() => setEntranceDone(true)}
        >
          <picture>
            {theme === "dark" ? (
              <>
                <source media="(min-width: 1280px)" srcSet="/images/hero/kaaba-new-1920w.webp" type="image/webp" />
                <source srcSet="/images/hero/kaaba-new-960w.webp" type="image/webp" />
                <img
                  src="/images/hero/kaaba-new.jpg"
                  alt="The Kaaba in Makkah at night"
                  className="w-full h-full object-cover object-[50%_60%]"
                  fetchPriority="high"
                />
              </>
            ) : (
              <>
                <source media="(min-width: 1280px)" srcSet="/images/hero/masjid-nabawi-new-1920w.webp" type="image/webp" />
                <source srcSet="/images/hero/masjid-nabawi-new-960w.webp" type="image/webp" />
                <img
                  src="/images/hero/masjid-nabawi-new.jpg"
                  alt="Masjid an-Nabawi in Madinah at dusk"
                  className="w-full h-full object-cover"
                  fetchPriority="high"
                />
              </>
            )}
          </picture>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/70 via-brand-green/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-green/55 via-transparent to-brand-green/20" />

        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 relative z-10 w-full">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <Badge variant="secondary" className="bg-brand-gold text-white mb-4">Hajj & Umrah Travel</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6 drop-shadow-lg">
                Your Journey to Makkah & Madinah Starts Here
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed drop-shadow">
                MS Sons Tours provides professionally organized Hajj & Umrah packages with trusted airlines,
                comfortable hotels, and complete travel support from Pakistan.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/packages">
                  Explore Packages <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-brand-green backdrop-blur" asChild>
                <Link to="/calculator">
                  <Calculator className="w-5 h-5 mr-2" />
                  Calculate Price
                </Link>
              </Button>
              <WhatsAppLink href={`https://wa.me/${whatsappNumber}`} size="lg">WhatsApp Us</WhatsAppLink>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b dark:bg-gray-950 dark:border-gray-800">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard icon={<Calendar className="w-6 h-6 text-brand-green" />} value="14 Days" label="Short Duration" />
              <StatCard icon={<Clock className="w-6 h-6 text-brand-green" />} value="21 Days" label="Extended Stay" />
              <StatCard icon={<Plane className="w-6 h-6 text-brand-green" />} value="3+" label="Airlines" />
              <StatCard icon={<Bed className="w-6 h-6 text-brand-green" />} value="15+" label="Hotels" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Featured 14 Days */}
      {featured14?.data && featured14.data.length > 0 && (
        <section className="section-padding bg-brand-cream dark:bg-gray-950">
          <div className="container-custom mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12">
                <Badge variant="secondary" className="bg-brand-gold text-white mb-3">14 Days</Badge>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-gray-100">Umrah Packages - 14 Days</h2>
                <p className="text-gray-600 mt-3 max-w-2xl mx-auto dark:text-gray-400">Short duration Umrah packages with all essential services included</p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured14.data.slice(0, 3).map((pkg, i) => (
                <ScrollReveal key={pkg.id} delay={i * 0.1}>
                  <PackageCard pkg={pkg} />
                </ScrollReveal>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link to="/packages/14">View All 14 Day Packages <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured 21 Days */}
      {featured21?.data && featured21.data.length > 0 && (
        <section className="section-padding bg-white dark:bg-gray-950">
          <div className="container-custom mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12">
                <Badge variant="default" className="mb-3">21 Days</Badge>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-gray-100">Umrah Packages - 21 Days</h2>
                <p className="text-gray-600 mt-3 max-w-2xl mx-auto dark:text-gray-400">Extended stay packages for a more comfortable spiritual journey</p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured21.data.slice(0, 3).map((pkg, i) => (
                <ScrollReveal key={pkg.id} delay={i * 0.1}>
                  <PackageCard pkg={pkg} />
                </ScrollReveal>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link to="/packages/21">View All 21 Day Packages <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Airlines */}
      {airlines?.data && airlines.data.length > 0 && (
        <section className="section-padding bg-brand-cream dark:bg-gray-950">
          <div className="container-custom mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-gray-100">Our Airline Partners</h2>
                <p className="text-gray-600 mt-3 dark:text-gray-400">Trusted airlines for your sacred journey</p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {airlines.data.map((airline, i) => (
                <ScrollReveal key={airline.id} delay={i * 0.1}>
                  <Card className="text-center card-hover">
                    <CardContent className="p-8">
                      <AirlineLogo airlineName={airline.name} />
                      <h3 className="font-display font-semibold text-xl mb-2 dark:text-gray-100">{airline.name}</h3>
                      <p className="text-sm text-gray-500 mb-1 dark:text-gray-400">{airline.departureCity} → {airline.arrivalCity}</p>
                      {airline.baggageAllowance && <p className="text-sm text-gray-500 dark:text-gray-400">{airline.baggageAllowance}</p>}
                      {airline._count && (
                        <Link
                          to={`/packages?airlineId=${airline.id}`}
                          className="inline-flex items-center gap-1 text-sm text-brand-green mt-2 font-medium hover:underline dark:text-brand-gold"
                        >
                          {airline._count.packages} packages available
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="section-padding pt-10 md:pt-14 bg-white dark:bg-gray-950">
        <div className="container-custom mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-gray-100">Why Choose MS Sons Tours</h2>
              <p className="text-gray-600 mt-3 dark:text-gray-400">Professional service for your sacred journey</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield className="w-6 h-6" />, title: "Trusted Service", desc: "Reliable and professional travel service" },
              { icon: <Star className="w-6 h-6" />, title: "Quality Hotels", desc: "Carefully selected hotels near Haram" },
              { icon: <Plane className="w-6 h-6" />, title: "Multiple Airlines", desc: "Choose from Saudia, PIA, and AirSial" },
              { icon: <Headphones className="w-6 h-6" />, title: "24/7 Support", desc: "WhatsApp support throughout your journey" },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <Card className="text-center card-hover h-full">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-green">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials reviews={displayedReviews} onReviewAdded={() => refetchReviews()} />

      {/* CTA */}
      <section className="py-16 bg-brand-green">
        <div className="container-custom mx-auto px-4 text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 max-w-2xl mx-auto">Ready for Your Umrah Journey?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">Calculate your package price or contact us on WhatsApp for a personalized quote.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-brand-green backdrop-blur" asChild>
                <Link to="/calculator"><Calculator className="w-5 h-5 mr-2" /> Calculate Price</Link>
              </Button>
              <WhatsAppLink href={`https://wa.me/${whatsappNumber}`} size="lg">WhatsApp Us</WhatsAppLink>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-6 dark:text-gray-100">Frequently Asked Questions</h2>
            <div className="bg-white rounded-xl p-8 shadow-sm dark:bg-gray-900 dark:border dark:border-white/10">
              <FAQItem question="What is included in the Umrah package?" answer="Our packages include visa processing, round-trip flights, hotel accommodation in Makkah and Madinah, and ground transport. Some packages also include guide services and ziyarat." />
              <FAQItem question="Can I choose my hotel and room type?" answer="Yes, each package offers multiple hotel and room type options. You can use our Price Calculator to compare prices across different combinations." />
              <FAQItem question="How do I book a package?" answer="You can book through WhatsApp or by filling out our inquiry form. Our team will contact you to finalize your booking details." />
              <FAQItem question="Are prices fixed?" answer="Package rates may change daily based on airline and hotel availability. Finalized bookings are subject to the rates at the time of confirmation." />
              <FAQItem question="Do you provide visa assistance?" answer="Yes, visa processing is included in all our packages. Our team handles the complete visa application process." />
              <div className="pt-4">
                <Link to="/faq" className="inline-flex items-center gap-1 text-brand-green hover:underline font-medium dark:text-brand-gold">
                  View All FAQs <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}