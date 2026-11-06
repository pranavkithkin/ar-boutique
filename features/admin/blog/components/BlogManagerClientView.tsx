"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Archive,
  FileText,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { AdminBlogPost, BlogPostStatus } from "../types"
import { deleteBlogPostAction, toggleBlogPostStatusAction } from "../actions"

interface BlogManagerClientViewProps {
  initialPosts: AdminBlogPost[]
}

export function BlogManagerClientView({ initialPosts }: BlogManagerClientViewProps) {
  const router = useRouter()
  const [posts, setPosts] = React.useState<AdminBlogPost[]>(initialPosts)

  React.useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<"all" | "published" | "draft" | "archived">("all")
  const [postToDelete, setPostToDelete] = React.useState<AdminBlogPost | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<{ text: string; type: "ok" | "err" } | null>(null)

  // Status message auto-clear
  const showStatus = (text: string, type: "ok" | "err" = "ok") => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 4000)
  }

  // Filter posts
  const filteredPosts = React.useMemo(() => {
    return posts.filter((post) => {
      // Tab filter
      if (activeTab !== "all" && post.status !== activeTab) {
        return false
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = post.title.toLowerCase().includes(query)
        const matchesSlug = post.slug.toLowerCase().includes(query)
        const matchesExcerpt = post.excerpt?.toLowerCase().includes(query)
        const matchesAuthor = post.author?.toLowerCase().includes(query)
        return matchesTitle || matchesSlug || matchesExcerpt || matchesAuthor
      }
      return true
    })
  }, [posts, activeTab, searchQuery])

  // Count tallies
  const counts = React.useMemo(() => {
    return {
      all: posts.length,
      published: posts.filter((p) => p.status === "published").length,
      draft: posts.filter((p) => p.status === "draft").length,
      archived: posts.filter((p) => p.status === "archived").length,
    }
  }, [posts])

  // Image resolver (returns null when no cover image is uploaded)
  const resolveImage = (img?: string | null) => {
    if (!img) return null
    if (img.startsWith("http") || img.startsWith("/")) return img
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "q8qdyl3f"
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit,w_400/${img}`
  }

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Not published"
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return "Recent"
    }
  }

  // Status badge styling
  const renderStatusBadge = (status: BlogPostStatus) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Published
          </Badge>
        )
      case "draft":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider gap-1">
            <FileText className="w-3 h-3" />
            Draft
          </Badge>
        )
      case "archived":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border text-[10px] font-semibold uppercase tracking-wider gap-1">
            <Archive className="w-3 h-3" />
            Archived
          </Badge>
        )
    }
  }

  // Toggle quick status
  const handleToggleStatus = async (post: AdminBlogPost) => {
    const nextStatus: BlogPostStatus = post.status === "published" ? "draft" : "published"
    const res = await toggleBlogPostStatusAction(post.id, nextStatus)
    if (res.success && res.post) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? res.post! : p)))
      showStatus(`Article marked as ${nextStatus}.`, "ok")
    } else {
      showStatus(res.error || "Failed to update article status.", "err")
    }
  }

  // Confirm delete
  const handleDeletePost = async () => {
    if (!postToDelete) return
    setIsDeleting(true)
    const res = await deleteBlogPostAction(postToDelete.id)
    setIsDeleting(false)
    if (res.success) {
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id))
      setPostToDelete(null)
      showStatus("Article successfully deleted.", "ok")
    } else {
      showStatus(res.error || "Failed to delete article.", "err")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Editorial Journal
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Compose, curate, and publish stories, craftsmanship spotlights, and atelier style dispatches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/journal"
            target="_blank"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-4 py-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Storefront View</span>
          </Link>
          <Button render={<Link href="/admin/blog/new" />} className="rounded-none gap-2 px-5">
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </Button>
        </div>
      </div>

      {/* Status Notification Toast */}
      {statusMessage && (
        <div
          className={`p-3 text-xs sm:text-sm rounded-none border flex items-center gap-2 transition-all ${
            statusMessage.type === "ok"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {statusMessage.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Controls & Search Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border border-border p-1 bg-muted/20">
          {(
            [
              { id: "all", label: "All Stories", count: counts.all },
              { id: "published", label: "Published", count: counts.published },
              { id: "draft", label: "Drafts", count: counts.draft },
              { id: "archived", label: "Archived", count: counts.archived },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories..."
            className="pl-9 rounded-none text-xs h-9 bg-card"
          />
        </div>
      </div>

      {/* Articles Table / Grid */}
      {filteredPosts.length === 0 ? (
        <div className="border border-border/80 bg-card p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
            <BookOpen className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-normal text-foreground">No articles found</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm">
              {searchQuery
                ? `No stories match "${searchQuery}". Clear your search query to see all articles.`
                : "You haven't composed any editorial articles yet. Click 'New Article' to begin."}
            </p>
          </div>
          {!searchQuery && (
            <Button render={<Link href="/admin/blog/new" />} className="rounded-none gap-2 mt-2">
              <Plus className="w-4 h-4" />
              <span>Compose First Article</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border/80 bg-card overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Published Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPosts.map((post) => {
                const imgUrl = resolveImage(post.cover_image)
                return (
                  <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                    {/* Title & Cover */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-12 h-12 rounded-none overflow-hidden shrink-0 bg-muted/50 border border-border flex items-center justify-center">
                          {imgUrl ? (
                            <Image
                              src={imgUrl}
                              alt={post.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <FileText className="w-5 h-5 text-muted-foreground/40 stroke-[1.5]" />
                          )}
                        </div>
                        <div className="flex flex-col gap-1 min-w-0 max-w-md">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-heading text-sm font-medium text-foreground truncate block">
                              {post.title}
                            </span>
                            {post.is_featured && (
                              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[9px] uppercase tracking-wider px-1.5 py-0 h-4 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground/80 truncate">
                            /journal/{post.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(post)}
                        title={post.status === "published" ? "Click to move to Draft" : "Click to Publish"}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {renderStatusBadge(post.status)}
                      </button>
                    </td>

                    {/* Author & Read Time */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="text-foreground">{post.author}</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.read_time || "4 min read"}
                        </span>
                      </div>
                    </td>

                    {/* Published Date */}
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {post.status === "published" && (
                          <Link
                            href={`/journal/${post.slug}`}
                            target="_blank"
                            title="View on Storefront"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/blog/${post.id}`}
                          title="Edit Article"
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPostToDelete(post)}
                          title="Delete Article"
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-semibold">Delete Article</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground font-medium">&ldquo;{postToDelete?.title}&rdquo;</strong>? This action
              cannot be undone and will immediately remove the story from both the admin console and the public Journal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              onClick={() => setPostToDelete(null)}
              disabled={isDeleting}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="rounded-none"
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

