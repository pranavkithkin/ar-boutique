"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSignUp } from "@clerk/nextjs/legacy"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { StoreButton } from "@/components/store/StoreButton"
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RotateCcw,
} from "lucide-react"
import { signUpSchema, type SignUpFormValues } from "../schemas"
import { signUpCustomerAction, syncClerkCustomerToSupabaseAction } from "../actions"

interface SignUpFormProps {
  redirectTo?: string
  onSuccess?: () => void
}

export function SignUpForm({ redirectTo, onSuccess }: SignUpFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destination = redirectTo || searchParams.get("redirect") || "/account"

  // Clerk headless authentication hook
  const { isLoaded: isClerkLoaded, signUp, setActive } = useSignUp()

  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  // Verification step state
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [verificationCode, setVerificationCode] = React.useState("")
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [registeredData, setRegisteredData] = React.useState<SignUpFormValues | null>(null)

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      termsAccepted: false,
    },
  })

  async function onSubmit(data: SignUpFormValues) {
    setErrorMessage(null)
    setSuccessMessage(null)

    // 1. If Clerk is configured and loaded, use Clerk's headless SDK
    if (isClerkLoaded && signUp) {
      try {
        await signUp.create({
          emailAddress: data.email,
          password: data.password,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
        })

        // Prepare email verification code (bypasses Supabase email limits)
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

        setRegisteredData(data)
        setPendingVerification(true)
        return
      } catch (clerkErr: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errAny = clerkErr as any
        const message =
          errAny.errors?.[0]?.longMessage ||
          errAny.errors?.[0]?.message ||
          errAny.message ||
          "Failed to create account. Please verify your details."
        setErrorMessage(message)
        return
      }
    }

    // 2. Fallback to server action if Clerk is unconfigured
    try {
      const result = await signUpCustomerAction(data)

      if (!result.success || !result.customer) {
        setErrorMessage(result.error || "Failed to create account. Please try again.")
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

      setSuccessMessage("Account created successfully! Redirecting...")

      if (onSuccess) {
        onSuccess()
      } else {
        setTimeout(() => {
          router.push(destination)
          router.refresh()
        }, 600)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred."
      setErrorMessage(msg)
    }
  }

  // Handle email verification code submission
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!signUp || !verificationCode.trim()) return

    setIsVerifying(true)
    setErrorMessage(null)

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      })

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId })

        // Sync customer directly into Supabase public.customers table
        if (registeredData) {
          await syncClerkCustomerToSupabaseAction({
            clerkUserId: completeSignUp.createdUserId || `clerk_${Date.now()}`,
            email: registeredData.email,
            fullName: `${registeredData.firstName} ${registeredData.lastName}`.trim(),
            phone: registeredData.phone || null,
          })

          try {
            const profilePayload = {
              fullName: `${registeredData.firstName} ${registeredData.lastName}`.trim(),
              email: registeredData.email,
              phone: registeredData.phone || "",
            }
            localStorage.setItem("ar_account_profile", JSON.stringify(profilePayload))
          } catch {
            // Ignore
          }
        }

        setSuccessMessage("Email verified! Welcome to AR Boutique. Redirecting...")

        if (onSuccess) {
          onSuccess()
        } else {
          setTimeout(() => {
            router.push(destination)
            router.refresh()
          }, 600)
        }
      } else {
        setErrorMessage("Verification could not be completed. Please check the code.")
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errAny = err as any
      const message =
        errAny.errors?.[0]?.longMessage ||
        errAny.errors?.[0]?.message ||
        errAny.message ||
        "Invalid or expired verification code. Please try again."
      setErrorMessage(message)
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle resend code
  async function handleResendCode() {
    if (!signUp) return
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setSuccessMessage("A fresh verification code has been sent to your email.")
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch {
      setErrorMessage("Could not resend code. Please try again in a moment.")
    }
  }

  // Step 2: Verification Code Screen
  if (pendingVerification) {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-4">
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

        <div className="p-4 bg-secondary/40 border border-border rounded-xs text-center space-y-1.5">
          <KeyRound className="w-5 h-5 mx-auto text-primary" />
          <h3 className="text-sm font-semibold text-foreground font-sans">
            Verify Your Email
          </h3>
          <p className="text-xs text-muted-foreground font-sans">
            We sent a 6-digit verification code to{" "}
            <strong className="text-foreground">{registeredData?.email}</strong>.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Verification Code *
          </label>
          <Input
            type="text"
            required
            maxLength={6}
            placeholder="123456"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
            className="text-center font-mono text-lg tracking-[0.4em] h-12 rounded-xs bg-background border-border"
          />
        </div>

        <StoreButton
          type="submit"
          disabled={isVerifying || verificationCode.length < 6}
          className="w-full mt-2 h-11 gap-2 text-xs font-semibold tracking-[0.14em] uppercase transition-all duration-300"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Verifying Code...
            </>
          ) : (
            <>
              Verify & Activate Account
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </StoreButton>

        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground font-sans">
          <button
            type="button"
            onClick={handleResendCode}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors underline underline-offset-2"
          >
            <RotateCcw className="w-3 h-3" />
            Resend Code
          </button>
          <button
            type="button"
            onClick={() => setPendingVerification(false)}
            className="hover:text-foreground transition-colors underline underline-offset-2"
          >
            Change Details
          </button>
        </div>
      </form>
    )
  }

  // Step 1: Initial Registration Form
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
        {/* Name Fields (2 columns) */}
        <div className="grid grid-cols-2 gap-3.5">
          <Controller
            name="firstName"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  First Name <span className="text-foreground">*</span>
                </FieldLabel>
                <div className="relative mt-1.5">
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Sara"
                    autoComplete="given-name"
                    className="pl-8 text-xs sm:text-sm h-10 rounded-xs bg-background placeholder:text-muted-foreground/60 border-border"
                  />
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
                {fieldState.invalid && (
                  <FieldError className="text-[11px] text-destructive mt-1">
                    {fieldState.error?.message}
                  </FieldError>
                )}
              </Field>
            )}
          />

          <Controller
            name="lastName"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Last Name <span className="text-foreground">*</span>
                </FieldLabel>
                <div className="relative mt-1.5">
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Al Mansoori"
                    autoComplete="family-name"
                    className="pl-8 text-xs sm:text-sm h-10 rounded-xs bg-background placeholder:text-muted-foreground/60 border-border"
                  />
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
                {fieldState.invalid && (
                  <FieldError className="text-[11px] text-destructive mt-1">
                    {fieldState.error?.message}
                  </FieldError>
                )}
              </Field>
            )}
          />
        </div>

        {/* Email Field */}
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
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

        {/* Mobile Number Field */}
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-baseline justify-between">
                <FieldLabel htmlFor={field.name} className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  UAE Mobile Number
                </FieldLabel>
                <span className="text-[11px] text-muted-foreground font-sans">
                  For dispatch WhatsApp updates
                </span>
              </div>
              <div className="relative mt-1.5">
                <Input
                  {...field}
                  id={field.name}
                  type="tel"
                  placeholder="+971 50 123 4567"
                  autoComplete="tel"
                  className="pl-8 text-xs sm:text-sm h-10 rounded-xs bg-background placeholder:text-muted-foreground/60 border-border"
                />
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
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
              <FieldLabel htmlFor={field.name} className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Password <span className="text-foreground">*</span>
              </FieldLabel>
              <div className="relative mt-1.5">
                <Input
                  {...field}
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters with 1 number"
                  autoComplete="new-password"
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

        {/* Terms and Conditions Checkbox */}
        <Controller
          name="termsAccepted"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="pt-2">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="termsAccepted"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5 rounded-2xs"
                />
                <label
                  htmlFor="termsAccepted"
                  className="text-xs text-muted-foreground cursor-pointer leading-normal select-none font-sans"
                >
                  I agree to the{" "}
                  <Link href="/policies/terms" className="text-foreground font-medium underline underline-offset-2 hover:opacity-80">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/policies/privacy" className="text-foreground font-medium underline underline-offset-2 hover:opacity-80">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {fieldState.error && (
                <FieldError className="text-[11px] text-destructive mt-1">
                  {fieldState.error.message}
                </FieldError>
              )}
            </Field>
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
            Creating Account...
          </>
        ) : (
          <>
            Create Account
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </StoreButton>
    </form>
  )
}
