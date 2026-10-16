"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"
import { logoutAdminAction } from "../actions"

export function AdminSignOutButton() {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await logoutAdminAction()
      router.push("/admin/login")
      router.refresh()
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleSignOut}
      className="rounded-none border-border h-8 text-xs font-sans tracking-wide gap-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
      <span>Sign Out</span>
    </Button>
  )
}
