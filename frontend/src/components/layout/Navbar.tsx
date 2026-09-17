import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Calculator, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/context/ThemeContext";
import WhatsAppLink from "@/components/shared/WhatsAppLink";

const topLevelLinks = [
  { name: "Hotels", path: "/hotels" },
  { name: "Airlines", path: "/airlines" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

const packageLinks = [
  { name: "14 Days", path: "/packages/14" },
  { name: "21 Days", path: "/packages/21" },
  { name: "Custom Package", path: "/custom-package" },
];

function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className="relative w-14 h-9 shrink-0 rounded-full border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 hover:scale-105 hover:shadow-md hover:shadow-brand-gold/30 bg-gray-200 border-gray-300 dark:bg-gray-800 dark:border-gray-600"
    >
      <span
        className={`absolute left-1 top-1 flex w-7 h-7 items-center justify-center rounded-full bg-brand-gold text-white shadow-md transition-all duration-300 ${
          isDark ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </span>
    </button>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [packagesOpen, setPackagesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { data: settings } = useSettings();
  const whatsappNumber = settings?.whatsapp_number || "923713011519";

  const packagesActive = packageLinks.some((link) => location.pathname === link.path);
  const calculatorActive = location.pathname === "/calculator";

  const isActiveLink = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname === path || location.pathname.startsWith(`${path}/`);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setPackagesOpen(false);
  }, [location]);

  const linkClass = (active: boolean) =>
    `px-3 py-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-brand-green text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-brand-green dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-brand-gold"
    }`;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-lg border-b border-brand-gold/30 dark:bg-gray-950/90"
          : "bg-white shadow-sm border-b border-transparent dark:bg-gray-950"
      }`}
    >
      <div className="container-custom mx-auto">
        <div className="flex items-center justify-between h-16 md:h-20 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-green rounded-lg flex items-center justify-center">
              <span className="text-brand-gold font-display font-bold text-lg md:text-xl">MS</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-display font-bold text-brand-green text-lg leading-tight">MS Sons Tours</p>
              <p className="text-[10px] text-gray-500 tracking-wider dark:text-gray-400">Hajj & Umrah Travel</p>
            </div>
          </Link>

          <div className="hidden xl:flex items-center space-x-2">
            <Link to="/" className={linkClass(isActiveLink("/"))}>
              Home
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 px-3 py-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors ${
                    packagesActive
                      ? "bg-brand-green text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-brand-green dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-brand-gold"
                  }`}
                >
                  Packages
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[11rem]">
                {packageLinks.map((link) => (
                  <DropdownMenuItem key={link.path} asChild>
                    <Link
                      to={link.path}
                      className={
                        location.pathname === link.path
                          ? "text-brand-green font-semibold dark:text-brand-gold"
                          : ""
                      }
                    >
                      {link.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {topLevelLinks.map((link) => (
              <Link key={link.path} to={link.path} className={linkClass(isActiveLink(link.path))}>
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden xl:flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className={`border-brand-green/50 text-brand-green/80 hover:bg-brand-green hover:border-brand-green hover:text-white dark:border-brand-gold/50 dark:text-brand-gold/80 ${calculatorActive ? "ring-2 ring-brand-green-dark ring-offset-2" : ""}`}>
              <Link to="/calculator" aria-current={calculatorActive ? "page" : undefined}>
                <Calculator className="w-4 h-4 mr-2" />
                Price Calculator
              </Link>
            </Button>
            <WhatsAppLink href={`https://wa.me/${whatsappNumber}`} size="sm">WhatsApp</WhatsAppLink>
            <ThemeSwitch />
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="xl:hidden p-2 rounded-lg hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden border-t bg-white dark:bg-gray-950 dark:border-white/10"
          >
            <div className="container-custom mx-auto px-4 py-4 space-y-1">
              <Link
                to="/"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActiveLink("/")
                    ? "bg-brand-green text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                Home
              </Link>
              <button
                type="button"
                onClick={() => setPackagesOpen(!packagesOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  packagesActive && !packagesOpen
                    ? "bg-brand-green text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                Packages
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${packagesOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {packagesOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 pb-1 space-y-1">
                      {packageLinks.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            location.pathname === link.path
                              ? "bg-brand-green/10 text-brand-green dark:text-brand-gold"
                              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          }`}
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {topLevelLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActiveLink(link.path)
                      ? "bg-brand-green text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex space-x-3 pt-2">
                <Button variant="outline" size="sm" className={`flex-1 ${calculatorActive ? "ring-2 ring-brand-green-dark" : ""}`} asChild>
                  <Link to="/calculator" aria-current={calculatorActive ? "page" : undefined}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculator
                  </Link>
                </Button>
                <WhatsAppLink href={`https://wa.me/${whatsappNumber}`} size="sm" className="flex-1">WhatsApp</WhatsAppLink>
                <ThemeSwitch />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}