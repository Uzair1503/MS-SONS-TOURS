import SeoHead from "@/components/shared/Seo";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import ScrollReveal from "@/components/shared/ScrollReveal";

const faqs = [
  { q: "What is included in the Umrah package?", a: "Our packages include visa processing, round-trip flights, hotel accommodation in Makkah and Madinah, and ground transport. Some packages also include guide services and ziyarat." },
  { q: "Can I choose my hotel and room type?", a: "Yes, each package offers multiple hotel and room type options. You can use our Price Calculator to compare prices across different combinations." },
  { q: "How do I book a package?", a: "You can book through WhatsApp or by filling out our inquiry form on the website. Our team will contact you to finalize your booking details." },
  { q: "Are prices fixed?", a: "Package rates may change daily based on airline and hotel availability. Finalized bookings are subject to the rates at the time of confirmation." },
  { q: "Do you provide visa assistance?", a: "Yes, visa processing is included in all our packages. Our team handles the complete visa application process." },
  { q: "What airlines do you work with?", a: "We work with Saudia (Saudi Arabian Airlines), PIA (Pakistan International Airlines), and AirSial for flights from Islamabad to Jeddah." },
  { q: "What are the payment terms?", a: "Booking is confirmed upon receipt of advance payment. Full payment is required before departure. Contact us for specific payment plans." },
  { q: "Can I modify my booking after confirmation?", a: "Modification policies depend on the airline and hotel. Please contact us as soon as possible if you need to make changes." },
  { q: "Is there a cancellation policy?", a: "Cancellation policies vary by package and airline. Contact us for specific details regarding your booking." },
  { q: "Do you offer group discounts?", a: "Please contact us directly to discuss group travel options and any available discounts for larger parties." },
];

export default function FAQPage() {
  const { data: settings } = useSettings();
  const whatsappNumber = settings?.whatsapp_number || "923713011519";

  return (
    <>
      <SeoHead
        title="Umrah Package FAQ | MS Sons Tours"
        description="Frequently asked questions about MS Sons Tours Umrah packages - what's included, how to book, visa assistance, airlines, payment terms and cancellation."
        path="/faq"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }}
      />

      <section className="bg-brand-green py-12 md:py-16">
        <div className="container-custom mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Frequently Asked Questions</h1>
          <p className="text-white/70 mt-3">Find answers to common questions about our services</p>
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto max-w-3xl">
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm dark:bg-gray-900 dark:border dark:border-white/10">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 0.05}>
                <div className="border-b border-gray-100 py-4 last:border-0 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 mb-2 dark:text-gray-100">{faq.q}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4 dark:text-gray-400">Still have questions? Contact us directly.</p>
            <Button asChild>
              <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Assalam o Alaikum, I have a question about Umrah packages.")}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
