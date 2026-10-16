"use client"

import * as React from "react"
import Image from "next/image"
import {
  uploadProductImageAction,
  deleteProductImageAction,
  setMainProductImageAction,
} from "../actions"
import {
  Trash2,
  Loader2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Star,
} from "lucide-react"

interface ColourwayImageManagerProps {
  productId: string
  productColourId: string
  colourName: string
  images: Array<{
    id: string
    media_key: string
    alt: string
    sort: number
    url: string
  }>
  onImagesChanged: () => void
}

export function ColourwayImageManager({
  productId,
  productColourId,
  colourName,
  images,
  onImagesChanged,
}: ColourwayImageManagerProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [deletingImageId, setDeletingImageId] = React.useState<string | null>(null)
  const [settingMainId, setSettingMainId] = React.useState<string | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorMsg(null)
    setSuccessMsg(null)

    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)

    try {
      let uploadedCount = 0
      let lastError: string | null = null

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.type.startsWith("image/")) {
          lastError = "Please select valid image files (JPG, PNG, WEBP)."
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          lastError = "File size cannot exceed 10MB."
          continue
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("productId", productId)
        formData.append("productColourId", productColourId)
        formData.append(
          "alt",
          `${colourName} - Photo ${images.length + uploadedCount + 1}`
        )

        const res = await uploadProductImageAction(formData)
        if (res.success) {
          uploadedCount++
        } else {
          lastError = res.error || "Failed to upload image."
        }
      }

      if (lastError && uploadedCount === 0) {
        setErrorMsg(lastError)
      } else if (uploadedCount > 0) {
        setSuccessMsg(
          uploadedCount === 1
            ? "Image uploaded successfully!"
            : `${uploadedCount} images uploaded successfully!`
        )
        setTimeout(() => setSuccessMsg(null), 3000)
        onImagesChanged()
      }
    } catch {
      setErrorMsg("An unexpected error occurred during upload.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function handleSetMain(imgId: string) {
    setSettingMainId(imgId)
    setErrorMsg(null)

    try {
      const res = await setMainProductImageAction({
        imageId: imgId,
        productColourId,
        productId,
      })

      if (!res.success) {
        setErrorMsg(res.error || "Failed to set main image.")
        setSettingMainId(null)
        return
      }

      setSuccessMsg("Main display photo updated!")
      setTimeout(() => setSuccessMsg(null), 3000)
      onImagesChanged()
    } catch {
      setErrorMsg("An error occurred while setting the main image.")
    } finally {
      setSettingMainId(null)
    }
  }

  async function handleDeleteImage(imgId: string, mediaKey: string) {
    if (!confirm("Are you sure you want to remove this image from the product?")) {
      return
    }

    setDeletingImageId(imgId)
    setErrorMsg(null)

    try {
      const res = await deleteProductImageAction({
        imageId: imgId,
        mediaKey,
        productId,
      })

      if (!res.success) {
        setErrorMsg(res.error || "Failed to remove image.")
        setDeletingImageId(null)
        return
      }

      onImagesChanged()
    } catch {
      setErrorMsg("An error occurred while deleting the image.")
    } finally {
      setDeletingImageId(null)
    }
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Messages */}
      {errorMsg && (
        <div className="p-2.5 text-xs bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-1.5 rounded-none">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 rounded-none">
          <CheckCircle2 className="size-3.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {images.map((img, index) => {
          const isDeleting = deletingImageId === img.id
          const isSettingMain = settingMainId === img.id
          const isMain = index === 0

          return (
            <div
              key={img.id}
              className={`group flex flex-col bg-card border transition-all overflow-hidden ${
                isMain
                  ? "border-primary ring-1 ring-primary/40 shadow-sm"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              {/* Image Box */}
              <div className="relative aspect-[3/4] w-full bg-muted/30 overflow-hidden">
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 180px"
                  className="object-cover"
                  unoptimized
                />

                {/* Top overlay: Position indicator on left, Delete button on right */}
                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-background/90 text-foreground border border-border/80 shadow-xs">
                    #{index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id, img.media_key)}
                    disabled={isDeleting || isSettingMain}
                    className="size-6 bg-destructive/90 hover:bg-destructive text-destructive-foreground flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                    title="Delete image"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Trash2 className="size-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Dedicated Bottom Bar: "Set Main" Button or "Main Image" Badge */}
              {isMain ? (
                <div className="w-full py-1.5 px-2 bg-primary text-primary-foreground text-[10px] font-sans font-medium uppercase tracking-wider text-center flex items-center justify-center gap-1.5 select-none">
                  <Star className="size-3 fill-current" />
                  <span>Main Image</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetMain(img.id)}
                  disabled={isSettingMain || isDeleting}
                  className="w-full py-1.5 px-2 bg-muted/50 hover:bg-primary hover:text-primary-foreground text-foreground text-[10px] font-sans font-medium uppercase tracking-wider border-t border-border flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Set as main display photo"
                >
                  {isSettingMain ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      <span>Setting...</span>
                    </>
                  ) : (
                    <>
                      <Star className="size-3 text-amber-500 fill-amber-500/20" />
                      <span>Set Main</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}

        {/* Add Photo Card */}
        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border text-muted-foreground p-3 bg-muted/10 min-h-[180px]">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-xs font-sans tracking-wide">Uploading...</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-foreground/60 transition-colors text-muted-foreground hover:text-foreground p-3 bg-muted/10 group cursor-pointer min-h-[180px]"
          >
            <div className="size-8 rounded-none border border-border flex items-center justify-center group-hover:bg-muted/50 transition-colors">
              <Plus className="size-4" />
            </div>
            <span className="text-xs font-sans tracking-wide">Add Photo</span>
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        multiple
        onChange={handleFileSelect}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}
