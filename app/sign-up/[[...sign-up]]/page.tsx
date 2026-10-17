import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import * as React from "react"
import { SignUpForm } from "@/features/auth/components/SignUpForm"

export const metadata: Metadata = {
  title: "Create Account | AR Boutique",
  description: "Create an AR Boutique account for seamless checkout, order tracking, and saved delivery addresses.",
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-block transition-opacity duration-300 hover:opacity-80">
          <Image
            src="/images/logo-black.png"
            alt="AR Boutique"
            width={240}
            height={96}
            className="h-16 w-auto mx-auto"
            priority
            unoptimized
          />
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border border-border/70 p-6 sm:p-8 rounded-xs shadow-xs">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-sans font-semibold tracking-tight text-foreground">
              Create Account
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground font-sans">
              Sign up for seamless checkout, order tracking, and saved delivery addresses.
            </p>
          </div>

          <React.Suspense fallback={<div className="h-56" />}>
            <SignUpForm />
          </React.Suspense>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 font-sans">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-foreground font-semibold underline underline-offset-4 hover:opacity-75 transition-opacity"
          >
            Sign in
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-sans"
          >
            &larr; Return to boutique
          </Link>
        </div>
      </div>
    </div>
  )
}
