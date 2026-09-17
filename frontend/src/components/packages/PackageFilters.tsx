import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAirlines } from "@/hooks/useAirlines";
import { useRoomTypes } from "@/hooks/useRoomTypes";

interface FilterValues {
  search: string;
  airlineId: string;
  hotelId: string;
  roomTypeId: string;
  minPrice: string;
  maxPrice: string;
}

interface PackageFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  durationDays?: number;
}

export default function PackageFilters({ filters, onFilterChange, durationDays }: PackageFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { data: airlines } = useAirlines();
  const { data: roomTypes } = useRoomTypes();

  const updateFilter = (key: keyof FilterValues, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ search: "", airlineId: "", hotelId: "", roomTypeId: "", minPrice: "", maxPrice: "" });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search packages..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-6 bg-brand-green/10 dark:bg-brand-green/20 ${
            showFilters ? "bg-brand-green text-white dark:bg-brand-green dark:text-white" : ""
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-900 dark:border dark:border-white/10">
          <Select value={filters.airlineId} onValueChange={(v) => updateFilter("airlineId", v)}>
            <SelectTrigger><SelectValue placeholder="All Airlines" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Airlines</SelectItem>
              {airlines?.data?.map((a: any) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.roomTypeId} onValueChange={(v) => updateFilter("roomTypeId", v)}>
            <SelectTrigger><SelectValue placeholder="All Room Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Room Types</SelectItem>
              {roomTypes?.data?.map((rt: any) => (
                <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Min Price (PKR)"
            value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
          />

          <Input
            type="number"
            placeholder="Max Price (PKR)"
            value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
