"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSignIn } from "@clerk/nextjs/legacy"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { StoreButton } from "@/components/store/StoreButton"
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { signInSchema, type SignInFormValues } from "../schemas"
import { loginCustomerAction } from "../actions"

interface SignInFormProps {
  redirectTo?: string
  onSuccess?: () => void
}

export function SignInForm({ redirectTo, onSuccess }: SignInFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destination = redirectTo || searchParams.get("redirect") || "/account"

  // Clerk headless authentication hook
  const { isLoaded: isClerkLoaded, signIn, setActive } = useSignIn()

  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  async function onSubmit(data: SignInFormValues) {
    setErrorMessage(null)
    setSuccessMessage(null)

    // 1. Try Clerk authentication if active
    if (isClerkLoaded && signIn && setActive) {
      try {
        const attempt = await signIn.create({
          identifier: data.email,
          password: data.password,
        })

        if (attempt.status === "complete") {
          await setActive({ session: attempt.createdSessionId })

          try {
            const profilePayload = {
              email: data.email,
              phone: "",
            }
            localStorage.setItem("ar_account_profile", JSON.stringify(profilePayload))
          } catch {
            // Ignore
          }

          setSuccessMessage("Welcome back! Redirecting...")
          if (onSuccess) {
            onSuccess()
          } else {
            setTimeout(() => {
              router.push(destination)
              router.refresh()
            }, 500)
          }
          return
        } else {
          setErrorMessage("Additional verification is required for this account.")
          return
        }
      } catch (clerkErr: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errAny = clerkErr as any
        const message =
          errAny.errors?.[0]?.longMessage ||
          errAny.errors?.[0]?.message ||
          errAny.message ||
          "Invalid email or password."
        setErrorMessage(message)
        return
      }
    }

    // 2. Fallback to server action if Clerk is unconfigured
    try {
      const result = await loginCustomerAction(data)
      if (!result.success || !result.customer) {
        setErrorMessage(result.error || "Unable to sign in. Please verify your credentials.")
        return
      }

      try {
        const profilePayload = {
          fullName: `${result.customer.firstName} ${result.customer.lastName}`.trim(),
          email: result.customer.email,
          phone: result.customer.phone || "",
        }
        localStorage.setItem("ar_account_profile", JSON.stringify(profilePayload))
      } catch {
        // Ignore
      }

      setSuccessMessage("Welcome back! Redirecting...")
      if (onSuccess) {
        onSuccess()
      } else {
        setTimeout(() => {
          router.push(destination)
          router.refresh()
        }, 500)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred."
      setErrorMessage(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMessage && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xs flex items-start gap-2 leading-relaxed animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xs flex items-start gap-2 leading-relaxed animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <FieldGroup className="gap-4">
        {/* Email Field */}
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                htmlFor={field.name}
                className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
              >
                Email Address <span className="text-foreground">*</span>
              </FieldLabel>
              <div className="relative mt-1.5">
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="pl-8 text-xs sm:text-sm h-10 rounded-xs bg-background placeholder:text-muted-foreground/60 border-border"
                />
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
              {fieldState.invalid && (
                <FieldError className="text-[11px] text-destructive mt-1">
                  {fieldState.error?.message}
                </FieldError>
              )}
            </Field>
          )}
        />

        {/* Password Field */}
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-baseline justify-between">
                <FieldLabel
                  htmlFor={field.name}
                  className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Password <span className="text-foreground">*</span>
                </FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-sans text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Input
                  {...field}
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pl-8 pr-9 text-xs sm:text-sm h-10 rounded-xs bg-background placeholder:text-muted-foreground/60 border-border"
                />
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldState.invalid && (
                <FieldError className="text-[11px] text-destructive mt-1">
                  {fieldState.error?.message}
                </FieldError>
              )}
            </Field>
          )}
        />

        {/* Remember Me */}
        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox
                id="rememberMe"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="rounded-2xs"
              />
              <label
                htmlFor="rememberMe"
                className="text-xs text-muted-foreground cursor-pointer select-none font-sans"
              >
                Keep me signed in on this device
              </label>
            </div>
          )}
        />
      </FieldGroup>

      {/* Submit Button */}
      <StoreButton
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-4 h-11 gap-2 text-xs font-semibold tracking-[0.14em] uppercase transition-all duration-300"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Signing In...
          </>
        ) : (
          <>
            Sign In
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </StoreButton>
    </form>
  )
}
