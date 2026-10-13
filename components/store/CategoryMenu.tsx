"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { z } from "zod"

const responseSchema = z.object({
  categories: z.array(z.object({ id: z.string().uuid(), name: z.string().min(1), slug: z.string().min(1) })),
})
type Category = z.infer<typeof responseSchema>["categories"][number]
type MenuState = { categories: Category[]; loading: boolean; error: boolean }

// One hook per header, shared by desktop and mobile menus.
export function useMenuCategories() {
  const [state, setState] = React.useState<MenuState>({ categories: [], loading: true, error: false })
  const pending = React.useRef<AbortController | null>(null)
  const refresh = React.useCallback(async () => {
    if (pending.current) return
    const controller = new AbortController()
    pending.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 8_000)
    try {
      const response = await fetch("/api/categories", { cache: "no-store", signal: controller.signal })
      if (!response.ok) throw new Error("Category menu unavailable")
      const result = responseSchema.safeParse(await response.json())
      if (!result.success) throw new Error("Invalid category menu")
      if (pending.current === controller) setState({ categories: result.data.categories, loading: false, error: false })
    } catch {
      // Clear stale links on failure rather than continuing to show a category
      // that could have been hidden or renamed.
      if (pending.current === controller) setState({ categories: [], loading: false, error: true })
    } finally {
      window.clearTimeout(timeout)
      if (pending.current === controller) pending.current = null
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    const visibleRefresh = () => { if (document.visibilityState === "visible") void refresh() }
    const interval = window.setInterval(visibleRefresh, 60_000)
    window.addEventListener("focus", visibleRefresh)
    document.addEventListener("visibilitychange", visibleRefresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", visibleRefresh)
      document.removeEventListener("visibilitychange", visibleRefresh)
      const request = pending.current
      pending.current = null
      request?.abort()
    }
  }, [refresh])

  return { ...state, refresh }
}

type MenuProps = ReturnType<typeof useMenuCategories> & { mobile?: boolean; onNavigate?: () => void }

export function CategoryMenu({ categories, loading, error, refresh, mobile = false, onNavigate }: MenuProps) {
  const disclosure = React.useRef<HTMLDetailsElement>(null)
  React.useEffect(() => {
    if (mobile) return
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !disclosure.current?.contains(event.target) && disclosure.current) {
        disclosure.current.open = false
      }
    }
    document.addEventListener("pointerdown", closeOutside)
    document.addEventListener("focusin", closeOutside)
    return () => {
      document.removeEventListener("pointerdown", closeOutside)
      document.removeEventListener("focusin", closeOutside)
    }
  }, [mobile])

  const choose = () => {
    if (disclosure.current) disclosure.current.open = false
    onNavigate?.()
  }
  const links = (
    <div aria-label="Product categories">
      <Link href="/collections" onClick={choose} className="flex min-h-11 items-center px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">Shop all</Link>
      {loading && <p role="status" className="px-3 py-2 text-sm text-muted-foreground">Loading categories...</p>}
      {error && (
        <div role="status" className="px-3 py-2 text-sm text-muted-foreground">
          <p>Categories unavailable.</p>
          <button type="button" onClick={() => void refresh()} className="min-h-11 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">Try again</button>
        </div>
      )}
      {!loading && !error && categories.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No categories yet.</p>}
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/collections?category=${encodeURIComponent(category.slug)}`}
              onClick={choose}
              className="flex min-h-11 min-w-0 items-center px-3 py-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            ><span className="min-w-0" style={{ overflowWrap: "anywhere" }}>{category.name}</span></Link>
          </li>
        ))}
      </ul>
    </div>
  )

  if (mobile) return <div className="border-l border-border pl-2">{links}</div>
  return (
    <div className="flex items-center gap-1">
      <Link href="/collections" className="hover:opacity-70 transition-opacity">Collections</Link>
      <details
        ref={disclosure}
        className="group relative"
        onToggle={(event) => { if (event.currentTarget.open) void refresh() }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && disclosure.current?.open) {
            event.preventDefault()
            disclosure.current.open = false
            disclosure.current.querySelector("summary")?.focus()
          }
        }}
      >
        <summary aria-label="Browse categories" className="flex h-11 w-11 cursor-pointer list-none items-center justify-center hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-4 w-4 group-open:rotate-180 motion-safe:transition-transform" strokeWidth={1.5} />
        </summary>
        <div className="absolute top-full left-0 z-50 mt-2 max-h-[60dvh] w-64 overflow-y-auto border border-border bg-background text-foreground p-2 shadow-md">{links}</div>
      </details>
    </div>
  )
}
