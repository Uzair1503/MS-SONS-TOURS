import { useState, useRef } from "react";
import { Star, X, PenLine, Loader2, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/shared/ScrollReveal";
import type { Review } from "@/types";
import { sampleReviews } from "@/lib/testimonials";
import { reviewApi } from "@/services/api";

interface TestimonialsProps {
  reviews?: Review[];
  title?: string;
  subtitle?: string;
  onReviewAdded?: () => void;
}

function Stars({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (rating: number) => void }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        interactive ? (
          <button
            key={star}
            type="button"
            aria-label={`${star} star(s)`}
            onClick={() => onChange?.(star)}
            className="p-0.5 focus:outline-none"
          >
            <Star className={`w-6 h-6 transition-colors ${star <= rating ? "text-brand-gold fill-brand-gold" : "text-gray-300 hover:text-brand-gold/50"}`} />
          </button>
        ) : (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "text-brand-gold fill-brand-gold" : "text-gray-300"}`}
          />
        )
      ))}
    </div>
  );
}

export default function Testimonials({
  reviews = sampleReviews,
  title = "What Our Travelers Say",
  subtitle = "Real experiences from pilgrims who traveled with MS Sons Tours",
  onReviewAdded,
}: TestimonialsProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [thankYou, setThankYou] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", city: "", rating: 5, comment: "" });
  const [imageData, setImageData] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const readFileAsDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Image must be 3MB or smaller.");
      return;
    }
    setError("");
    try {
      const dataUrl = await readFileAsDataURL(file);
      setImageData(dataUrl);
      setImageName(file.name);
      setPreviewUrl(dataUrl);
    } catch {
      setError("Could not read the selected file.");
    }
  };

  const resetForm = () => {
    setForm({ name: "", city: "", rating: 5, comment: "" });
    setImageData("");
    setImageName("");
    setPreviewUrl("");
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) return setError("Please enter your name.");
    if (!form.comment.trim()) return setError("Please enter your experience.");
    setSubmitting(true);
    try {
      await reviewApi.create({
        name: form.name.trim(),
        city: form.city.trim() || undefined,
        rating: form.rating,
        comment: form.comment.trim(),
        ...(imageData ? { image: { name: imageName, data: imageData } } : {}),
      });
      resetForm();
      setShowForm(false);
      setThankYou(true);
      onReviewAdded?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-padding bg-brand-cream dark:bg-gray-950">
      <div className="container-custom mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            {subtitle && <p className="text-gray-600 mt-3 dark:text-gray-400">{subtitle}</p>}
            <Button className="mt-6" onClick={() => { setShowForm((v) => !v); setError(""); }}>
              <PenLine className="w-4 h-4 mr-2" /> {showForm ? "Close Form" : "Share Your Experience"}
            </Button>
          </div>
        </ScrollReveal>

        {showForm && (
          <ScrollReveal>
            <Card className="max-w-2xl mx-auto mb-12">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold dark:text-gray-100">Share Your Experience</h3>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" aria-label="Close form">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-200">Your Name *</label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Muhammad Ahmed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-200">City (optional)</label>
                      <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Lahore" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">Your Rating</label>
                    <Stars rating={form.rating} interactive onChange={(rating) => setForm({ ...form, rating })} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">Your Experience *</label>
                    <Textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={4} placeholder="Tell us about your journey with MS Sons Tours..." />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">Photo (optional, JPG/PNG/WebP, max 3MB)</label>
                    {previewUrl ? (
                      <div className="flex items-center gap-3">
                        <img src={previewUrl} alt="Review preview" className="w-16 h-16 object-cover rounded-lg" />
                        <Button size="sm" variant="outline" onClick={() => { setPreviewUrl(""); setImageData(""); setImageName(""); }}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFile}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-green file:text-white hover:file:bg-brand-green/90 dark:text-gray-400 dark:file:bg-brand-green"
                      />
                    )}
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); setError(""); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      {submitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {thankYou && (
          <ScrollReveal>
            <Card className="max-w-xl mx-auto mb-12 bg-brand-green border-brand-green">
              <CardContent className="p-6 text-center text-white">
                <h3 className="text-lg font-semibold mb-1">Shukran! Jazakallahu Khair</h3>
                <p className="text-sm text-white/85">Your review has been submitted and will appear in this section shortly.</p>
                <Button className="mt-4 bg-white text-brand-green hover:bg-brand-cream" onClick={() => setThankYou(false)}>
                  Continue Browsing
                </Button>
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <ScrollReveal key={review.id} delay={i * 0.1} className="h-full">
              <Card className="h-full flex flex-col card-hover">
                <CardContent className="p-6 flex flex-col flex-1">
                  <Stars rating={review.rating} />
                  {review.imageUrl && (
                    <div className="mt-3">
                      <img
                        src={review.imageUrl}
                        alt={`Photo from ${review.name}`}
                        className="w-full h-40 object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <p className="text-gray-600 text-sm leading-relaxed mt-4 dark:text-gray-400">"{review.text}"</p>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{review.name}</p>
                    {review.location && <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">{review.location}</p>}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}