"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AdminCategoryItem, CategoryVisibilityFilter } from "../types"
import { CategoriesToolbar } from "./CategoriesToolbar"
import { CategoriesTable } from "./CategoriesTable"
import { CategoryFormModal } from "./CategoryFormModal"
import { CategoryDeleteDialog } from "./CategoryDeleteDialog"
import { toggleCategoryActiveAction, reorderCategoriesAction } from "../actions"

interface CategoriesClientContainerProps {
  initialCategories: AdminCategoryItem[]
}

export function CategoriesClientContainer({
  initialCategories = [],
}: CategoriesClientContainerProps) {
  const router = useRouter()

  const [categories, setCategories] = React.useState<AdminCategoryItem[]>(initialCategories)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [visibilityFilter, setVisibilityFilter] = React.useState<CategoryVisibilityFilter>("all")

  // Modal states
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [categoryToEdit, setCategoryToEdit] = React.useState<AdminCategoryItem | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [categoryToDelete, setCategoryToDelete] = React.useState<AdminCategoryItem | null>(null)

  const [isReordering, setIsReordering] = React.useState(false)

  // Sync state if initialCategories prop updates from server action
  const [prevInitial, setPrevInitial] = React.useState(initialCategories)
  if (prevInitial !== initialCategories) {
    setPrevInitial(initialCategories)
    setCategories(initialCategories)
  }

  // Filtered categories
  const filteredCategories = React.useMemo(() => {
    return categories.filter((cat) => {
      // Visibility filter
      if (visibilityFilter === "visible" && !cat.is_active) return false
      if (visibilityFilter === "hidden" && cat.is_active) return false

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        const matchesName = cat.name.toLowerCase().includes(query)
        const matchesSlug = cat.slug.toLowerCase().includes(query)
        const matchesDesc = (cat.description || "").toLowerCase().includes(query)
        return matchesName || matchesSlug || matchesDesc
      }

      return true
    })
  }, [categories, visibilityFilter, searchQuery])

  // Next suggested sort number for new category
  const nextSuggestedSort = React.useMemo(() => {
    if (categories.length === 0) return 1
    const maxSort = Math.max(...categories.map((c) => c.sort || 0))
    return maxSort + 1
  }, [categories])

  const handleAddCategory = () => {
    setCategoryToEdit(null)
    setIsFormOpen(true)
  }

  const handleEditCategory = (category: AdminCategoryItem) => {
    setCategoryToEdit(category)
    setIsFormOpen(true)
  }

  const handleDeleteCategory = (category: AdminCategoryItem) => {
    setCategoryToDelete(category)
    setIsDeleteOpen(true)
  }

  const handleToggleActive = async (category: AdminCategoryItem) => {
    const nextActive = !category.is_active

    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, is_active: nextActive } : c))
    )

    try {
      const res = await toggleCategoryActiveAction(category.id, nextActive)
      if (!res.success) {
        // Rollback
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? { ...c, is_active: category.is_active } : c))
        )
      } else {
        router.refresh()
      }
    } catch {
      // Rollback
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, is_active: category.is_active } : c))
      )
    }
  }

  const handleMoveUp = async (filteredIndex: number) => {
    if (filteredIndex <= 0 || isReordering) return

    const itemA = filteredCategories[filteredIndex]
    const itemB = filteredCategories[filteredIndex - 1]

    await swapCategories(itemA, itemB)
  }

  const handleMoveDown = async (filteredIndex: number) => {
    if (filteredIndex >= filteredCategories.length - 1 || isReordering) return

    const itemA = filteredCategories[filteredIndex]
    const itemB = filteredCategories[filteredIndex + 1]

    await swapCategories(itemA, itemB)
  }

  const swapCategories = async (itemA: AdminCategoryItem, itemB: AdminCategoryItem) => {
    setIsReordering(true)

    // Calculate new sort values
    const sortA = itemB.sort
    const sortB = itemA.sort === itemB.sort ? itemB.sort + 1 : itemA.sort

    // Optimistic update
    setCategories((prev) => {
      const next = prev.map((c) => {
        if (c.id === itemA.id) return { ...c, sort: sortA }
        if (c.id === itemB.id) return { ...c, sort: sortB }
        return c
      })
      return next.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    })

    try {
      await reorderCategoriesAction([
        { id: itemA.id, sort: sortA },
        { id: itemB.id, sort: sortB },
      ])
      router.refresh()
    } catch (err) {
      console.error("Reorder failed:", err)
    } finally {
      setIsReordering(false)
    }
  }

  const handleFormSuccess = () => {
    router.refresh()
  }

  const handleDeleteSuccess = () => {
    if (categoryToDelete) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id))
    }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <CategoriesToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        visibilityFilter={visibilityFilter}
        onVisibilityFilterChange={setVisibilityFilter}
        totalCount={categories.length}
        onAddCategory={handleAddCategory}
      />

      <CategoriesTable
        categories={filteredCategories}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
        onToggleActive={handleToggleActive}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        isReordering={isReordering}
      />

      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        categoryToEdit={categoryToEdit}
        nextSuggestedSort={nextSuggestedSort}
      />

      <CategoryDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={handleDeleteSuccess}
        category={categoryToDelete}
      />
    </div>
  )
}
