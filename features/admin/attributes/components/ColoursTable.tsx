"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface ColoursTableProps {
  colours: AdminColourItem[]
}

export function ColoursTable({ colours }: ColoursTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [colourToEdit, setColourToEdit] = React.useState<AdminColourItem | null>(null)
  const [colourToDelete, setColourToDelete] = React.useState<AdminColourItem | null>(null)

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

  const columns = React.useMemo<ColumnDef<AdminColourItem>[]>(
    () => [
      {
        id: "swatch",
        header: () => <span className="w-16">Swatch</span>,
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex items-center gap-2">
              <div
                className="size-6 rounded-full border border-border/80 shrink-0 shadow-sm"
                style={{ backgroundColor: c.swatch_hex || "#f4f4f5" }}
                title={c.swatch_hex || "No hex defined"}
              />
            </div>
          )
        },
      },
      {
        accessorKey: "name",
        header: "Colour Name",
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{c.name}</span>
              {c.swatch_hex && (
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  {c.swatch_hex}
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "usage_count",
        header: () => <div className="text-center">Usage</div>,
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="text-center">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 border ${
                  c.usage_count > 0
                    ? "bg-primary/5 border-primary/20 text-foreground"
                    : "bg-muted/60 border-border text-muted-foreground"
                }`}
              >
                {c.usage_count} {c.usage_count === 1 ? "Colourway" : "Colourways"}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "is_active",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="text-center">
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
            </div>
          )
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const c = row.original
          return (
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
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: colours,
    columns,
    state: {
      globalFilter,
      pagination,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const name = String(row.original.name || "").toLowerCase()
      const hex = String(row.original.swatch_hex || "").toLowerCase()
      const query = String(filterValue || "").toLowerCase().trim()
      return name.includes(query) || hex.includes(query)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

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
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 pl-9 text-xs bg-background border-input rounded-none font-sans"
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
            {table.getFilteredRowModel().rows.length} of {colours.length} colours
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

      {/* Colours List Table (shadcn/ui Table) */}
      <div className="border border-border bg-card rounded-none overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border bg-muted/40 hover:bg-muted/40 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="py-3 px-4 font-semibold text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-xs text-muted-foreground"
                >
                  <Palette className="size-6 mx-auto mb-2 opacity-40" />
                  No boutique colours found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/20 transition-colors border-b border-border/60"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 px-4 font-sans text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="text-xs text-muted-foreground font-sans">
          {table.getFilteredRowModel().rows.length === 0 ? (
            "Showing 0 colours"
          ) : (
            <>
              Showing{" "}
              <span className="font-mono font-medium text-foreground">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-mono font-medium text-foreground">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-mono font-medium text-foreground">
                {table.getFilteredRowModel().rows.length}
              </span>{" "}
              colours
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-none h-8 px-3 text-xs font-sans border-input hover:bg-muted gap-1"
          >
            <ChevronLeft className="size-3.5" />
            <span>Previous</span>
          </Button>

          <span className="text-xs font-mono text-muted-foreground px-2">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(1, table.getPageCount())}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-none h-8 px-3 text-xs font-sans border-input hover:bg-muted gap-1"
          >
            <span>Next</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
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

