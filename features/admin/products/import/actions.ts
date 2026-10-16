"use server"

import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { parseStockSheetBuffer, ParsedSheetRow } from "@/lib/sheets/reader"
import { ImportPreviewSummary, ImportRowDiff, ImportRowAction } from "./types"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function previewStockSheetAction(
  formData: FormData
): Promise<{ success: boolean; preview?: ImportPreviewSummary; error?: string }> {
  try {
    const file = formData.get("file") as File | null
    if (!file) {
      return { success: false, error: "No spreadsheet file uploaded." }
    }

    const fileName = file.name
    const isXlsx = fileName.toLowerCase().endsWith(".xlsx")
    const isCsv = fileName.toLowerCase().endsWith(".csv")
    if (!isXlsx && !isCsv) {
      return {
        success: false,
        error: "Invalid file format. Please upload an Excel (.xlsx) or CSV (.csv) stock sheet.",
      }
    }

    // Maximum 5 MB limit (per ARCHITECTURE.md)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File exceeds maximum size limit of 5 MB." }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileSha256 = crypto.createHash("sha256").update(buffer).digest("hex")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const actorId = user?.id || "f93c1910-4399-41d2-88ac-e8d0bd43f0e7"

    const adminDb = createAdminClient()

    // Parse the spreadsheet
    const parseResult = await parseStockSheetBuffer(buffer, fileName)
    if (parseResult.errors.length > 0) {
      return { success: false, error: parseResult.errors.join("; ") }
    }

    if (parseResult.rows.length === 0) {
      return { success: false, error: "No data rows found in the uploaded sheet." }
    }

    // Query current catalogue data from database
    const [
      { data: dbProducts },
      { data: dbColourways },
      { data: dbVariants },
      { data: dbColours },
      { data: dbSizes },
      { data: dbCategories },
    ] = await Promise.all([
      adminDb.from("products").select("id, name, slug, product_group"),
      adminDb.from("product_colours").select("id, product_id, colour_id, style_code, details, colours(name)"),
      adminDb.from("product_variants").select("id, sku, product_colour_id, size_id, price_fils, compare_at_fils, sizes(label), stock_levels(on_hand, reserved)"),
      adminDb.from("colours").select("id, name"),
      adminDb.from("sizes").select("id, label, sort"),
      adminDb.from("categories").select("id, name"),
    ])

    const products = (dbProducts || []) as any[]
    const colourways = (dbColourways || []) as any[]
    const variants = (dbVariants || []) as any[]

    const diffs: ImportRowDiff[] = []
    let productsToCreate = 0
    let colourwaysToCreate = 0
    let variantsToCreate = 0
    let variantsToUpdate = 0
    let unchangedRows = 0

    // Sets to prevent double counting in preview summary
    const newProductStylesSeen = new Set<string>()
    const newColourwayKeysSeen = new Set<string>()
    const seenSkusInFile = new Map<string, number>() // sku (lowercase) -> rowNumber

    for (const row of parseResult.rows) {
      const rowErrors: string[] = []
      const rowWarnings: string[] = []

      // Mandatory row validations (ARCHITECTURE.md ADR-032)
      if (!row.sku) {
        rowErrors.push("SKU is required.")
      }
      if (!row.style) {
        rowErrors.push("Style code is required.")
      }
      if (row.sellingPriceAED === null || row.sellingPriceAED <= 0) {
        rowErrors.push("A valid Selling Price in AED is required.")
      }

      // Check duplicate SKUs inside the uploaded file
      const lowerSku = row.sku.toLowerCase()
      if (seenSkusInFile.has(lowerSku)) {
        rowErrors.push(
          `Duplicate SKU "${row.sku}" found in sheet (first seen on row ${seenSkusInFile.get(lowerSku)}).`
        )
      } else if (row.sku) {
        seenSkusInFile.set(lowerSku, row.rowNumber)
      }

      // Match against existing database variants
      const existingVariant = variants.find(
        (v) => (v.sku || "").toLowerCase() === lowerSku
      )

      let action: ImportRowAction = "unchanged"
      let actionLabel = "Unchanged"
      let isNewProduct = false
      let isNewColourway = false
      let isNewVariant = false
      let stockBefore: number | null = null
      let stockAfter: number | null = null
      let stockDelta: number | null = null
      let priceFilsBefore: number | null = null
      let priceFilsAfter: number | null = null

      if (row.sellingPriceAED !== null) {
        priceFilsAfter = Math.round(row.sellingPriceAED * 100)
      }

      if (existingVariant) {
        // Variant already exists in database
        const currentStock = existingVariant.stock_levels?.on_hand ?? 0
        const currentReserved = existingVariant.stock_levels?.reserved ?? 0
        stockBefore = currentStock
        priceFilsBefore = existingVariant.price_fils

        const targetStock = row.stock !== null ? row.stock : currentStock
        stockAfter = targetStock
        stockDelta = targetStock - currentStock

        if (targetStock < currentReserved) {
          rowErrors.push(
            `Target stock (${targetStock}) cannot be lower than held reserved units (${currentReserved}).`
          )
        }

        const priceChanged =
          priceFilsAfter !== null && priceFilsAfter !== priceFilsBefore
        const stockChanged = stockDelta !== 0

        if (priceChanged || stockChanged) {
          action = "update_variant"
          actionLabel = stockChanged
            ? `Update Stock (${stockDelta > 0 ? `+${stockDelta}` : stockDelta})`
            : "Update Price"
          variantsToUpdate++
        } else {
          action = "unchanged"
          actionLabel = "No changes"
          unchangedRows++
        }
      } else {
        // Variant does not exist in DB: Needs to be created
        isNewVariant = true
        variantsToCreate++
        stockBefore = 0
        stockAfter = row.stock !== null ? row.stock : 5
        stockDelta = stockAfter

        // Check if parent product exists by Style Code
        const existingProduct = products.find((p) => {
          // Check if style code exists in this product's colourways
          return colourways.some(
            (cw) =>
              cw.product_id === p.id &&
              (cw.style_code || "").toLowerCase() === row.style.toLowerCase()
          )
        })

        if (!existingProduct) {
          // Product does not exist
          isNewProduct = true
          isNewColourway = true
          action = "create_product"
          actionLabel = "Create Product & SKU"

          if (!newProductStylesSeen.has(row.style.toLowerCase())) {
            newProductStylesSeen.add(row.style.toLowerCase())
            productsToCreate++
            colourwaysToCreate++
          }
        } else {
          // Product exists! Check if colourway exists for this product
          const existingColourway = colourways.find((cw) => {
            const matchesProduct = cw.product_id === existingProduct.id
            const matchesStyle =
              (cw.style_code || "").toLowerCase() === row.style.toLowerCase()
            const matchesColour =
              (cw.colours?.name || "").toLowerCase() ===
              row.colourName.toLowerCase()
            return matchesProduct && matchesStyle && matchesColour
          })

          if (!existingColourway) {
            // New colourway under existing product
            isNewColourway = true
            action = "create_colourway"
            actionLabel = "Add Colourway & SKU"

            const cwKey = `${existingProduct.id}-${row.colourName.toLowerCase()}`
            if (!newColourwayKeysSeen.has(cwKey)) {
              newColourwayKeysSeen.add(cwKey)
              colourwaysToCreate++
            }
          } else {
            // Adding a new size variant to an existing colourway
            action = "create_variant"
            actionLabel = "Add Variant SKU"
          }
        }
      }

      if (rowErrors.length > 0) {
        action = "error"
        actionLabel = "Validation Error"
      }

      diffs.push({
        rowNumber: row.rowNumber,
        sku: row.sku,
        style: row.style,
        productName:
          row.productName ||
          row.rawValues["Top Category"] ||
          `Style ${row.style}`,
        colourName: row.colourName,
        sizeLabel: row.sizeLabel,
        action,
        actionLabel,
        stockBefore,
        stockAfter,
        stockDelta,
        priceFilsBefore,
        priceFilsAfter,
        isNewProduct,
        isNewColourway,
        isNewVariant,
        errors: rowErrors,
        warnings: rowWarnings,
      })
    }

    const totalErrors = diffs.reduce((acc, d) => acc + d.errors.length, 0)
    const totalWarnings = diffs.reduce((acc, d) => acc + d.warnings.length, 0)

    // Save record in catalogue_imports
    const counts = {
      totalRows: parseResult.rows.length,
      productsToCreate,
      colourwaysToCreate,
      variantsToCreate,
      variantsToUpdate,
      unchangedRows,
    }

    const { data: importRecord, error: insertErr } = await adminDb
      .from("catalogue_imports")
      .insert({
        file_name: fileName,
        file_sha256: fileSha256,
        admin_user_id: actorId,
        status: "previewed",
        parsed_rows: parseResult.rows as any,
        counts,
        errors: diffs.filter((d) => d.errors.length > 0) as any,
        warnings: diffs.filter((d) => d.warnings.length > 0) as any,
      })
      .select("id")
      .single()

    if (insertErr || !importRecord) {
      console.error("Failed to save catalogue_imports record:", insertErr)
      return {
        success: false,
        error: insertErr?.message || "Failed to save import preview session.",
      }
    }

    const summary: ImportPreviewSummary = {
      importId: importRecord.id,
      fileName,
      totalRows: parseResult.rows.length,
      productsToCreate,
      colourwaysToCreate,
      variantsToCreate,
      variantsToUpdate,
      unchangedRows,
      errorCount: totalErrors,
      warningCount: totalWarnings,
      unrecognizedColumns: parseResult.unrecognizedColumns,
      diffs,
      canApply: totalErrors === 0,
    }

    return { success: true, preview: summary }
  } catch (err: any) {
    console.error("Stock sheet preview error:", err)
    return {
      success: false,
      error: err.message || "An error occurred while parsing the stock sheet.",
    }
  }
}

