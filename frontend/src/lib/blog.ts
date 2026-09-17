// Blog post shape mirrors what a backend BlogPost model would return later
// (slug, title, excerpt, content paragraphs, publishedAt, author, image,
// category, readingMinutes). Swap blogPosts for an API call when ready -
// the pages and Article JSON-LD already consume this interface.

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  datePublished: string;
  author: string;
  image: string;
  category: string;
  readingMinutes: number;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "umrah-packing-checklist",
    title: "The Complete Umrah Packing Checklist",
    excerpt:
      "A practical packing list for Umrah - ihram essentials, documents, medication, and personal items you should not forget for Makkah and Madinah.",
    content: [
      "Packing for Umrah is about traveling light while making sure nothing essential is left behind. Start with your documents: passport with a valid Umrah visa, printed booking confirmations, a copy of your vaccination card, and a small pouch for cash and cards.",
      "For Ihram, men need two plain white towels and a belt or safety pins. Women can wear any loose, modest clothing. Bring a pair of comfortable sandals you can walk in for long hours between the Haram and your hotel.",
      "Medications, personal toiletries (unscented for ihram), prayers beads, a small pocket Quran, and a refillable water bottle complete the basics. Pack light - you will spend most of your time in prayer, and transporting heavy bags between cities is unnecessary.",
      "Always keep a small day-bag with your passport, hotel card and prayer essentials for the days you spend at Masjid al-Haram and Masjid an-Nabawi.",
    ],
    datePublished: "2025-01-10",
    author: "MS Sons Tours Team",
    image: "/images/hero/masjid-nabawi.jpg",
    category: "Guides",
    readingMinutes: 6,
  },
  {
    slug: "best-time-to-perform-umrah",
    title: "Best Time to Perform Umrah",
    excerpt:
      "Umrah can be done all year round, but the ideal time depends on weather, crowds, and budget. Compare seasons to plan your journey wisely.",
    content: [
      "Umrah is valid throughout the year, so the 'best' time depends on what you value most - cheaper rates, milder weather, or smaller crowds in the Haram.",
      "The months of Ramadan are the most rewarding spiritually, with the highest rewards for worship, but also the busiest and most expensive. Packages during the last ten days of Ramadan book out months in advance.",
      "The cooler months from October to March offer comfortable temperatures for long tawaf and sa'i, with moderate crowd levels. This is generally the most popular window for families traveling from Pakistan.",
      "Summer months (June to September) are quieter with lower package prices, but expect very high temperatures during the day. Many travelers plan their worship around early morning and late night hours in this season.",
      "For a balance of weather, crowds and cost, November to February is a strong choice. Whichever season you pick, confirm your package early since airlines and hotels near both Harams fill quickly.",
    ],
    datePublished: "2025-02-06",
    author: "MS Sons Tours Team",
    image: "/images/hero/masjid-nabawi.jpg",
    category: "Planning",
    readingMinutes: 7,
  },
  {
    slug: "how-to-choose-umrah-hotel",
    title: "How to Choose a Hotel Close to the Haram",
    excerpt:
      "Hotels near Masjid al-Haram in Makkah and Masjid an-Nabawi in Madinah vary in price, distance and facilities. A simple method to pick the right one.",
    content: [
      "Your hotel choice often shapes your entire Umrah experience. Being close to the Haram means more time in prayer and less time commuting, especially useful for elderly travelers and families with children.",
      "In Makkah, hotels within a few hundred meters of Masjid al-Haram command a premium but save you from long walks in the heat. If you are traveling on a tighter budget, a free-shuttle hotel further away can still be comfortable.",
      "In Madinah, staying near Masjid an-Nabawi is equally valuable. Many packages include the distance from the Haram in the hotel details - compare these figures, not just the star rating.",
      "Check what is actually included: breakfast, private or shared bathroom, air conditioning, and shuttle service. Two hotels with the same rating can offer very different comfort levels in practice.",
      "Our 14 and 21 day packages include hotels in both cities, and you can compare distances and room prices using the price calculator before booking.",
    ],
    datePublished: "2025-03-15",
    author: "MS Sons Tours Team",
    image: "/images/hero/masjid-nabawi.jpg",
    category: "Hotels",
    readingMinutes: 5,
  },
  {
    slug: "umrah-visa-and-document-guide",
    title: "Umrah Visa & Document Checklist for Pakistani Travelers",
    excerpt:
      "Everything you need to prepare your Umrah visa and travel documents - passports, photos, vaccination requirements, and how your agency handles the process.",
    content: [
      "An Umrah visa from Pakistan requires a valid passport with at least six months validity and the required number of blank pages. Recent passport-size photographs and a completed visa application are the usual base documents.",
      "Meningitis vaccination and, depending on the season, other Saudi health requirements may apply. Keep your vaccination certificate with your travel documents, as it is checked on arrival.",
      "Most travelers choose to book through a travel agency because the visa is processed in Saudi Arabia and agencies manage the application on your behalf. MS Sons Tours packages include visa processing, so you receive clear instructions on exactly which original documents to provide.",
      "Make two photocopies of your passport and visa - keep one set in your checked luggage and one with your day-bag in case of loss. Also note your hotel details and emergency contacts before departure.",
      "Finally, confirm your documents against the checklist a week before travel: passport, visa, booking confirmation, vaccination card, cash and cards, and any regular medication with a doctor's note.",
    ],
    datePublished: "2025-04-20",
    author: "MS Sons Tours Team",
    image: "/images/hero/masjid-nabawi.jpg",
    category: "Visa",
    readingMinutes: 6,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function formatBlogDate(date: string): string {
  return new Date(date + (date.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
    "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  );
}