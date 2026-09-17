import { MessageCircle } from "lucide-react";

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3 text-base",
};

interface WhatsAppLinkProps {
  href: string;
  size?: keyof typeof sizeClasses;
  className?: string;
  children?: React.ReactNode;
}

export default function WhatsAppLink({ href, size = "md", className = "", children }: WhatsAppLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors ${sizeClasses[size]} ${className}`}
    >
      <MessageCircle className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
      {children ?? "WhatsApp"}
    </a>
  );
}