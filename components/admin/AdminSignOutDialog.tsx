"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { logoutAdminAction } from "@/features/admin/actions"
import { LogOut, AlertTriangle, Loader2 } from "lucide-react"

interface AdminSignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminSignOutDialog({
  open,
  onOpenChange,
}: AdminSignOutDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const handleConfirmSignOut = () => {
    startTransition(async () => {
      try {
        await logoutAdminAction()
        onOpenChange(false)
        router.push("/admin/login")
        router.refresh()
      } catch (err) {
        console.error("Failed to sign out:", err)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-none space-y-4 font-sans">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1 pt-0.5">
            <DialogTitle className="font-sans text-base font-semibold text-foreground tracking-tight">
              Sign out of AR Boutique Admin?
            </DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground leading-relaxed">
              You will be signed out of your staff session. Any unsaved edits will be lost, and you will need to re-authenticate with your staff credentials.
            </DialogDescription>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2 pt-2 border-t border-border sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-none h-9 text-xs px-4 font-sans font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirmSignOut}
            disabled={isPending}
            className="rounded-none h-9 text-xs px-4 font-sans font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
