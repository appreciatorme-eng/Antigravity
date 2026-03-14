import Image from 'next/image';
import Link from 'next/link';
import { Calendar, User } from 'lucide-react';

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  author_name: string;
  category: string;
  published_at: string | null;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function BlogCard({
  slug,
  title,
  excerpt,
  cover_image,
  author_name,
  category,
  published_at,
}: BlogCardProps) {
  return (
    <article className="group rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] transition-colors flex flex-col">
      <div className="relative aspect-video overflow-hidden">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
        {cover_image ? (
          <Image
            src={cover_image}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#00F0FF]/20 to-[#FF9933]/20" />
        )}
        <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-semibold text-[#00F0FF]">
          {category}
        </div>
      </div>

      <div className="p-8 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold mb-4 group-hover:text-[#00F0FF] transition-colors leading-tight">
          <Link href={`/blog/${slug}`} className="before:absolute before:inset-0">
            {title}
          </Link>
        </h3>

        <p className="text-gray-400 text-sm mb-6 leading-relaxed flex-grow">
          {excerpt}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User size={14} className="text-gray-400" />
            <span>{author_name}</span>
          </div>
          {published_at && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={14} className="text-gray-400" />
              <span>{formatDate(published_at)}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
