import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumbs({
  items,
  tone = "dark",
}: {
  items: Crumb[];
  tone?: "dark" | "light";
}) {
  const link = tone === "light" ? "text-white/70 hover:text-white" : "text-gray-500 hover:text-brand-green dark:text-gray-400 dark:hover:text-brand-gold";
  const chevron = tone === "light" ? "text-white/40" : "text-gray-400 dark:text-gray-600";
  const current = tone === "light" ? "text-white/90" : "text-gray-900 dark:text-gray-100";

  return (
    <nav aria-label="Breadcrumb" className={`mb-3 text-sm ${tone === "light" ? "justify-center" : ""}`}>
      <ol className={`inline-flex flex-wrap items-center gap-1 ${tone === "light" ? "justify-center" : ""}`}>
        <li>
          <Link to="/" className={`inline-flex items-center hover:opacity-80 ${link}`} aria-label="Home">
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className={`w-3.5 h-3.5 ${chevron}`} />
            {item.to ? (
              <Link to={item.to} className={link}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={current}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}