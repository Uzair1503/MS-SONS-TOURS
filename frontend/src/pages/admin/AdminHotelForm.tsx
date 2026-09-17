import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Plus, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, hotelApi, roomTypeApi } from "@/services/api";
import ErrorState from "@/components/shared/ErrorState";

const MAX_PHOTOS = 5;
const EXT_RE = /\.[^.]+$/;
const WEBP_RE = /\.webp$/i;
const JPG_RE = /\.jpe?g$/i;

function baseName(url: string): string {
  return url.replace(EXT_RE, "").toLowerCase();
}

// Hosted gallery entries are stored as [webp, jpg, webp, jpg, ...] pairs.
// A webp plus its same-name jpg twin represents a single photo.
function photoGroups(images: string[]): string[][] {
  const groups: string[][] = [];
  for (let i = 0; i < images.length; i++) {
    const current = images[i];
    const next = images[i + 1];
    if (next && WEBP_RE.test(current) && JPG_RE.test(next) && baseName(current) === baseName(next)) {
      groups.push([current, next]);
      i++;
    } else {
      groups.push([current]);
    }
  }
  return groups;
}

const flattenGroups = (groups: string[][]) => groups.flat();

export default function AdminHotelForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existingData, isError, error, refetch } = useQuery({
    queryKey: ["admin-hotel", id],
    queryFn: async () => { const { data } = await hotelApi.getById(id!); return data; },
    enabled: isEdit,
  });

  const [form, setForm] = useState({
    name: "", city: "Makkah", location: "", distanceFromHaram: "", distanceFromMasjidNabawi: "",
    category: "STANDARD", rating: "", starRating: "", shuttleAvailable: false, description: "", active: true,
  });
  const [images, setImages] = useState<string[]>([]);
  const [roomPrices, setRoomPrices] = useState<{ roomTypeId: string; price: string; available: boolean }[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const { data: roomTypesData } = useQuery({
    queryKey: ["admin-room-types"],
    queryFn: async () => { const { data } = await roomTypeApi.getAll(); return data.data; },
  });
  const roomTypes = (roomTypesData || []).filter((rt) => rt.active);

  const cleanImages = images.filter((img) => img.trim());
  const photos = photoGroups(cleanImages);

  const readFileAsDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploadError("");
    setUploading(true);
    for (const file of files) {
      if (photos.length >= MAX_PHOTOS) {
        setUploadError(`Photo limit reached (max ${MAX_PHOTOS}).`);
        break;
      }
      try {
        const data = await readFileAsDataURL(file);
        const { data: res } = await adminApi.uploadHotelImage(file.name, data);
        setImages((prev) => [...prev, res.data.url]);
      } catch (err) {
        setUploadError((err as any)?.response?.data?.error || `Could not upload "${file.name}".`);
        break;
      }
    }
    setUploading(false);
  };

  useEffect(() => {
    if (existingData?.data) {
      const h = existingData.data;
      setForm({
        name: h.name || "", city: h.city || "Makkah", location: h.location || "",
        distanceFromHaram: h.distanceFromHaram || "", distanceFromMasjidNabawi: h.distanceFromMasjidNabawi || "",
        category: h.category || "STANDARD", rating: h.rating?.toString() || "",
        starRating: h.starRating?.toString() || "",
        shuttleAvailable: h.shuttleAvailable, description: h.description || "", active: h.active !== false,
      });
      setImages(h.images || []);
      setRoomPrices(
        (h.roomPrices || []).map((rp) => ({ roomTypeId: rp.roomTypeId, price: String(rp.price), available: rp.available }))
      );
    }
  }, [existingData]);

  useEffect(() => {
    if (roomTypes.length === 0) return;
    setRoomPrices((prev) => {
      const existing = new Map(prev.map((rp) => [rp.roomTypeId, rp]));
      const merged = roomTypes.map((rt) => existing.get(rt.id) || { roomTypeId: rt.id, price: "", available: true });
      const kept = merged.filter((rp) => rp.price !== "");
      const extras = merged.filter((rp) => rp.price === "");
      if (extras.length === 0) return kept;
      return [...kept, ...extras];
    });
  }, [roomTypes]);

  const mutation = useMutation({
    mutationFn: async (data: any) => isEdit ? adminApi.updateHotel(id!, data) : adminApi.createHotel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotels"] });
      queryClient.invalidateQueries({ queryKey: ["admin-hotel"] });
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
      queryClient.invalidateQueries({ queryKey: ["hotel"] });
      navigate("/admin/hotels");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priced = roomPrices
      .filter((rp) => rp.price !== "" && !Number.isNaN(Number(rp.price)))
      .map((rp) => ({ roomTypeId: rp.roomTypeId, price: Math.max(0, Number(rp.price)), available: rp.available }));
    mutation.mutate({
      ...form,
      rating: form.rating ? Number(form.rating) : undefined,
      starRating: form.starRating && form.starRating !== "none" ? Number(form.starRating) : undefined,
      images: flattenGroups(photoGroups(cleanImages).slice(0, MAX_PHOTOS)),
      roomPrices: priced,
    });
  };

  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url || photos.length >= MAX_PHOTOS) return;
    const pair: string[] =
      WEBP_RE.test(url) && url.startsWith("/images/hotels/")
        ? [url, url.replace(WEBP_RE, ".jpg")]
        : [url];
    setImages([...cleanImages, ...pair]);
    setNewImageUrl("");
  };

  const removePhoto = (index: number) => {
    setImages(flattenGroups(photos.filter((_, i) => i !== index)));
  };

  const movePhoto = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(flattenGroups(next));
  };

  const makeMain = (index: number) => {
    if (index === 0) return;
    const next = photos.filter((_, i) => i !== index);
    next.unshift(photos[index]);
    setImages(flattenGroups(next));
  };

  if (isError) {
    return (
      <ErrorState
        message={(error as any)?.response?.data?.error || "Failed to load hotel. Check that the backend is running."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/hotels")}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <h2 className="text-2xl font-display font-bold">{isEdit ? "Edit Hotel" : "New Hotel"}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Hotel Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="block text-sm font-medium mb-1">City *</label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Makkah">Makkah</SelectItem><SelectItem value="Madinah">Madinah</SelectItem></SelectContent>
                </Select>
              </div>
              <div><label className="block text-sm font-medium mb-1">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["BUDGET", "ECONOMY", "STANDARD", "PREMIUM", "LUXURY"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><label className="block text-sm font-medium mb-1">Location</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Distance from Haram</label><Input value={form.distanceFromHaram} onChange={(e) => setForm({ ...form, distanceFromHaram: e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Distance from Masjid Nabawi</label><Input value={form.distanceFromMasjidNabawi} onChange={(e) => setForm({ ...form, distanceFromMasjidNabawi: e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Rating</label><Input type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Star Rating</label>
                <Select value={form.starRating} onValueChange={(v) => setForm({ ...form, starRating: v })}>
                  <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} Star{n > 1 ? "s" : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={form.shuttleAvailable} onChange={(e) => setForm({ ...form, shuttleAvailable: e.target.checked })} className="w-4 h-4" />
                <label className="text-sm font-medium">Shuttle Available</label>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
                <label className="text-sm font-medium">Active (visible to customers)</label>
              </div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Room Rates (SAR per person / night)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Set the per-person, per-night price in SAR for each room type. A room type left blank is permanently removed for this hotel — it will not come back until you set a price again. Disabled (unchecked) room types are hidden from the custom package builder but keep their price.
            </p>
            {roomTypes.length === 0 ? (
              <p className="text-sm text-gray-400">Loading room types...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-4 font-medium">Room Type</th>
                      <th className="py-2 pr-4 font-medium">Price (SAR)</th>
                      <th className="py-2 font-medium">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomTypes.map((rt) => {
                      const row = roomPrices.find((rp) => rp.roomTypeId === rt.id);
                      const price = row?.price ?? "";
                      const available = row?.available ?? true;
                      return (
                        <tr key={rt.id} className="border-b last:border-0">
                          <td className="py-2.5 pr-4 font-medium text-gray-800">{rt.name}</td>
                          <td className="py-2.5 pr-4">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="e.g. 187"
                              value={price}
                              onChange={(e) => {
                                setRoomPrices((prev) => {
                                  const rest = prev.filter((rp) => rp.roomTypeId !== rt.id);
                                  return e.target.value === "" ? rest : [...rest, { roomTypeId: rt.id, price: e.target.value, available }];
                                });
                              }}
                              className="w-32"
                            />
                          </td>
                          <td className="py-2.5">
                            <input
                              type="checkbox"
                              checked={available}
                              disabled={price === ""}
                              onChange={(e) => {
                                setRoomPrices((prev) => prev.map((rp) => rp.roomTypeId === rt.id ? { ...rp, available: e.target.checked } : rp));
                              }}
                              className="w-4 h-4 accent-brand-green disabled:opacity-30"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-gray-400">
              These rates feed the customer-facing "Custom Package" builder. Changes publish immediately on save.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Hotel Gallery</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Up to 5 photos. The first photo is the main/exterior thumbnail shown on hotel cards. Hover a photo to move it, make it main, or remove it.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {photos.map((photo, i) => (
                <div key={photo[0] + i} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-[4/3]">
                  <img
                    src={photo[0]}
                    alt={`${form.name} photo ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      if (!e.currentTarget.src.endsWith("placeholder-hotel.svg")) {
                        e.currentTarget.src = "/images/hotels/placeholder-hotel.svg";
                      }
                    }}
                  />
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {i === 0 ? "Main" : `Photo ${i + 1}`}
                  </span>
                  <div className="absolute top-1 right-1 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => makeMain(i)}
                      disabled={i === 0}
                      title={i === 0 ? "Main photo" : "Set as main photo"}
                      className="bg-black/50 hover:bg-brand-green text-white rounded-full p-1.5 transition-colors disabled:opacity-30 disabled:cursor-default"
                      aria-label={`Set photo ${i + 1} as main`}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      title="Remove photo"
                      className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition-colors"
                      aria-label={`Remove photo ${i + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 pb-1">
                    <button
                      type="button"
                      onClick={() => movePhoto(i, -1)}
                      disabled={i === 0}
                      title="Move earlier"
                      className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors disabled:opacity-30 disabled:cursor-default"
                      aria-label={`Move photo ${i + 1} earlier`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePhoto(i, 1)}
                      disabled={i === photos.length - 1}
                      title="Move later"
                      className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors disabled:opacity-30 disabled:cursor-default"
                      aria-label={`Move photo ${i + 1} later`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {photos.length === 0 && <p className="text-sm text-gray-400 col-span-full">No photos yet.</p>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-dashed border-gray-300 hover:border-brand-green/50 hover:bg-brand-green/5 cursor-pointer transition-colors text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-default">
                <Upload className="w-4 h-4 text-brand-green" />
                {uploading ? "Saving photo..." : "Upload from computer"}
                <input
                  type="file"
                  accept="image/webp,image/jpeg,image/png"
                  multiple
                  className="hidden"
                  disabled={uploading || photos.length >= MAX_PHOTOS}
                  onChange={handleFileUpload}
                />
              </label>
              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            </div>
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Image URL or path"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addImage} disabled={photos.length >= MAX_PHOTOS || !newImageUrl.trim()}>
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Upload photos from your computer (webp, jpg, png, up to 5MB each) or paste an image URL/path. Up to 5 photos total. The first photo is the primary thumbnail (hotel cards, package details, calculator). Photos after that appear in the hotel gallery.
            </p>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-4">
          {mutation.isError && (
            <p className="text-sm text-red-600 self-center">
              {(mutation.error as any)?.response?.data?.error || "Save failed. Check the backend and try again."}
            </p>
          )}
          <Button type="button" variant="outline" onClick={() => navigate("/admin/hotels")}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : isEdit ? "Update Hotel" : "Create Hotel"}</Button>
        </div>
      </form>
    </div>
  );
}
