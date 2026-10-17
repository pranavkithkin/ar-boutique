"use client"

import * as React from "react"
import { AccountTab } from "../types"
import {
  Package,
  MapPin,
  UserCheck,
  RotateCcw,
  LogOut,
  ChevronRight,
} from "lucide-react"

interface AccountNavProps {
  activeTab: AccountTab
  onSelectTab: (tab: AccountTab) => void
  ordersCount: number
  addressesCount: number
  onSignOut?: () => void
}

export function AccountNav({
  activeTab,
  onSelectTab,
  ordersCount,
  addressesCount,
  onSignOut,
}: AccountNavProps) {
  const navItems: Array<{
    id: AccountTab
    label: string
    icon: React.ComponentType<{ className?: string }>
    badge?: number | string
  }> = [
    {
      id: "orders",
      label: "Orders & Tracking",
      icon: Package,
      badge: ordersCount,
    },
    {
      id: "addresses",
      label: "Delivery Addresses",
      icon: MapPin,
      badge: addressesCount,
    },
    {
      id: "profile",
      label: "Profile & Preferences",
      icon: UserCheck,
    },
    {
      id: "returns",
      label: "Returns & Exchanges",
      icon: RotateCcw,
    },
  ]

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* Mobile Horizontal Tabs */}
      <div className="flex lg:hidden overflow-x-auto pb-2 border-b border-border gap-2 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-sans whitespace-nowrap rounded-xs border transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary font-medium"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Desktop Vertical Menu */}
      <div className="hidden lg:block bg-card border border-border rounded-xs overflow-hidden shadow-xs divide-y divide-border/50">
        <div className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between p-3 text-xs font-sans rounded-xs transition-colors ${
                  isActive
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                </div>
              </button>
            )
          })}
        </div>

        {onSignOut && (
          <div className="p-2">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 p-3 text-xs font-sans text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xs transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
