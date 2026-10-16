"use client"

import * as React from "react"
import { AdminSizeItem } from "../types"
import { toggleSizeActiveAction, reorderSizesAction } from "../actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SizeFormModal } from "./SizeFormModal"
import { SizeDeleteDialog } from "./SizeDeleteDialog"
import {
  Ruler,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"

interface SizesTableProps {
  sizes: AdminSizeItem[]
}

export function SizesTable({ sizes }: SizesTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [sizeToEdit, setSizeToEdit] = React.useState<AdminSizeItem | null>(null)
  const [sizeToDelete, setSizeToDelete] = React.useState<AdminSizeItem | null>(null)
  const [isReordering, setIsReordering] = React.useState(false)

  // Filter sizes by label
  const filteredSizes = React.useMemo(() => {
    if (!searchQuery.trim()) return sizes
    const q = searchQuery.toLowerCase().trim()
    return sizes.filter((s) => s.label.toLowerCase().includes(q))
  }, [sizes, searchQuery])

  function handleOpenCreate() {
    setSizeToEdit(null)
    setIsModalOpen(true)
  }

  function handleOpenEdit(s: AdminSizeItem) {
    setSizeToEdit(s)
    setIsModalOpen(true)
  }

  function handleOpenDelete(s: AdminSizeItem) {
    setSizeToDelete(s)
  }

  async function handleToggleActive(s: AdminSizeItem) {
    await toggleSizeActiveAction(s.id, !s.is_active)
  }

  async function handleMove(index: number, direction: "up" | "down") {
    if (isReordering) return
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sizes.length) return

    setIsReordering(true)
    const newOrder = [...sizes]
    const temp = newOrder[index]
    newOrder[index] = newOrder[targetIndex]
    newOrder[targetIndex] = temp

    try {
      await reorderSizesAction(newOrder.map((s) => s.id))
    } finally {
      setIsReordering(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search size labels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs bg-background border-input rounded-none font-sans"
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
            {filteredSizes.length} of {sizes.length} sizes
          </span>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-9 px-4 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Add Size</span>
        </Button>
      </div>

      {/* Sizes List Table */}
      <div className="border border-border bg-card rounded-none overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <th className="py-3 px-4 w-12 text-center">Sort</th>
              <th className="py-3 px-4 w-28">Size Label</th>
              <th className="py-3 px-4">Order Sequence</th>
              <th className="py-3 px-4 text-center">Usage</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredSizes.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                  <Ruler className="size-6 mx-auto mb-2 opacity-40" />
                  No garment sizes found matching your search.
                </td>
              </tr>
            ) : (
              filteredSizes.map((s, idx) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  {/* Reorder Up / Down */}
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        disabled={idx === 0 || isReordering}
                        onClick={() => handleMove(idx, "up")}
                        className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                        title="Move Up"
                      >
                        <ChevronUp className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        disabled={idx === filteredSizes.length - 1 || isReordering}
                        onClick={() => handleMove(idx, "down")}
                        className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                        title="Move Down"
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                    </div>
                  </td>

                  {/* Size Label */}
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center justify-center min-w-8 h-7 px-2.5 text-xs font-mono font-semibold bg-muted/50 border border-border text-foreground">
                      {s.label}
                    </span>
                  </td>

                  {/* Order Sequence */}
                  <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                    Position #{s.sort} in picker
                  </td>

                  {/* Usage Count */}
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 border ${
                        s.usage_count > 0
                          ? "bg-primary/5 border-primary/20 text-foreground"
                          : "bg-muted/60 border-border text-muted-foreground"
                      }`}
                    >
                      {s.usage_count} {s.usage_count === 1 ? "Variant" : "Variants"}
                    </span>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(s)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer ${
                        s.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      }`}
                      title={s.is_active ? "Click to hide from store" : "Click to show on store"}
                    >
                      {s.is_active ? (
                        <>
                          <Eye className="size-3" />
                          <span>Live</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-3" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => handleOpenEdit(s)}
                        className="size-7 rounded-none text-muted-foreground hover:text-foreground"
                        title="Edit size"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => handleOpenDelete(s)}
                        className="size-7 rounded-none text-muted-foreground hover:text-destructive"
                        title="Delete size"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <SizeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sizeToEdit={sizeToEdit}
        existingCount={sizes.length}
      />

      <SizeDeleteDialog
        size={sizeToDelete}
        isOpen={!!sizeToDelete}
        onClose={() => setSizeToDelete(null)}
        onDeactivate={async (id) => {
          await toggleSizeActiveAction(id, false)
        }}
      />
    </div>
  )
}