/**
 * Apply a previously previewed catalogue import.
 */
export async function applyStockSheetAction(importId: string): Promise<{
  success: boolean
  createdProducts?: number
  createdVariants?: number
  updatedVariants?: number
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const actorId = user?.id || "f93c1910-4399-41d2-88ac-e8d0bd43f0e7"

    const adminDb = createAdminClient()

    // 1. Fetch import session
    const { data: importSession, error: sessionErr } = await adminDb
      .from("catalogue_imports")
      .select("*")
      .eq("id", importId)
      .single()

    if (sessionErr || !importSession) {
      return { success: false, error: "Import preview session not found." }
    }

    if (importSession.status === "applied") {
      return { success: false, error: "This import has already been applied." }
    }

    const rows = (importSession.parsed_rows || []) as ParsedSheetRow[]
    if (rows.length === 0) {
      return { success: false, error: "No rows found in this import session." }
    }

    // 2. Fetch current DB state
    const [
      { data: dbProducts },
      { data: dbColourways },
      { data: dbVariants },
      { data: dbColours },
      { data: dbSizes },
      { data: dbCategories },
    ] = await Promise.all([
      adminDb.from("products").select("id, name, slug, product_group"),
      adminDb.from("product_colours").select("id, product_id, colour_id, style_code, details, colours(name)"),
      adminDb.from("product_variants").select("id, sku, product_colour_id, size_id, price_fils, compare_at_fils, stock_levels(on_hand, reserved)"),
      adminDb.from("colours").select("id, name"),
      adminDb.from("sizes").select("id, label, sort"),
      adminDb.from("categories").select("id, name"),
    ])

    const coloursList = (dbColours || []) as any[]
    const sizesList = (dbSizes || []) as any[]
    const categoriesList = (dbCategories || []) as any[]
    const productsList = (dbProducts || []) as any[]
    const colourwaysList = (dbColourways || []) as any[]
    const variantsList = (dbVariants || []) as any[]

    let createdProducts = 0
    let createdVariants = 0
    let updatedVariants = 0

    // Helper: get or create colour
    async function getOrCreateColour(colourName: string): Promise<string> {
      const existing = coloursList.find(
        (c) => c.name.toLowerCase() === colourName.toLowerCase()
      )
      if (existing) return existing.id

      const { data: newColour, error } = await adminDb
        .from("colours")
        .insert({ name: colourName, slug: slugify(colourName) })
        .select("id, name")
        .single()

      if (error || !newColour) {
        throw new Error(`Failed to create colour ${colourName}: ${error?.message}`)
      }
      coloursList.push(newColour)
      return newColour.id
    }

    // Helper: get or create size
    async function getOrCreateSize(sizeLabel: string | null): Promise<string | null> {
      if (!sizeLabel) return null
      const existing = sizesList.find(
        (s) => s.label.toLowerCase() === sizeLabel.toLowerCase()
      )
      if (existing) return existing.id

      const sortOrder =
        sizeLabel.toUpperCase() === "XS"
          ? 0
          : sizeLabel.toUpperCase() === "S"
          ? 1
          : sizeLabel.toUpperCase() === "M"
          ? 2
          : sizeLabel.toUpperCase() === "L"
          ? 3
          : sizeLabel.toUpperCase() === "XL"
          ? 4
          : sizeLabel.toUpperCase() === "XXL"
          ? 5
          : 10

      const { data: newSize, error } = await adminDb
        .from("sizes")
        .insert({ label: sizeLabel, sort: sortOrder })
        .select("id, label, sort")
        .single()

      if (error || !newSize) {
        throw new Error(`Failed to create size ${sizeLabel}: ${error?.message}`)
      }
      sizesList.push(newSize)
      return newSize.id
    }

    // Helper: get or create category
    async function getOrCreateCategory(catName: string | null): Promise<string | null> {
      if (!catName) return null
      const existing = categoriesList.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      )
      if (existing) return existing.id

      const { data: newCat, error } = await adminDb
        .from("categories")
        .insert({ name: catName, slug: slugify(catName) })
        .select("id, name")
        .single()

      if (error || !newCat) {
        return null
      }
      categoriesList.push(newCat)
      return newCat.id
    }

    // Process all rows
    for (const row of rows) {
      if (!row.sku || !row.style) continue

      const lowerSku = row.sku.toLowerCase()
      const existingVariant = variantsList.find(
        (v) => (v.sku || "").toLowerCase() === lowerSku
      )

      const priceFils = row.sellingPriceAED !== null ? Math.round(row.sellingPriceAED * 100) : 0
      const compareAtFils =
        row.compareAtPriceAED !== null ? Math.round(row.compareAtPriceAED * 100) : null
      const targetStock = row.stock !== null ? row.stock : 5

      if (existingVariant) {
        // 1. Update existing variant SKU
        const currentStock = existingVariant.stock_levels?.on_hand ?? 0
        const reserved = existingVariant.stock_levels?.reserved ?? 0

        const { error: variantUpdateErr } = await adminDb
          .from("product_variants")
          .update({
            price_fils: priceFils > 0 ? priceFils : existingVariant.price_fils,
            compare_at_fils: compareAtFils,
          })
          .eq("id", existingVariant.id)

        if (variantUpdateErr) {
          console.error("Failed to update variant price:", variantUpdateErr)
        }

        // Update stock levels
        if (row.stock !== null && targetStock !== currentStock) {
          await adminDb.from("stock_levels").upsert({
            variant_id: existingVariant.id,
            on_hand: targetStock,
            reserved,
            updated_at: new Date().toISOString(),
          })

          const delta = targetStock - currentStock
          await adminDb.from("inventory_adjustments").insert({
            variant_id: existingVariant.id,
            delta,
            on_hand_before: currentStock,
            on_hand_after: targetStock,
            reason: "stock sheet upload",
            note: `Stock sheet import ${importSession.file_name}`,
            import_id: importId,
            actor_sub: actorId,
          })
        }

        updatedVariants++
      } else {
        // 2. Variant is new: Resolve Product -> Colourway -> Variant
        let productId: string
        const parentProduct = productsList.find((p) => {
          return colourwaysList.some(
            (cw) =>
              cw.product_id === p.id &&
              (cw.style_code || "").toLowerCase() === row.style.toLowerCase()
          )
        })

        if (!parentProduct) {
          // Create new Product
          const categoryId = await getOrCreateCategory(row.categoryName || row.rawValues["Top Category"] || null)
          const baseName =
            row.productName ||
            row.rawValues["Top Category"] ||
            `Style ${row.style}`
          const slug = `${slugify(baseName)}-${row.style.toLowerCase()}`

          const { data: newProd, error: prodErr } = await adminDb
            .from("products")
            .insert({
              name: baseName,
              slug,
              description: row.description || null,
              category_id: categoryId,
              product_group: row.productGroup || null,
              status: "draft", // New products land as Draft (ARCHITECTURE.md)
              is_final_sale: false,
            })
            .select("id, name, slug, product_group")
            .single()

          if (prodErr || !newProd) {
            throw new Error(`Failed to create product for style ${row.style}: ${prodErr?.message}`)
          }

          productsList.push(newProd)
          productId = newProd.id
          createdProducts++
        } else {
          productId = parentProduct.id
        }

        // Resolve Colourway
        const colourId = await getOrCreateColour(row.colourName)
        let colourway = colourwaysList.find(
          (cw) =>
            cw.product_id === productId &&
            (cw.style_code || "").toLowerCase() === row.style.toLowerCase() &&
            cw.colour_id === colourId
        )

        if (!colourway) {
          // Create new Colourway
          const { data: newCw, error: cwErr } = await adminDb
            .from("product_colours")
            .insert({
              product_id: productId,
              colour_id: colourId,
              style_code: row.style,
              details: row.details || {},
              is_active: true,
              sort: 0,
            })
            .select("id, product_id, colour_id, style_code, details")
            .single()

          if (cwErr || !newCw) {
            throw new Error(`Failed to create colourway for style ${row.style}: ${cwErr?.message}`)
          }
          colourwaysList.push(newCw)
          colourway = newCw
        }

        // Resolve Size
        const sizeId = await getOrCreateSize(row.sizeLabel)

        // Insert new Variant SKU
        const { data: newVar, error: varErr } = await adminDb
          .from("product_variants")
          .insert({
            product_colour_id: colourway.id,
            sku: row.sku,
            size_id: sizeId,
            price_fils: priceFils,
            compare_at_fils: compareAtFils,
            is_active: true,
          })
          .select("id, sku")
          .single()

        if (varErr || !newVar) {
          throw new Error(`Failed to create variant ${row.sku}: ${varErr?.message}`)
        }

        // Initialize stock level
        await adminDb.from("stock_levels").insert({
          variant_id: newVar.id,
          on_hand: targetStock,
          reserved: 0,
          updated_at: new Date().toISOString(),
        })

        // Ledger row
        await adminDb.from("inventory_adjustments").insert({
          variant_id: newVar.id,
          delta: targetStock,
          on_hand_before: 0,
          on_hand_after: targetStock,
          reason: "stock sheet upload",
          note: `Initial stock from import ${importSession.file_name}`,
          import_id: importId,
          actor_sub: actorId,
        })

        variantsList.push(newVar)
        createdVariants++
      }
    }

    // 3. Mark import session as applied
    await adminDb
      .from("catalogue_imports")
      .update({
        status: "applied",
        applied_at: new Date().toISOString(),
      })
      .eq("id", importId)

    revalidatePath("/admin/products")
    revalidatePath("/admin/stock")

    return {
      success: true,
      createdProducts,
      createdVariants,
      updatedVariants,
    }
  } catch (err: any) {
    console.error("Apply stock sheet error:", err)
    return {
      success: false,
      error: err.message || "Failed to apply stock sheet import.",
    }
  }
}
