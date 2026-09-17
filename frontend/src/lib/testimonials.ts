import type { Review } from "@/types";

// MOCK/PLACEHOLDER TESTIMONIAL DATA
// These are sample testimonials used only to keep the homepage testimonials
// section populated until real visitor submissions (Review model / HomePage
// useReviews hook) accumulate. They are structured the same way a backend
// Review model returns them (id, name, rating, text, date, location).
//
// Once real reviews are plentiful, remove this padding section in HomePage
// ("displayedReviews (...) pad the grid ...") and delete this file if unused.
// Do NOT let these placeholder reviews be mistaken for genuine customer data.

export const sampleReviews: Review[] = [
  {
    id: "r1",
    name: "Muhammad Ahmed",
    rating: 5,
    text: "Alhamdulillah an excellent 14-day Umrah package. The hotel in Makkah was very close to the Haram and the team was available on WhatsApp the whole journey.",
    date: "2025-02-18",
    location: "Lahore",
  },
  {
    id: "r2",
    name: "Ayesha Khan",
    rating: 5,
    text: "Everything was arranged exactly as mentioned - visa, flights, hotels and transport. Very professional and caring staff, especially for first time Umrah travelers.",
    date: "2025-03-02",
    location: "Karachi",
  },
  {
    id: "r3",
    name: "Abdullah Siddiqui",
    rating: 5,
    text: "We traveled as a family of six on the 21-day package. Hotel in Madinah was a short walk from Masjid an-Nabawi. Highly recommended for value and service.",
    date: "2025-04-11",
    location: "Islamabad",
  },
  {
    id: "r4",
    name: "Fatima Noor",
    rating: 5,
    text: "Booking was simple and the estimated price matched exactly what we paid. The ground staff supported us with ziyarat arrangements too. May Allah reward them.",
    date: "2025-05-23",
    location: "Multan",
  },
  {
    id: "r5",
    name: "Bilal Hussain",
    rating: 4,
    text: "Good value package with a comfortable hotel near the Haram. Minor delay in flight confirmation but overall the experience was smooth and well organized.",
    date: "2025-06-08",
    location: "Rawalpindi",
  },
  {
    id: "r6",
    name: "Zainab Raza",
    rating: 5,
    text: "Our parents performed Umrah with MS Sons Tours and the team treated them like family. Daily updates and excellent hotel choices near both Harams.",
    date: "2025-07-14",
    location: "Faisalabad",
  },
];