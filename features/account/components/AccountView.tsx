"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AccountTab,
  AccountAddress,
  AccountOrder,
  AccountUserProfile,
} from "../types"
const EMPTY_PROFILE: AccountUserProfile = {
  id: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  memberSince: "",
  tier: "Member",
  preferredLanguage: "en",
  notifyWhatsApp: true,
  notifyEmail: true,
}

import { AccountNav } from "./AccountNav"
import { OrdersTab } from "./OrdersTab"
import { AddressesTab } from "./AddressesTab"
import { ProfileTab } from "./ProfileTab"
import { ReturnsTab } from "./ReturnsTab"

import { Loader2 } from "lucide-react"

import { isClerkConfigured } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"
import { getCustomerAccountDataAction } from "../actions"
import { logoutCustomerAction } from "@/features/auth/actions"

function ClerkSessionBridge({
  onUserDetected,
  onUnauthenticated,
}: {
  onUserDetected: (info: { email: string; fullName: string; phone?: string | null }) => void
  onUnauthenticated: () => void
}) {
  const { isLoaded, isSignedIn, user } = useUser()

  React.useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      const detectedName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        (user.username && !user.username.includes("@") ? user.username : "") ||
        ""
      onUserDetected({
        email: user.primaryEmailAddress.emailAddress,
        fullName: detectedName,
        phone: user.primaryPhoneNumber?.phoneNumber || null,
      })
    } else if (!isSignedIn) {
      onUnauthenticated()
    }
  }, [isLoaded, isSignedIn, user, onUserDetected, onUnauthenticated])

  return null
}

export function AccountView() {
  const router = useRouter()
  const clerkEnabled = isClerkConfigured()
  const [activeTab, setActiveTab] = React.useState<AccountTab>("orders")
  const [isSignedIn, setIsSignedIn] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  // Real data state (zero dummy data)
  const [profile, setProfile] = React.useState<AccountUserProfile>(EMPTY_PROFILE)
  const [addresses, setAddresses] = React.useState<AccountAddress[]>([])
  const [orders, setOrders] = React.useState<AccountOrder[]>([])

  // Fetch live orders & profile from Supabase
  const loadAccountData = React.useCallback(
    async (
      email: string,
      fallbackInfo?: { fullName?: string; phone?: string | null }
    ) => {
      setIsLoading(true)
      try {
        const res = await getCustomerAccountDataAction(email, fallbackInfo)
        if (res.success) {
          if (res.profile) setProfile(res.profile)
          if (res.orders) setOrders(res.orders)
          if (res.addresses && res.addresses.length > 0) {
            setAddresses(res.addresses)
          }
          setIsSignedIn(true)
        }
      } catch (err) {
        console.warn("Failed to load live account data:", err)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Check initial local cache & sync
  React.useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("ar_account_profile")
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile)
        if (parsed.email) {
          const emailToLoad = parsed.email
          const validSavedName =
            parsed.fullName &&
            !parsed.fullName.includes("@") &&
            parsed.fullName !== parsed.email.split("@")[0]
              ? parsed.fullName
              : ""
          const timer = setTimeout(() => {
            void loadAccountData(emailToLoad, {
              fullName: validSavedName,
              phone: parsed.phone || null,
            })
          }, 0)
          return () => clearTimeout(timer)
        }
      }
    } catch {
      // Ignore
    }
  }, [loadAccountData])

  const handleClerkUserDetected = React.useCallback(
    (info: { email: string; fullName: string; phone?: string | null }) => {
      loadAccountData(info.email, {
        fullName: info.fullName,
        phone: info.phone,
      })
    },
    [loadAccountData]
  )

  const handleUnauthenticated = React.useCallback(() => {
    // Check if localStorage has a real session
    try {
      const savedProfile = localStorage.getItem("ar_account_profile")
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile)
        if (parsed.email) {
          loadAccountData(parsed.email)
          return
        }
      }
    } catch {
      // Ignore
    }
    setIsSignedIn(false)
  }, [loadAccountData])


  const handleSignOut = async () => {
    try {
      await logoutCustomerAction()
      localStorage.removeItem("ar_account_profile")
      localStorage.removeItem("ar_account_addresses")
    } catch {
      // Ignore
    }
    setIsSignedIn(false)
    setOrders([])
    setAddresses([])
    setProfile(EMPTY_PROFILE)
    router.replace("/sign-in")
  }

  const handleUpdateAddresses = (newAddresses: AccountAddress[]) => {
    setAddresses(newAddresses)
    try {
      localStorage.setItem("ar_account_addresses", JSON.stringify(newAddresses))
    } catch {
      // Ignore
    }
  }

  const handleUpdateProfile = (newProfile: AccountUserProfile) => {
    setProfile(newProfile)
    try {
      localStorage.setItem("ar_account_profile", JSON.stringify(newProfile))
    } catch {
      // Ignore
    }
  }

  // If unauthenticated, redirect directly to /sign-in
  React.useEffect(() => {
    if (!isSignedIn && !isLoading) {
      const timer = setTimeout(() => {
        router.replace("/sign-in?redirect=/account")
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isSignedIn, isLoading, router])

  if (!isSignedIn) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-28 flex flex-col items-center justify-center text-center space-y-3">
        {clerkEnabled && (
          <ClerkSessionBridge
            onUserDetected={handleClerkUserDetected}
            onUnauthenticated={handleUnauthenticated}
          />
        )}
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-sans">
          Redirecting to Sign In...
        </p>
      </div>
    )
  }

  const activeOrdersCount = orders.filter(
    (o) => o.status === "confirmed" || o.status === "shipped"
  ).length

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Invisible Clerk detection bridge */}
      {clerkEnabled && (
        <ClerkSessionBridge
          onUserDetected={handleClerkUserDetected}
          onUnauthenticated={handleUnauthenticated}
        />
      )}

      {/* Quick Account Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xs border border-border bg-card shadow-xs relative overflow-hidden">
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-full" />
          </div>
        )}
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-sans font-semibold text-base shrink-0 uppercase">
            {(profile.firstName ? profile.firstName.charAt(0) : "") +
              (profile.lastName ? profile.lastName.charAt(0) : "")}
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground capitalize">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile.email}{profile.phone ? ` • ${profile.phone}` : ""}
            </p>
          </div>
        </div>

        {/* Quick stat counters */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground self-stretch sm:self-auto justify-between sm:justify-start border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
          <div className="text-center sm:text-right">
            <span className="block text-base font-semibold font-mono text-foreground">
              {orders.length}
            </span>
            <span className="text-[11px] uppercase tracking-wider">Orders</span>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div className="text-center sm:text-right">
            <span className="block text-base font-semibold font-mono text-foreground">
              {addresses.length}
            </span>
            <span className="text-[11px] uppercase tracking-wider">Addresses</span>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div className="text-center sm:text-right">
            <span className="block text-base font-semibold font-mono text-foreground">
              {activeOrdersCount}
            </span>
            <span className="text-[11px] uppercase tracking-wider">Active</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <AccountNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          ordersCount={orders.length}
          addressesCount={addresses.length}
          onSignOut={handleSignOut}
        />

        {/* Tab Content Panel */}
        <main className="flex-1 w-full min-w-0">
          {activeTab === "orders" && <OrdersTab orders={orders} />}
          {activeTab === "addresses" && (
            <AddressesTab
              addresses={addresses}
              onUpdateAddresses={handleUpdateAddresses}
            />
          )}
          {activeTab === "profile" && (
            <ProfileTab
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
          {activeTab === "returns" && <ReturnsTab />}
        </main>
      </div>
    </div>
  )
}
