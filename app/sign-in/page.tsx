import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { SignInForm } from "@/features/auth/components/SignInForm"

export const metadata: Metadata = {
  title: "Sign In | AR Boutique",
  description: "Sign in to your AR Boutique account to manage orders and saved delivery addresses.",
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-8 transition-opacity duration-300 hover:opacity-80">
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
        <h1 className="font-heading text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
          Welcome Back
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto font-sans leading-relaxed">
          Sign in to access your orders and saved delivery addresses.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border border-border/70 p-6 sm:p-8 rounded-xs shadow-xs">
          <SignInForm />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 font-sans">
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
