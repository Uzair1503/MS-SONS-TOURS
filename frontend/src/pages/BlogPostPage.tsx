import { Link, useParams } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, User } from "lucide-react";
import SeoHead from "@/components/shared/Seo";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { getBlogPost, formatBlogDate } from "@/lib/blog";
import { getBusinessInfo } from "@/lib/businessInfo";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) {
    return (
      <>
        <SeoHead
          title="Blog Post Not Found"
          description="The blog post you are looking for does not exist."
          path={`/blog/${slug ?? ""}`}
        />
        <section className="section-padding bg-brand-cream min-h-[50vh] flex items-center dark:bg-gray-950">
          <div className="container-custom mx-auto text-center">
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-4 dark:text-gray-100">Post not found</h1>
            <p className="text-gray-600 mb-8 dark:text-gray-400">The article you are looking for has been removed or the link is incorrect.</p>
            <Button asChild>
              <Link to="/blog">Back to Blog</Link>
            </Button>
          </div>
        </section>
      </>
    );
  }

  const info = getBusinessInfo();
  const imageUrl = `${SITE_URL}${post.image}`;

  return (
    <>
      <SeoHead
        title={`${post.title} | MS Sons Tours`}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        image={imageUrl}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: [imageUrl],
          datePublished: post.datePublished,
          author: {
            "@type": "Person",
            name: post.author,
          },
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: `${SITE_URL}/`,
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              telephone: info.phone,
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${SITE_URL}/blog/${post.slug}`,
          },
        }}
      />

      <section className="bg-brand-green py-12 md:py-16">
        <div className="container-custom mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: "Blog", to: "/blog" },
              { label: post.title },
            ]}
            tone="light"
          />
          <div className="max-w-3xl">
            <Badge variant="secondary" className="bg-brand-gold text-white mb-3">{post.category}</Badge>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-white/80 text-sm">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatBlogDate(post.datePublished)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readingMinutes} min read
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-brand-cream dark:bg-gray-950">
        <div className="container-custom mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-xl mb-8">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
          <div className="space-y-5">
            {post.content.map((paragraph, i) => (
              <p key={i} className="text-gray-700 leading-relaxed dark:text-gray-300">{paragraph}</p>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-gray-200 flex items-center justify-between dark:border-gray-700">
            <Button variant="outline" asChild>
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Articles
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/contact">Plan Your Umrah</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}