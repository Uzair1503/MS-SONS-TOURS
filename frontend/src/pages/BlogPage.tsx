import { Link } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import SeoHead from "@/components/shared/Seo";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ScrollReveal from "@/components/shared/ScrollReveal";
import { blogPosts, formatBlogDate } from "@/lib/blog";

export default function BlogPage() {
  return (
    <>
      <SeoHead
        title="Umrah Travel Blog | MS Sons Tours"
        description="Umrah travel guides, packing checklists, hotel tips and visa guidance for pilgrims from Pakistan - written by MS Sons Tours."
        path="/blog"
      />

      <section className="bg-brand-green py-12 md:py-16">
        <div className="container-custom mx-auto px-4 text-center">
          <Badge variant="secondary" className="bg-brand-gold text-white mb-3">Travel Blog</Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Umrah Travel Guides</h1>
          <p className="text-white/70 mt-3">Tips and guidance for a smooth and blessed journey</p>
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto">
          <Breadcrumbs
            items={[{ label: "Home", to: "/" }, { label: "Blog" }]}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogPosts.map((post, i) => (
              <ScrollReveal key={post.slug} delay={i * 0.1}>
                <Link to={`/blog/${post.slug}`} className="block h-full">
                  <Card className="card-hover h-full overflow-hidden">
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary">{post.category}</Badge>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatBlogDate(post.datePublished)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {post.readingMinutes} min read
                          </span>
                        </div>
                      </div>
                      <h2 className="text-lg font-display font-bold text-gray-900 mb-2 dark:text-gray-100">{post.title}</h2>
                      <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-400">{post.excerpt}</p>
                    </CardContent>
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}