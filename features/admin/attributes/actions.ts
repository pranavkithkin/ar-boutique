"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import {
  AdminColourItem,
  AdminSizeItem,
  ColourFormValues,
  SizeFormValues,
} from "./types"
import { colourSchema, sizeSchema } from "./schemas"

/**
 * Fetch all colours with their usage count across product colourways.
 */
export async function getAdminColoursList(): Promise<AdminColourItem[]> {
  const supabase = createAdminClient()

  const { data: colours, error: coloursError } = await supabase
    .from("colours")
    .select(`
      id,
      name,
      slug,
      swatch_hex,
      sort,
      is_active,
      created_at,
      updated_at
    `)
    .order("sort", { ascending: true })
    .order("name", { ascending: true })

  if (coloursError || !colours) {
    console.error("Failed to fetch admin colours:", coloursError)
    return []
  }

  // Get product_colours usage counts per colour_id
  const { data: usageData, error: usageError } = await supabase
    .from("product_colours")
    .select("colour_id")

  if (usageError) {
    console.error("Failed to fetch colour usage counts:", usageError)
  }

  const usageCounts = new Map<string, number>()
  if (usageData) {
    for (const row of usageData) {
      if (row.colour_id) {
        usageCounts.set(row.colour_id, (usageCounts.get(row.colour_id) || 0) + 1)
      }
    }
  }

  return colours.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    swatch_hex: c.swatch_hex,
    sort: c.sort ?? 0,
    is_active: c.is_active ?? true,
    usage_count: usageCounts.get(c.id) || 0,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }))
}

/**
 * Fetch all sizes with their usage count across product variants.
 */
export async function getAdminSizesList(): Promise<AdminSizeItem[]> {
  const supabase = createAdminClient()

  const { data: sizes, error: sizesError } = await supabase
    .from("sizes")
    .select(`
      id,
      label,
      sort,
      is_active,
      created_at,
      updated_at
    `)
    .order("sort", { ascending: true })

  if (sizesError || !sizes) {
    console.error("Failed to fetch admin sizes:", sizesError)
    return []
  }

  // Get product_variants usage counts per size_id
  const { data: usageData, error: usageError } = await supabase
    .from("product_variants")
    .select("size_id")

  if (usageError) {
    console.error("Failed to fetch size usage counts:", usageError)
  }

  const usageCounts = new Map<string, number>()
  if (usageData) {
    for (const row of usageData) {
      if (row.size_id) {
        usageCounts.set(row.size_id, (usageCounts.get(row.size_id) || 0) + 1)
      }
    }
  }

  return sizes.map((s) => ({
    id: s.id,
    label: s.label,
    sort: s.sort ?? 0,
    is_active: s.is_active ?? true,
    usage_count: usageCounts.get(s.id) || 0,
    created_at: s.created_at,
    updated_at: s.updated_at,
  }))
}

/**
 * Create a new colour.
 */
export async function createColourAction(
  input: ColourFormValues
): Promise<{ success: boolean; colourId?: string; error?: string }> {
  const parsed = colourSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input data",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()

  // Auto-generate slug from colour name
  const baseSlug =
    parsed.data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "colour"

  let slug = baseSlug
  const { data: existingSlug } = await adminClient
    .from("colours")
    .select("id")
    .ilike("slug", baseSlug)
    .maybeSingle()

  if (existingSlug) {
    slug = `${baseSlug}-${Date.now().toString().slice(-4)}`
  }

  const { data, error } = await adminClient
    .from("colours")
    .insert({
      name: parsed.data.name,
      slug,
      swatch_hex: parsed.data.swatch_hex || null,
      sort: 0,
      is_active: parsed.data.is_active,
    })
    .select("id")
    .single()

  if (error || !data) {
    console.error("Failed to create colour:", error)
    return { success: false, error: error?.message || "Failed to create colour" }
  }

  revalidatePath("/admin/attributes")
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true, colourId: data.id }
}

/**
 * Update an existing colour.
 */
export async function updateColourAction(
  id: string,
  input: ColourFormValues
): Promise<{ success: boolean; error?: string }> {
  const parsed = colourSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input data",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from("colours")
    .update({
      name: parsed.data.name,
      swatch_hex: parsed.data.swatch_hex || null,
      is_active: parsed.data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Failed to update colour:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/attributes")
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true }
}

/**
 * Toggle colour active status.
 */
export async function toggleColourActiveAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from("colours")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Failed to toggle colour active state:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/attributes")
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true }
}

