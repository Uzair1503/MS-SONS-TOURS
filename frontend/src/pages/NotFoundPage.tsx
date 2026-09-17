import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SeoHead from "@/components/shared/Seo";

export default function NotFoundPage() {
  return (
    <>
      <SeoHead
        title="Page Not Found"
        description="The page you are looking for does not exist. Browse Hajj & Umrah packages from Pakistan with MS Sons Tours."
        path={window.location.pathname}
        noindex
      />
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-display font-bold text-brand-green mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-6 dark:text-gray-400">Page not found</p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
