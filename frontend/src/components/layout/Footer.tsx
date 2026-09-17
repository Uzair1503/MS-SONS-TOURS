import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { getBusinessInfo, SOCIAL_URLS } from "@/lib/businessInfo";
import WhatsAppLink from "@/components/shared/WhatsAppLink";

export default function Footer() {
  const { data: settings } = useSettings();
  const info = getBusinessInfo(settings);

  const socialLinks = [
    { label: "Facebook", href: SOCIAL_URLS.facebook, icon: <Facebook className="w-4 h-4" /> },
    { label: "Instagram", href: SOCIAL_URLS.instagram, icon: <Instagram className="w-4 h-4" /> },
    { label: "YouTube", href: SOCIAL_URLS.youtube, icon: <Youtube className="w-4 h-4" /> },
  ];

  return (
    <footer className="bg-brand-green text-white">
      <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-brand-green font-display font-bold text-lg">MS</span>
              </div>
              <div>
                <p className="font-display font-bold text-lg">MS Sons Tours</p>
                <p className="text-xs text-brand-gold tracking-wider">Hajj & Umrah Travel</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Professional Hajj & Umrah travel services. Your trusted partner for sacred journeys to Makkah and Madinah.
            </p>
          </div>

          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Packages</h3>
            <ul className="space-y-2">
              <li><Link to="/packages/14" className="text-gray-300 hover:text-brand-gold text-sm transition-colors">14 Days Packages</Link></li>
              <li><Link to="/packages/21" className="text-gray-300 hover:text-brand-gold text-sm transition-colors">21 Days Packages</Link></li>
              <li><Link to="/packages" className="text-gray-300 hover:text-brand-gold text-sm transition-colors">All Packages</Link></li>
              <li><Link to="/calculator" className="text-gray-300 hover:text-brand-gold text-sm transition-colors">Price Calculator</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link to="/hotels" className="text-gray-300 hover:text-brand-gold text-sm transition-colors">Hotel Booking</Link></li>
              <li><Link to="/airlines" className="text-gray-300 hover:text-brand-gold text-sm transition-colors">Flight Assistance</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-300 hover:text-brand-gold text-sm transition-colors">About Us</Link></li>
              <li><Link to="/faq" className="text-gray-300 hover:text-brand-gold text-sm transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-sm text-gray-300">
                <Phone className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <a href={`tel:${info.phone.replace(/\s/g, "")}`} className="hover:text-brand-gold transition-colors">{info.phone}</a>
              </li>
              <li className="flex items-start space-x-3 text-sm text-gray-300">
                <Mail className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <a href={`mailto:${info.email}`} className="hover:text-brand-gold transition-colors">{info.email}</a>
              </li>
              <li className="flex items-start space-x-3 text-sm text-gray-300">
                <MapPin className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <span>{info.address}</span>
              </li>
            </ul>
            <WhatsAppLink href={`https://wa.me/${info.whatsappNumber}`} className="mt-3">WhatsApp Us</WhatsAppLink>
            <div className="mt-5">
              <p className="text-sm font-medium text-brand-gold mb-3 uppercase tracking-wider">Follow Us</p>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-9 h-9 bg-white/10 hover:bg-brand-gold rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-10 pt-6 text-center">
          <p className="text-sm text-gray-300">
            © {new Date().getFullYear()} MS Sons Tours. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
