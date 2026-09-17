import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { AuthProvider } from "@/context/AuthContext";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const HomePage = lazy(() => import("@/pages/HomePage"));
const PackagesPage = lazy(() => import("@/pages/PackagesPage"));
const PackageDetailPage = lazy(() => import("@/pages/PackageDetailPage"));
const HotelsPage = lazy(() => import("@/pages/HotelsPage"));
const HotelDetailPage = lazy(() => import("@/pages/HotelDetailPage"));
const AirlinesPage = lazy(() => import("@/pages/AirlinesPage"));
const CalculatorPage = lazy(() => import("@/pages/CalculatorPage"));
const CustomPackagePage = lazy(() => import("@/pages/CustomPackagePage"));
const BookingPage = lazy(() => import("@/pages/BookingPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const FAQPage = lazy(() => import("@/pages/FAQPage"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminPackages = lazy(() => import("@/pages/admin/AdminPackages"));
const AdminPackageForm = lazy(() => import("@/pages/admin/AdminPackageForm"));
const AdminHotels = lazy(() => import("@/pages/admin/AdminHotels"));
const AdminHotelForm = lazy(() => import("@/pages/admin/AdminHotelForm"));
const AdminAirlines = lazy(() => import("@/pages/admin/AdminAirlines"));
const AdminAirlineForm = lazy(() => import("@/pages/admin/AdminAirlineForm"));
const AdminRoomTypes = lazy(() => import("@/pages/admin/AdminRoomTypes"));
const AdminInquiries = lazy(() => import("@/pages/admin/AdminInquiries"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminFlights = lazy(() => import("@/pages/admin/AdminFlights"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminAuditLogs = lazy(() => import("@/pages/admin/AdminAuditLogs"));
const AdminRates = lazy(() => import("@/pages/admin/AdminRates"));
const AdminReviews = lazy(() => import("@/pages/admin/AdminReviews"));

function Loader() {
  return <PageSkeleton />;
}

export default function App() {
  return (
<AuthProvider>
      <MotionConfig reducedMotion="user">
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/packages" element={<Layout><PackagesPage /></Layout>} />
            <Route path="/packages/:duration" element={<Layout><PackagesPage /></Layout>} />
            <Route path="/package/:id" element={<Layout><PackageDetailPage /></Layout>} />
            <Route path="/hotels" element={<Layout><HotelsPage /></Layout>} />
            <Route path="/hotels/:id" element={<Layout><HotelDetailPage /></Layout>} />
            <Route path="/airlines" element={<Layout><AirlinesPage /></Layout>} />
            <Route path="/calculator" element={<Layout><CalculatorPage /></Layout>} />
            <Route path="/custom-package" element={<Layout><CustomPackagePage /></Layout>} />
            <Route path="/booking" element={<Layout><BookingPage /></Layout>} />
            <Route path="/about" element={<Layout><AboutPage /></Layout>} />
            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
            <Route path="/faq" element={<Layout><FAQPage /></Layout>} />
            <Route path="/blog" element={<Layout><BlogPage /></Layout>} />
            <Route path="/blog/:slug" element={<Layout><BlogPostPage /></Layout>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="packages/new" element={<AdminPackageForm />} />
              <Route path="packages/:id/edit" element={<AdminPackageForm />} />
              <Route path="hotels" element={<AdminHotels />} />
              <Route path="hotels/new" element={<AdminHotelForm />} />
              <Route path="hotels/:id/edit" element={<AdminHotelForm />} />
              <Route path="airlines" element={<AdminAirlines />} />
              <Route path="airlines/new" element={<AdminAirlineForm />} />
              <Route path="airlines/:id/edit" element={<AdminAirlineForm />} />
              <Route path="room-types" element={<AdminRoomTypes />} />
              <Route path="inquiries" element={<AdminInquiries />} />
              <Route path="flights" element={<AdminFlights />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="rates" element={<AdminRates />} />
              <Route path="reviews" element={<AdminReviews />} />
            </Route>
            <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
          </Routes>
        </Suspense>
      </MotionConfig>
    </AuthProvider>
  );
}
