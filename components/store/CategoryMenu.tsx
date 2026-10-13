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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [open, setOpen] = React.useState(false)
  const closeTimeout = React.useRef<NodeJS.Timeout | null>(null)

  const clearCloseTimeout = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current)
      closeTimeout.current = null
    }
  }

  const handleMouseEnter = () => {
    if (mobile) return
    clearCloseTimeout()
    setOpen(true)
    void refresh()
  }

  const handleMouseLeave = () => {
    if (mobile) return
    clearCloseTimeout()
    closeTimeout.current = setTimeout(() => {
      setOpen(false)
    }, 150)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) void refresh()
  }

  const choose = () => {
    clearCloseTimeout()
    setOpen(false)
    onNavigate?.()
  }

  React.useEffect(() => {
    return () => clearCloseTimeout()
  }, [])

  if (mobile) {
    return (
      <div className="border-l border-border pl-2" aria-label="Product categories">
        <Link
          href="/collections"
          onClick={choose}
          className="flex min-h-11 items-center px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          Shop all
        </Link>
        {loading && <p role="status" className="px-3 py-2 text-sm text-muted-foreground">Loading categories...</p>}
        {error && (
          <div role="status" className="px-3 py-2 text-sm text-muted-foreground">
            <p>Categories unavailable.</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="min-h-11 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && categories.length === 0 && (
          <p className="px-3 py-2 text-sm text-muted-foreground">No categories yet.</p>
        )}
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/collections?category=${encodeURIComponent(category.slug)}`}
                onClick={choose}
                className="flex min-h-11 min-w-0 items-center px-3 py-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <span className="min-w-0" style={{ overflowWrap: "anywhere" }}>{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger
          aria-label="Browse collections"
          className="flex h-11 cursor-pointer items-center gap-1 rounded-none hover:opacity-70 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Link
            href="/collections"
            onClick={choose}
            className="hover:opacity-70 transition-opacity flex items-center py-2 text-[15px]"
          >
            Collections
          </Link>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            strokeWidth={1.5}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          side="bottom"
          sideOffset={4}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="w-56 p-1.5 shadow-lg border border-border bg-popover text-popover-foreground font-sans"
        >
          <DropdownMenuItem
            render={<Link href="/collections" onClick={choose} />}
            className="cursor-pointer py-2 px-3 text-[15px] font-normal tracking-normal text-popover-foreground hover:bg-accent focus:bg-accent rounded-none transition-colors"
          >
            Shop all
          </DropdownMenuItem>

          {loading && (
            <div role="status" className="px-3 py-2 text-[15px] text-muted-foreground font-normal">
              Loading categories...
            </div>
          )}

          {error && (
            <div role="status" className="px-3 py-2 text-[15px] text-muted-foreground font-normal">
              <p>Categories unavailable.</p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring mt-1 block text-[13px]"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && categories.length === 0 && (
            <div className="px-3 py-2 text-[15px] text-muted-foreground font-normal">
              No categories yet.
            </div>
          )}

          {!loading &&
            !error &&
            categories.map((category) => (
              <DropdownMenuItem
                key={category.id}
                render={
                  <Link
                    href={`/collections?category=${encodeURIComponent(category.slug)}`}
                    onClick={choose}
                  />
                }
                className="cursor-pointer py-2 px-3 text-[15px] font-normal tracking-normal text-popover-foreground hover:bg-accent focus:bg-accent rounded-none transition-colors"
              >
                <span className="truncate">{category.name}</span>
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
