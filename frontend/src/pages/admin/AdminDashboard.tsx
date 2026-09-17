import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Package, Bed, Plane, Users, MessageCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/services/api";
import { getStatusColor } from "@/lib/utils";
import ErrorState from "@/components/shared/ErrorState";

export default function AdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const { data } = await adminApi.getDashboard();
      return data;
    },
  });

  if (isError) {
    return <ErrorState message={(error as any)?.response?.data?.error || "Failed to load dashboard."} onRetry={() => refetch()} />;
  }

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}
  </div>;

  const stats = data?.data;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Packages", value: stats?.packages.total || 0, icon: Package, color: "bg-blue-500", link: "/admin/packages" },
          { label: "Active Packages", value: stats?.packages.active || 0, icon: TrendingUp, color: "bg-green-500", link: "/admin/packages" },
          { label: "14 Day Packages", value: stats?.packages.days14 || 0, icon: Package, color: "bg-brand-gold", link: "/admin/packages" },
          { label: "21 Day Packages", value: stats?.packages.days21 || 0, icon: Package, color: "bg-purple-500", link: "/admin/packages" },
          { label: "Hotels", value: stats?.hotels.total || 0, icon: Bed, color: "bg-pink-500", link: "/admin/hotels" },
          { label: "Airlines", value: stats?.airlines.total || 0, icon: Plane, color: "bg-indigo-500", link: "/admin/airlines" },
          { label: "Room Types", value: stats?.roomTypes.total || 0, icon: Users, color: "bg-teal-500", link: "/admin/room-types" },
          { label: "New Inquiries", value: stats?.inquiries.newCount || 0, icon: MessageCircle, color: "bg-red-500", link: "/admin/inquiries" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.link}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Recent Inquiries</CardTitle></CardHeader>
          <CardContent>
            {stats?.recentInquiries?.length === 0 ? (
              <p className="text-gray-500 text-sm">No inquiries yet.</p>
            ) : (
              <div className="space-y-3">
                {stats?.recentInquiries?.map((inquiry: any) => (
                  <div key={inquiry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{inquiry.fullName}</p>
                      <p className="text-xs text-gray-500">{inquiry.referenceNumber}</p>
                    </div>
                    <Badge className={getStatusColor(inquiry.status)}>{inquiry.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/packages/new" className="block p-3 bg-brand-green/5 rounded-lg hover:bg-brand-green/10 transition-colors">
              <p className="font-medium text-brand-green">+ Add New Package</p>
              <p className="text-xs text-gray-500">Create a new Umrah package</p>
            </Link>
            <Link to="/admin/hotels/new" className="block p-3 bg-brand-gold/5 rounded-lg hover:bg-brand-gold/10 transition-colors">
              <p className="font-medium text-brand-gold-dark">+ Add New Hotel</p>
              <p className="text-xs text-gray-500">Add a hotel to the system</p>
            </Link>
            <Link to="/admin/inquiries" className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <p className="font-medium text-blue-600">View Inquiries</p>
              <p className="text-xs text-gray-500">Manage customer inquiries</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
