import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/lib/blog/queries';
import { BlogPost } from '@/components/marketing/blog/BlogPost';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await getPostBySlug(slug);

  if (!post) {
    return { title: 'Post Not Found | TripBuilt' };
  }

  return {
    title: `${post.title} | TripBuilt Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      authors: [post.author_name],
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const { data: post } = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="text-white selection:bg-[#00F0FF]/30 selection:text-white min-h-screen">
      <div className="pt-32 md:pt-40 pb-20 md:pb-32 px-6 md:px-24">
        <BlogPost
          content={post.content}
          title={post.title}
          author_name={post.author_name}
          published_at={post.published_at ?? post.created_at}
          category={post.category}
          tags={post.tags}
        />
      </div>
    </div>
  );
}
