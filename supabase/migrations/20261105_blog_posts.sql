-- Migration: Create blog_posts table for Editorial Journal (TASK-092, TASK-093)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content text,
  category text NOT NULL DEFAULT 'Journal',
  cover_image text,
  author text NOT NULL DEFAULT 'AR Boutique',
  read_time text NOT NULL DEFAULT '4 min read',
  is_featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published_at ON public.blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published articles
CREATE POLICY "Public can view published blog posts"
  ON public.blog_posts
  FOR SELECT
  USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));

-- Permissions
GRANT ALL ON TABLE public.blog_posts TO service_role;
GRANT SELECT ON TABLE public.blog_posts TO anon, authenticated;

