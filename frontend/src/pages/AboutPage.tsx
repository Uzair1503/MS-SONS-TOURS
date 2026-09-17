import SeoHead from "@/components/shared/Seo";
import { Shield, Star, Users, MapPin } from "lucide-react";
import ScrollReveal from "@/components/shared/ScrollReveal";

export default function AboutPage() {
  return (
    <>
      <SeoHead
        title="About Us | Umrah Travel Agency"
        description="MS Sons Tours is a professional Hajj & Umrah travel agency in Pakistan offering grouped Umrah packages with direct-airline flights, hotels near Haram, visa processing and ground transport."
        path="/about"
      />

      <section className="bg-brand-green py-12 md:py-16">
        <div className="container-custom mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">About MS Sons Tours</h1>
          <p className="text-white/70 mt-3">Your trusted partner for Hajj & Umrah travel</p>
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto max-w-4xl">
          <ScrollReveal>
            <div className="bg-white rounded-xl p-8 md:p-12 shadow-sm mb-8 dark:bg-gray-900 dark:border dark:border-white/10">
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 dark:text-gray-100">Who We Are</h2>
              <p className="text-gray-600 leading-relaxed mb-4 dark:text-gray-400">
                MS Sons Tours is a professional Hajj & Umrah travel agency based in Pakistan. We specialize in organizing
                complete Umrah packages that include flights, hotels, visa processing, and ground transportation.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4 dark:text-gray-400">
                Our mission is to provide a seamless and spiritually fulfilling travel experience for pilgrims journeying
                to the holy cities of Makkah and Madinah. We work with trusted airline partners including Saudia, PIA,
                and AirSial to offer you the best travel options.
              </p>
              <p className="text-gray-600 leading-relaxed dark:text-gray-400">
                With carefully selected hotels in both Makkah and Madinah, we ensure comfortable accommodation
                at convenient distances from the Haram. Our experienced team provides personalized support
                throughout your journey.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: <Shield className="w-6 h-6" />, title: "Trusted & Reliable", desc: "Professional service with attention to detail" },
                { icon: <Star className="w-6 h-6" />, title: "Quality Service", desc: "Carefully curated packages and experiences" },
                { icon: <Users className="w-6 h-6" />, title: "Expert Team", desc: "Experienced travel professionals" },
                { icon: <MapPin className="w-6 h-6" />, title: "Prime Locations", desc: "Hotels near Haram in Makkah & Madinah" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm flex items-start gap-4 dark:bg-gray-900 dark:border dark:border-white/10">
                  <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg dark:text-gray-100">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
