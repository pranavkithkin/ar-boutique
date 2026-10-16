"use client"

import * as React from "react"
import { AdminColourItem } from "../types"
import { toggleColourActiveAction } from "../actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ColourFormModal } from "./ColourFormModal"
import { ColourDeleteDialog } from "./ColourDeleteDialog"
import {
  Palette,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"

interface ColoursTableProps {
  colours: AdminColourItem[]
}

export function ColoursTable({ colours }: ColoursTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [colourToEdit, setColourToEdit] = React.useState<AdminColourItem | null>(null)
  const [colourToDelete, setColourToDelete] = React.useState<AdminColourItem | null>(null)

  // Filter colours by name
  const filteredColours = React.useMemo(() => {
    if (!searchQuery.trim()) return colours
    const q = searchQuery.toLowerCase().trim()
    return colours.filter((c) => c.name.toLowerCase().includes(q))
  }, [colours, searchQuery])

  function handleOpenCreate() {
    setColourToEdit(null)
    setIsModalOpen(true)
  }

  function handleOpenEdit(c: AdminColourItem) {
    setColourToEdit(c)
    setIsModalOpen(true)
  }

  function handleOpenDelete(c: AdminColourItem) {
    setColourToDelete(c)
  }

  async function handleToggleActive(c: AdminColourItem) {
    await toggleColourActiveAction(c.id, !c.is_active)
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
              placeholder="Search colours..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs bg-background border-input rounded-none font-sans"
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
            {filteredColours.length} of {colours.length} colours
          </span>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-9 px-4 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Add Colour</span>
        </Button>
      </div>

      {/* Colours List Table */}
      <div className="border border-border bg-card rounded-none overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <th className="py-3 px-4 w-16">Swatch</th>
              <th className="py-3 px-4">Colour Name</th>
              <th className="py-3 px-4 text-center">Usage</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredColours.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                  <Palette className="size-6 mx-auto mb-2 opacity-40" />
                  No boutique colours found matching your search.
                </td>
              </tr>
            ) : (
              filteredColours.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  {/* Swatch Preview */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-6 rounded-full border border-border/80 shrink-0 shadow-sm"
                        style={{ backgroundColor: c.swatch_hex || "#f4f4f5" }}
                        title={c.swatch_hex || "No hex defined"}
                      />
                    </div>
                  </td>

                  {/* Colour Name */}
                  <td className="py-2.5 px-4 font-medium text-foreground">
                    <div className="flex flex-col">
                      <span>{c.name}</span>
                      {c.swatch_hex && (
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {c.swatch_hex}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Usage Count */}
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 border ${
                        c.usage_count > 0
                          ? "bg-primary/5 border-primary/20 text-foreground"
                          : "bg-muted/60 border-border text-muted-foreground"
                      }`}
                    >
                      {c.usage_count} {c.usage_count === 1 ? "Colourway" : "Colourways"}
                    </span>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer ${
                        c.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      }`}
                      title={c.is_active ? "Click to hide from store" : "Click to show on store"}
                    >
                      {c.is_active ? (
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
                        onClick={() => handleOpenEdit(c)}
                        className="size-7 rounded-none text-muted-foreground hover:text-foreground"
                        title="Edit colour"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => handleOpenDelete(c)}
                        className="size-7 rounded-none text-muted-foreground hover:text-destructive"
                        title="Delete colour"
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
      <ColourFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        colourToEdit={colourToEdit}
      />

      <ColourDeleteDialog
        colour={colourToDelete}
        isOpen={!!colourToDelete}
        onClose={() => setColourToDelete(null)}
        onDeactivate={async (id) => {
          await toggleColourActiveAction(id, false)
        }}
      />
    </div>
  )
}