/**
 * Reorder colours by updated array of IDs.
 */
export async function reorderColoursAction(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()

  // Update sort order sequentially
  const promises = orderedIds.map((id, index) =>
    adminClient.from("colours").update({ sort: index + 1 }).eq("id", id)
  )

  const results = await Promise.all(promises)
  const failed = results.find((r) => r.error)

  if (failed?.error) {
    console.error("Failed to reorder colours:", failed.error)
    return { success: false, error: failed.error.message }
  }

  revalidatePath("/admin/attributes")
  revalidatePath("/admin/products")
  return { success: true }
}

/**
 * Delete a colour with strict usage guard.
 */
export async function deleteColourAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()

  // Guard: check if referenced in product_colours
  const { count, error: countError } = await adminClient
    .from("product_colours")
    .select("id", { count: "exact", head: true })
    .eq("colour_id", id)

  if (countError) {
    console.error("Failed to check colour references:", countError)
    return { success: false, error: "Database error checking colour usage" }
  }

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete colour: it is currently used by ${count} product colourway(s). You can hide it instead by turning off the Active switch.`,
    }
  }

  const { error } = await adminClient.from("colours").delete().eq("id", id)

  if (error) {
    console.error("Failed to delete colour:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/attributes")
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true }
}

/**
 * Create a new size.
 */
export async function createSizeAction(
  input: SizeFormValues
): Promise<{ success: boolean; sizeId?: string; error?: string }> {
  const parsed = sizeSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input data",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()

  // Check unique label ignoring case
  const { data: existingLabel } = await adminClient
    .from("sizes")
    .select("id")
    .ilike("label", parsed.data.label)
    .maybeSingle()

  if (existingLabel) {
    return {
      success: false,
      error: `A size with label "${parsed.data.label}" already exists.`,
    }
  }

  const { data, error } = await adminClient
    .from("sizes")
    .insert({
      label: parsed.data.label,
      sort: parsed.data.sort,
      is_active: parsed.data.is_active,
    })
    .select("id")
    .single()

  if (error || !data) {
    console.error("Failed to create size:", error)
    return { success: false, error: error?.message || "Failed to create size" }
  }

  revalidatePath("/admin/attributes")
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true, sizeId: data.id }
}

/**
 * Update an existing size.
 */
export async function updateSizeAction(
  id: string,
  input: SizeFormValues
): Promise<{ success: boolean; error?: string }> {
  const parsed = sizeSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input data",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()

  // Check unique label ignoring case (excluding self)
  const { data: existingLabel } = await adminClient
    .from("sizes")
    .select("id")
    .ilike("label", parsed.data.label)
    .neq("id", id)
    .maybeSingle()

  if (existingLabel) {
    return {
      success: false,
      error: `A size with label "${parsed.data.label}" already exists.`,
    }
  }

  const { error } = await adminClient
    .from("sizes")
    .update({
      label: parsed.data.label,
      sort: parsed.data.sort,
      is_active: parsed.data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Failed to update size:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/attributes")
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true }
}

/**
 * Toggle size active status.
 */
export async function toggleSizeActiveAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from("sizes")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Failed to toggle size active state:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/attributes")
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true }
}

/**
 * Reorder sizes by updated array of IDs.
 */
export async function reorderSizesAction(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()

  const promises = orderedIds.map((id, index) =>
    adminClient.from("sizes").update({ sort: index + 1 }).eq("id", id)
  )

  const results = await Promise.all(promises)
  const failed = results.find((r) => r.error)

  if (failed?.error) {
    console.error("Failed to reorder sizes:", failed.error)
    return { success: false, error: failed.error.message }
  }

  revalidatePath("/admin/attributes")
  revalidatePath("/admin/products")
  return { success: true }
}

/**
 * Delete a size with strict usage guard.
 */
export async function deleteSizeAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()

  // Guard: check if referenced in product_variants
  const { count, error: countError } = await adminClient
    .from("product_variants")
    .select("id", { count: "exact", head: true })
    .eq("size_id", id)

  if (countError) {
    console.error("Failed to check size references:", countError)
    return { success: false, error: "Database error checking size usage" }
  }

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete size: it is currently used by ${count} variant(s). You can hide it instead by turning off the Active switch.`,
    }
  }

  const { error } = await adminClient.from("sizes").delete().eq("id", id)

  if (error) {
    console.error("Failed to delete size:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/attributes")
  revalidatePath("/admin/products")
  revalidatePath("/collections")
  return { success: true }
}
