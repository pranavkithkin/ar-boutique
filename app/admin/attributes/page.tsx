import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import {
  getAdminColoursList,
  getAdminSizesList,
} from "@/features/admin/attributes/actions"
import { AttributesClientContainer } from "@/features/admin/attributes/components/AttributesClientContainer"

export const metadata: Metadata = {
  title: "Colours & Sizes Management | AR Boutique Admin",
  description: "Manage boutique garment colourways, hex swatches, and sizing standards.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminAttributesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const [colours, sizes] = await Promise.all([
    getAdminColoursList(),
    getAdminSizesList(),
  ])

  return (
    <AppShell>
      <AttributesClientContainer
        initialColours={colours}
        initialSizes={sizes}
      />
    </AppShell>
  )
}
