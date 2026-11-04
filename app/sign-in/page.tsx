import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import * as React from "react"
import { SignInForm } from "@/features/auth/components/SignInForm"

export const metadata: Metadata = {
  title: "Sign In | AR Boutique",
  description: "Sign in to your AR Boutique account to manage orders and saved delivery addresses.",
}

export default function SignInPage() {
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
              Welcome Back
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground font-sans">
              Sign in to access your orders and saved delivery addresses.
            </p>
          </div>

          <React.Suspense fallback={<div className="h-44" />}>
            <SignInForm />
          </React.Suspense>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 font-sans">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-foreground font-semibold underline underline-offset-4 hover:opacity-75 transition-opacity"
          >
            Create an account
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
