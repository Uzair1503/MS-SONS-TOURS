import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SeoHead from "@/components/shared/Seo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Send, CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePackages } from "@/hooks/usePackages";
import { useSettings } from "@/hooks/useSettings";
import { inquiryApi } from "@/services/api";
import type { Package } from "@/types";

const schema = z.object({
  fullName: z.string().min(2, "Name is required"),
  whatsappNumber: z.string().min(10, "Valid WhatsApp number is required"),
  email: z.string().email().optional().or(z.literal("")),
  adults: z.number().min(1).max(50),
  children: z.number().min(0).max(20),
  infants: z.number().min(0).max(10),
  packageId: z.string().optional(),
  departureDate: z.string().optional(),
  specialRequirements: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function packageLabel(pkg: Package): string {
  const base = `${pkg.title} - ${pkg.durationDays} days`;
  const details: string[] = [];
  if (pkg.makkahHotel?.hotel?.name) details.push(`Makkah: ${pkg.makkahHotel.hotel.name}`);
  if (pkg.madinahHotel?.hotel?.name) details.push(`Madinah: ${pkg.madinahHotel.hotel.name}`);
  return details.length > 0 ? `${base} | ${details.join(", ")}` : base;
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const preselectedPackage = searchParams.get("packageId") || "";
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const { data: packagesData } = usePackages({ status: "ACTIVE", limit: "100" });
  const { data: settings } = useSettings();
  const whatsappNumber = settings?.whatsapp_number || "923713011519";

  const packages = packagesData?.data || [];

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      adults: 1,
      children: 0,
      infants: 0,
      packageId: preselectedPackage,
    },
  });

  useEffect(() => {
    if (!packagesData) return;
    if (preselectedPackage && !packages.some((pkg) => pkg.id === preselectedPackage)) {
      setValue("packageId", "");
    }
  }, [packagesData, preselectedPackage, packages, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        email: data.email || undefined,
        specialRequirements: data.specialRequirements || undefined,
        message: data.message || undefined,
        departureDate: data.departureDate || undefined,
      };
      const { data: result } = await inquiryApi.create(payload);
      if (result.success) {
        setReferenceNumber(result.data.referenceNumber);
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Inquiry submission failed", err);
    }
  };

  if (submitted) {
    return (
      <>
        <SeoHead
          title="Booking Inquiry Submitted"
          description="Your Umrah booking inquiry was submitted successfully to MS Sons Tours. Our team will contact you on WhatsApp."
          path="/booking"
        />
        <section className="section-padding bg-brand-cream dark:bg-gray-950">
          <div className="container-custom mx-auto max-w-lg text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 dark:bg-green-900/40">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-3xl font-display font-bold text-gray-900 mb-4 dark:text-gray-100">Inquiry Submitted!</h1>
              <p className="text-gray-600 mb-2 dark:text-gray-400">Your reference number is:</p>
              <p className="text-2xl font-bold text-brand-green mb-6">{referenceNumber}</p>
              <p className="text-gray-600 mb-8 dark:text-gray-400">Our team will contact you shortly on WhatsApp to finalize your booking.</p>
              <Button asChild>
                <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Assalam o Alaikum, I just submitted an inquiry with reference number ${referenceNumber}.`)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" /> Follow up on WhatsApp
                </a>
              </Button>
            </motion.div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SeoHead
        title="Book / Inquire | Umrah Packages"
        description="Submit an inquiry for Hajj & Umrah travel packages from Pakistan. Our team will contact you with booking details and confirmation."
        path="/booking"
      />

      <section className="bg-brand-green py-12 md:py-16">
        <div className="container-custom mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Book / Inquire</h1>
          <p className="text-white/70 mt-3">Submit your inquiry and our team will contact you</p>
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Full Name *</label>
                  <Input {...register("fullName")} placeholder="Enter your full name" />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">WhatsApp Number *</label>
                    <Input {...register("whatsappNumber")} placeholder="+92 3XX XXXXXXX" />
                    {errors.whatsappNumber && <p className="text-red-500 text-xs mt-1">{errors.whatsappNumber.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Email</label>
                    <Input {...register("email")} type="email" placeholder="your@email.com" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Adults</label>
                    <Input type="number" {...register("adults", { valueAsNumber: true })} min={1} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Children</label>
                    <Input type="number" {...register("children", { valueAsNumber: true })} min={0} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Infants</label>
                    <Input type="number" {...register("infants", { valueAsNumber: true })} min={0} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Package</label>
                  <Select value={watch("packageId") || ""} onValueChange={(v) => setValue("packageId", v)}>
                    <SelectTrigger className="h-auto min-h-[2.5rem] py-2.5"><SelectValue placeholder="Select a package (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific package</SelectItem>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>{packageLabel(pkg)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Preferred Departure Date</label>
                  <Input type="date" {...register("departureDate")} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Special Requirements</label>
                  <Textarea {...register("specialRequirements")} placeholder="Any special requirements or preferences..." rows={3} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Message</label>
                  <Textarea {...register("message")} placeholder="Additional message..." rows={3} />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Inquiry"}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
