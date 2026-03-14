'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, User } from 'lucide-react';

interface BlogPostProps {
  content: string;
  title: string;
  author_name: string;
  published_at: string;
  category: string;
  tags: string[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// TODO: Replace with next-mdx-remote MDX rendering when package is installed
function renderMarkdownContent(content: string): string {
  return content
    // Headings: ### before ## to avoid double-matching
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-8 mb-3 text-white">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-10 mb-4 text-white">$1</h2>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 text-gray-300 list-disc list-inside">$1</li>')
    // Paragraphs: wrap non-tag lines
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
        return trimmed;
      }
      return `<p class="mb-4 text-gray-300 leading-relaxed">${trimmed}</p>`;
    })
    .join('\n');
}

export function BlogPost({
  content,
  title,
  author_name,
  published_at,
  category,
  tags,
}: BlogPostProps) {
  const htmlContent = renderMarkdownContent(content);

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#00F0FF] transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Back to all posts
      </Link>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-[#00F0FF]/10 border border-[#00F0FF]/20 rounded-full text-xs font-semibold text-[#00F0FF]">
            {category}
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <User size={16} />
            <span>{author_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{formatDate(published_at)}</span>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Tag size={14} className="text-gray-500" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-md bg-white/5 border border-white/10 text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <article
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
