"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Upload,
  Trash2,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { BlogRichTextEditor } from "./BlogRichTextEditor"
import type { AdminBlogPost, BlogPostStatus, SaveBlogPostInput } from "../types"
import { saveBlogPostAction, uploadBlogCoverPhotoAction, deleteBlogCoverPhotoAction } from "../actions"

interface BlogPostFormProps {
  initialPost?: AdminBlogPost | null
}

export function BlogPostForm({ initialPost }: BlogPostFormProps) {
  const router = useRouter()
  const isEditing = Boolean(initialPost?.id)

  // Form State
  const [title, setTitle] = React.useState(initialPost?.title || "")
  const [slug, setSlug] = React.useState(initialPost?.slug || "")
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(isEditing)
  const [author, setAuthor] = React.useState(initialPost?.author || "AR Boutique")
  const [excerpt, setExcerpt] = React.useState(initialPost?.excerpt || "")
  const [content, setContent] = React.useState(initialPost?.content || "")
  const [readTime, setReadTime] = React.useState(initialPost?.read_time || "4 min read")
  const [isFeatured, setIsFeatured] = React.useState(initialPost?.is_featured || false)
  const [status, setStatus] = React.useState<BlogPostStatus>(initialPost?.status || "draft")
  const [coverImage, setCoverImage] = React.useState<string | null>(initialPost?.cover_image || null)
  const [coverImageUrl, setCoverImageUrl] = React.useState<string | null>(null)
  const [seoTitle, setSeoTitle] = React.useState(initialPost?.seo_title || "")
  const [seoDescription, setSeoDescription] = React.useState(initialPost?.seo_description || "")

  // UI state
  const [isUploadingImage, setIsUploadingImage] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    if (!slugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
      setSlug(generated)
    }
  }

  // Handle content change & auto-calculate read time
  const handleContentChange = (newContent: string, wordCount: number) => {
    setContent(newContent)
    const minutes = Math.max(1, Math.ceil(wordCount / 200))
    setReadTime(`${minutes} min read`)
  }

  // Cover Image Upload Handler
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (initialPost?.id) {
        formData.append("postId", initialPost.id)
      }

      const res = await uploadBlogCoverPhotoAction(formData)
      if (res.success && res.mediaKey) {
        setCoverImage(res.mediaKey)
        setCoverImageUrl(res.url || null)
      } else {
        setErrorMessage(res.error || "Failed to upload image.")
      }
    } catch {
      setErrorMessage("An unexpected error occurred during image upload.")
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Cover Image Delete Handler (removes from Cloudinary and persists immediately)
  const [isDeletingImage, setIsDeletingImage] = React.useState(false)
  const handleDeleteCover = async () => {
    if (!coverImage) return
    setIsDeletingImage(true)
    setErrorMessage(null)
    try {
      await deleteBlogCoverPhotoAction(coverImage)
      setCoverImage(null)
      setCoverImageUrl(null)

      // If editing an existing article, persist the removal to the database immediately
      if (initialPost?.id) {
        await saveBlogPostAction({
          id: initialPost.id,
          title: title.trim(),
          slug: slug.trim().toLowerCase(),
          excerpt: excerpt.trim() || null,
          content: content.trim() || null,
          author: author.trim() || "AR Boutique",
          read_time: readTime,
          is_featured: isFeatured,
          status,
          cover_image: null,
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
        })
      }
    } catch {
      setErrorMessage("Failed to remove cover image.")
    } finally {
      setIsDeletingImage(false)
    }
  }

  // Submit Handler
  const handleSubmit = async (targetStatus?: BlogPostStatus) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const finalStatus = targetStatus || status

    const payload: SaveBlogPostInput = {
      id: initialPost?.id,
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      excerpt: excerpt.trim() || null,
      content: content.trim() || null,
      category: "Journal",
      author: author.trim() || "AR Boutique",
      read_time: readTime,
      is_featured: isFeatured,
      status: finalStatus,
      cover_image: coverImage || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      published_at:
        finalStatus === "published"
          ? initialPost?.published_at || new Date().toISOString()
          : null,
    }

    try {
      const res = await saveBlogPostAction(payload)
      if (res.success && res.post) {
        setStatus(finalStatus)
        setSuccessMessage(
          finalStatus === "published"
            ? "Article published successfully!"
            : finalStatus === "archived"
            ? "Article saved to archive."
            : "Article saved as draft."
        )
        setTimeout(() => {
          router.push("/admin/blog")
        }, 800)
      } else {
        setErrorMessage(res.error || "Failed to save article.")
      }
    } catch {
      setErrorMessage("An unexpected error occurred while saving.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Resolve preview image URL
  const displayImageUrl = React.useMemo(() => {
    if (coverImageUrl) return coverImageUrl
    if (!coverImage) return null
    if (coverImage.startsWith("http") || coverImage.startsWith("/")) return coverImage
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_800/${coverImage}`
  }, [coverImage, coverImageUrl])

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-28">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-3 pb-4 border-b border-border">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/blog">Editorial Journal</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{isEditing ? title || "Edit Article" : "New Article"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {isEditing ? "Edit Article" : "Compose New Article"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Craft luxury stories with the EditorCN Tiptap rich-text suite and publish to the boutique journal.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              render={<Link href="/admin/blog" />}
              className="rounded-none gap-2 text-xs uppercase tracking-wider h-9"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </Button>
            {isEditing && slug && (
              <Link
                href={`/journal/${slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-3 h-9 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </Link>
            )}
            {status !== "draft" && (
              <Button
                variant="outline"
                type="button"
                disabled={isSubmitting || !title.trim()}
                onClick={() => {
                  setStatus("draft")
                  handleSubmit("draft")
                }}
                className="rounded-none gap-1.5 text-xs uppercase tracking-wider h-9"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save as Draft</span>
              </Button>
            )}
            {status !== "published" && (
              <Button
                variant="outline"
                type="button"
                disabled={isSubmitting || !title.trim() || !slug.trim()}
                onClick={() => {
                  setStatus("published")
                  handleSubmit("published")
                }}
                className="rounded-none gap-1.5 text-xs uppercase tracking-wider h-9"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish Now</span>
              </Button>
            )}
            <Button
              type="button"
              disabled={isSubmitting || !title.trim() || !slug.trim()}
              onClick={() => handleSubmit()}
              className="rounded-none gap-1.5 text-xs uppercase tracking-wider h-9 px-4 bg-foreground text-background hover:bg-foreground/90"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? "Saving..."
                  : status === "published"
                  ? isEditing
                    ? "Save Changes"
                    : "Publish Article"
                  : status === "archived"
                  ? "Save as Archived"
                  : "Save as Draft"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 text-xs sm:text-sm bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2.5 rounded-none">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 text-xs sm:text-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 rounded-none">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Article Identity Card */}
          <div className="border border-border bg-card p-5 sm:p-6 rounded-none space-y-4">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Article Identity
              </h2>
              <span className="text-[11px] text-muted-foreground font-mono">Core Metadata</span>
            </div>

            {/* Article Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. The Poetry of Handcrafted Zardozi: Behind Our Signature Embroidery"
                className="rounded-none text-base font-medium h-11 bg-background border-border placeholder:text-muted-foreground/60"
                required
              />
            </div>

            {/* URL Slug */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>URL Permalink</span>
                <span className="text-[11px] text-muted-foreground font-mono">Storefront address</span>
              </label>
              <div className="flex items-center">
                <span className="bg-muted px-3 py-2 text-xs font-mono text-muted-foreground border border-r-0 border-border select-none h-9 flex items-center">
                  /journal/
                </span>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true)
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                  }}
                  placeholder="signature-embroidery-craft"
                  className="rounded-none text-xs font-mono h-9 bg-background border-border"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  Editorial Excerpt
                </label>
                <span className="text-[11px] text-muted-foreground font-mono">{excerpt.length} / 500</span>
              </div>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A brief summary displayed on journal index cards and social preview snippets..."
                rows={3}
                maxLength={500}
                className="rounded-none text-xs sm:text-sm bg-background border-border leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Tiptap Rich Text Editor Card */}
          <div className="border border-border bg-card p-5 sm:p-6 rounded-none space-y-3">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Story Content
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Full article body with headings, styled paragraphs, lists, and links.
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 bg-muted/60 border border-border">
                {readTime}
              </span>
            </div>

            <BlogRichTextEditor
              value={content}
              onChange={handleContentChange}
              placeholder="Begin writing your story with headings, blockquotes, styling lists, and formatted paragraphs..."
            />
          </div>
        </div>

        {/* Sidebar Settings Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Publishing Status Card */}
          <div className="border border-border bg-card p-5 rounded-none flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2.5">
              Publishing Status
            </h3>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium text-muted-foreground">
                Document State
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(["draft", "published", "archived"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-1.5 text-xs font-medium uppercase tracking-wider border cursor-pointer transition-colors ${
                      status === s
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground hover:text-foreground border-border"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Byline Author */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
              <label className="text-[11px] font-medium text-muted-foreground">
                Byline Author
              </label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="AR Boutique Atelier"
                className="rounded-none text-xs h-9 bg-background border-border"
              />
            </div>

            {/* Featured Story Toggle */}
            <div className="flex items-start gap-2.5 pt-2 border-t border-border">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="mt-1 rounded-none cursor-pointer"
              />
              <label htmlFor="isFeatured" className="text-xs text-foreground cursor-pointer flex flex-col">
                <span className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Featured Lead Story
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                  Showcase as the lead hero dispatch on the storefront Journal page.
                </span>
              </label>
            </div>
          </div>

          {/* Cover Image Card */}
          <div className="border border-border bg-card p-5 rounded-none flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2.5">
              Featured Cover Image
            </h3>

            {displayImageUrl ? (
              <div className="flex flex-col gap-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-none border border-border bg-muted">
                  <Image
                    src={displayImageUrl}
                    alt={title || "Cover preview"}
                    fill
                    sizes="320px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground truncate">
                    {coverImage}
                  </span>
                  <button
                    type="button"
                    disabled={isDeletingImage}
                    onClick={handleDeleteCover}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-40"
                    title="Delete image from Cloudinary"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border p-6 text-center flex flex-col items-center justify-center gap-2 bg-muted/10">
                <Upload className="w-5 h-5 text-muted-foreground stroke-[1.5]" />
                <span className="text-xs font-medium text-foreground">Upload cover image</span>
                <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP up to 10MB</span>
                <label className="mt-2 inline-flex items-center px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider bg-foreground text-background cursor-pointer hover:bg-foreground/90 transition-colors">
                  {isUploadingImage ? "Uploading..." : "Select File"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={isUploadingImage}
                    className="sr-only"
                  />
                </label>
              </div>
            )}
          </div>

          {/* SEO Metadata Card */}
          <div className="border border-border bg-card p-5 rounded-none flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground border-b border-border pb-2.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-foreground" />
              SEO & Social Sharing
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                SEO Title (Meta)
              </label>
              <Input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={title || "Custom search title..."}
                maxLength={100}
                className="rounded-none text-xs h-9 bg-background border-border"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                SEO Description
              </label>
              <Textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder={excerpt || "Search engine description snippet..."}
                rows={2}
                maxLength={200}
                className="rounded-none text-xs bg-background border-border resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/admin/blog"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Dispatches
          </Link>

          <div className="flex items-center gap-3">
            {status !== "draft" && (
              <Button
                variant="outline"
                type="button"
                disabled={isSubmitting || !title.trim()}
                onClick={() => {
                  setStatus("draft")
                  handleSubmit("draft")
                }}
                className="rounded-none gap-2 text-xs uppercase tracking-wider h-9"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save as Draft</span>
              </Button>
            )}
            {status !== "published" && (
              <Button
                variant="outline"
                type="button"
                disabled={isSubmitting || !title.trim() || !slug.trim()}
                onClick={() => {
                  setStatus("published")
                  handleSubmit("published")
                }}
                className="rounded-none gap-2 text-xs uppercase tracking-wider h-9"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish Now</span>
              </Button>
            )}
            <Button
              type="button"
              disabled={isSubmitting || !title.trim() || !slug.trim()}
              onClick={() => handleSubmit()}
              className="rounded-none gap-2 text-xs uppercase tracking-wider px-6 h-9 bg-foreground text-background hover:bg-foreground/90"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? "Saving..."
                  : status === "published"
                  ? isEditing
                    ? "Save Changes"
                    : "Publish Article"
                  : status === "archived"
                  ? "Save as Archived"
                  : "Save as Draft"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

