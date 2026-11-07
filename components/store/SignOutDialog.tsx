"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2, AlertCircle } from "lucide-react"
import { logoutCustomerAction } from "@/features/auth/actions"

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SignOutDialog({ open, onOpenChange, onSuccess }: SignOutDialogProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSigningOut(true)
    try {
      // 1. Sign out from Clerk if active
      if (typeof window !== "undefined" && (window as unknown as { Clerk?: { signOut: () => Promise<void> } }).Clerk) {
        try {
          await (window as unknown as { Clerk: { signOut: () => Promise<void> } }).Clerk.signOut()
        } catch {
          // Ignore Clerk sign-out error
        }
      }

      // 2. Clear customer session cookie and Supabase auth
      await logoutCustomerAction()

      // 3. Clear local storage profile cache
      if (typeof window !== "undefined") {
        localStorage.removeItem("ar_account_profile")
        localStorage.removeItem("ar_account_addresses")
      }

      if (onSuccess) {
        onSuccess()
      }

      // Full window navigation ensures all client state and cookies are freshly purged
      if (typeof window !== "undefined") {
        window.location.href = "/sign-in"
      } else {
        router.push("/sign-in")
        router.refresh()
      }
    } catch (err) {
      console.error("Sign-out error:", err)
      setIsSigningOut(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSigningOut) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md p-6" showCloseButton={!isSigningOut}>
        <DialogHeader>
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Sign Out Confirmation
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Are you sure you want to sign out of your AR Boutique account?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-2 p-3 bg-muted/40 border border-border/60 rounded-xs text-xs text-muted-foreground leading-relaxed">
          You will need your email and password to access your active orders, shipment tracking, and saved UAE addresses again.
        </div>

        <DialogFooter className="mt-4 flex flex-row gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSigningOut}
            className="h-9 px-4 text-xs font-sans uppercase tracking-wider rounded-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="h-9 px-4 text-xs font-sans uppercase tracking-wider rounded-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSigningOut ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Signing Out...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

