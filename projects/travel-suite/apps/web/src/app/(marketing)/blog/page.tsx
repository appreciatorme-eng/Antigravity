import type { Metadata } from 'next';
import Image from 'next/image';
import { getAllPublishedPosts, type BlogPostSummary } from '@/lib/blog/queries';
import { BlogCard } from '@/components/marketing/blog/BlogCard';
import { BlogHero } from './BlogHero';

export const metadata: Metadata = {
  title: 'Blog | TripBuilt',
  description:
    'Insights, strategies, and playbooks for modern tour operators who want to grow faster and work less.',
};

// Hardcoded fallback articles when the database table is not yet available
const fallbackArticles: BlogPostSummary[] = [
  {
    id: 'fallback-1',
    slug: '',
    title: 'How to Write a Travel Proposal That Converts in 2026',
    excerpt:
      'Stop sending boring PDFs. Learn how interactive, mobile-optimized itineraries are increasing conversion rates by up to 45% for Indian tour operators.',
    author_name: 'Sneha Patel',
    published_at: '2026-03-10T00:00:00Z',
    category: 'Proposals',
    tags: ['proposals'],
    cover_image:
      '/unsplash-img/photo-1454496522488-7a8e488e8606?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'fallback-2',
    slug: '',
    title: 'The Ultimate Guide to Automating WhatsApp for Travel Agents',
    excerpt:
      "Your clients live on WhatsApp. Here's how to stop manually typing out flight times and hotel details, and start automating your entire communication flow.",
    author_name: 'Rahul Sharma',
    published_at: '2026-02-28T00:00:00Z',
    category: 'Automation',
    tags: ['automation'],
    cover_image:
      '/unsplash-img/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'fallback-3',
    slug: '',
    title: 'Why Excel is Killing Your Tour Operations Business',
    excerpt:
      'Still tracking driver payments and agent commissions in a spreadsheet? Discover the hidden costs of manual data entry and how a dedicated OS solves them.',
    author_name: 'Arjun Desai',
    published_at: '2026-02-15T00:00:00Z',
    category: 'Operations',
    tags: ['operations'],
    cover_image:
      '/unsplash-img/photo-1543286386-2e659306cd6c?q=80&w=800&auto=format&fit=crop',
  },
];

export default async function BlogPage() {
  const { data: posts } = await getAllPublishedPosts();
  const articles = posts && posts.length > 0 ? posts : fallbackArticles;
  const isFallback = !posts || posts.length === 0;

  return (
    <div className="text-white selection:bg-[#00F0FF]/30 selection:text-white flex flex-col relative overflow-hidden">
      <BlogHero />

      <div className="flex-grow max-w-7xl mx-auto w-full px-6 md:px-24 pb-20 md:pb-32 pt-8 md:pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {articles.map((article) => {
            if (isFallback) {
              return (
                <article
                  key={article.id}
                  className="group rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] transition-colors flex flex-col"
                >
                  {article.cover_image && (
                    <div className="relative aspect-video overflow-hidden">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                      <Image
                        src={article.cover_image}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-semibold text-[#00F0FF]">
                        {article.category}
                      </div>
                    </div>
                  )}
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-2xl font-bold mb-4 leading-tight">
                      {article.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed flex-grow">
                      {article.excerpt}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/5 mt-auto">
                      <span className="text-xs text-gray-500">
                        {article.author_name}
                      </span>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <BlogCard
                key={article.id}
                slug={article.slug}
                title={article.title}
                excerpt={article.excerpt}
                cover_image={article.cover_image}
                author_name={article.author_name}
                category={article.category}
                published_at={article.published_at}
              />
            );
          })}
        </div>

        {/* Subscribe banner */}
        <div className="mt-20 md:mt-32 p-8 md:p-16 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#FF9933]/10 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF9933]/10 blur-[100px] rounded-full" />

          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl md:text-5xl font-bold mb-4">
              Stay ahead of the{' '}
              <span className="text-[#FF9933]">curve</span>
            </h2>
            <p className="text-gray-400 mb-8 text-base md:text-lg">
              Get one actionable tip every Tuesday on how to automate your
              travel business. No fluff, just operator playbooks.
            </p>

            <p className="text-sm text-gray-500 italic">
              Newsletter coming soon. Follow us on social media for updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
