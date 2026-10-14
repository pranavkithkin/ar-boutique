import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { AdminLoginForm } from "@/features/admin/components/AdminLoginForm"

export const metadata: Metadata = {
  title: "Admin Sign In | AR Boutique",
  description: "Staff and administrator login portal for AR Boutique.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center text-center">
        <Link
          href="/"
          className="block mb-6 transition-opacity duration-300 hover:opacity-80"
          aria-label="Return to AR Boutique Home"
        >
          <Image
            src="/images/logo-black.png"
            alt="AR Boutique"
            width={240}
            height={96}
            className="h-14 sm:h-16 w-auto mx-auto"
            priority
            unoptimized
          />
        </Link>
        <div className="mb-3">
          <span className="inline-flex items-center text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-muted-foreground bg-muted/60 px-3 py-1">
            Staff Portal
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl text-foreground font-normal tracking-tight">
          Admin Sign In
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto font-sans leading-relaxed">
          Enter your staff credentials to access the boutique management console.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border border-border p-6 sm:p-8 rounded-none shadow-xs">
          <AdminLoginForm />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-sans underline underline-offset-4"
          >
            &larr; Return to storefront
          </Link>
        </div>
      </div>
    </main>
  )
}
