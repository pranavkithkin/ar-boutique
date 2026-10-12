import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { SignUpForm } from "@/features/auth/components/SignUpForm"

export const metadata: Metadata = {
  title: "Create Account | AR Boutique",
  description: "Create an AR Boutique account for seamless checkout, order tracking, and saved delivery addresses.",
}

export default function SignUpPage() {
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
          Join the Atelier
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto font-sans leading-relaxed">
          Create an account for seamless checkout, order tracking, and saved delivery addresses.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border border-border/70 p-6 sm:p-8 rounded-xs shadow-xs">
          <SignUpForm />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 font-sans">
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
