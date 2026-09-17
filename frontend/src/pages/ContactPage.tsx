import SeoHead from "@/components/shared/Seo";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { getBusinessInfo, travelAgencyJsonLd } from "@/lib/businessInfo";

export default function ContactPage() {
  const { data: settings } = useSettings();
  const info = getBusinessInfo(settings);

  return (
    <>
      <SeoHead
        title="Contact Us | MS Sons Tours"
        description={`Contact MS Sons Tours for Hajj & Umrah bookings and inquiries - WhatsApp ${info.whatsappNumber}, phone ${info.phone} or email ${info.email}.`}
        path="/contact"
        jsonLd={travelAgencyJsonLd(settings)}
      />

      <section className="bg-brand-green py-12 md:py-16">
        <div className="container-custom mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Contact Us</h1>
          <p className="text-white/70 mt-3">We're here to help with your Umrah journey</p>
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-semibold text-lg mb-2 dark:text-gray-100">WhatsApp</h2>
                <p className="text-gray-500 text-sm mb-4 dark:text-gray-400">Chat with us directly on WhatsApp</p>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`https://wa.me/${info.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                    Chat on WhatsApp
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-semibold text-lg mb-2 dark:text-gray-100">Phone</h2>
                <p className="text-gray-500 text-sm mb-4 dark:text-gray-400">Call us directly</p>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`tel:${info.phone.replace(/\s/g, "")}`}>
                    {info.phone}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-semibold text-lg mb-2 dark:text-gray-100">Email</h2>
                <p className="text-gray-500 text-sm mb-4 dark:text-gray-400">Send us an email</p>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:${info.email}`}>{info.email}</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-semibold text-lg mb-2 dark:text-gray-100">Office</h2>
                <p className="text-gray-500 text-sm mb-4 dark:text-gray-400">Visit our office</p>
                <p className="text-sm font-medium mb-4 dark:text-gray-200">{info.address}</p>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}`} target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-4 h-4 mr-2" />
                    View on Map
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
