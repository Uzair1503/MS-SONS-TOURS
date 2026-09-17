import { useState } from "react";
import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Bed, Plane, Users, MessageCircle,
  Settings, LogOut, Menu, X, CalendarDays, ShieldCheck, History, BadgeDollarSign, Star
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const sidebarLinks = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "Packages", path: "/admin/packages", icon: Package },
  { name: "Hotels", path: "/admin/hotels", icon: Bed },
  { name: "Airlines", path: "/admin/airlines", icon: Plane },
  { name: "Room Types", path: "/admin/room-types", icon: Users },
  { name: "Inquiries", path: "/admin/inquiries", icon: MessageCircle },
  { name: "Flight Schedules", path: "/admin/flights", icon: CalendarDays },
  { name: "Staff & Admins", path: "/admin/users", icon: ShieldCheck },
  { name: "Audit Logs", path: "/admin/audit-logs", icon: History },
  { name: "Umrah Rates", path: "/admin/rates", icon: BadgeDollarSign },
  { name: "Reviews", path: "/admin/reviews", icon: Star },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full" /></div>;
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-green transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/20">
          <Link to="/admin" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-brand-green font-display font-bold text-sm">MS</span>
            </div>
            <span className="text-white font-display font-semibold">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto mt-4 px-3 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== "/admin" && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-white text-brand-green font-medium" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="text-white text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-white/50 text-xs">{user.role}</p>
            </div>
            <button onClick={logout} className="text-white/70 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white shadow-sm h-16 flex items-center px-4 lg:px-8 sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {sidebarLinks.find((l) => l.path === location.pathname)?.name || "Admin"}
          </h1>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
