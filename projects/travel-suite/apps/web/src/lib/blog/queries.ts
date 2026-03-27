import { createClient } from '@/lib/supabase/server';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  author_name: string;
  category: string;
  tags: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BlogPostSummary = Pick<
  BlogPost,
  'id' | 'slug' | 'title' | 'excerpt' | 'cover_image' | 'author_name' | 'category' | 'tags' | 'published_at'
>;


export async function getAllPublishedPosts(): Promise<{ data: BlogPostSummary[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('blog_posts')
      .select('id, slug, title, excerpt, cover_image, author_name, category, tags, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as unknown as BlogPostSummary[], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch blog posts';
    return { data: null, error: message };
  }
}

export async function getPostBySlug(slug: string): Promise<{ data: BlogPost | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as unknown as BlogPost, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch blog post';
    return { data: null, error: message };
  }
}

export async function getPostsByCategory(category: string): Promise<{ data: BlogPostSummary[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('blog_posts')
      .select('id, slug, title, excerpt, cover_image, author_name, category, tags, published_at')
      .eq('published', true)
      .eq('category', category)
      .order('published_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as unknown as BlogPostSummary[], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch blog posts';
    return { data: null, error: message };
  }
}
