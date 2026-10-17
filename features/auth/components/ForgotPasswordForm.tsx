"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { StoreButton } from "@/components/store/StoreButton"
import {
  Mail,
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react"
import {
  forgotPasswordRequestSchema,
  resetPasswordSchema,
  type ForgotPasswordRequestValues,
  type ResetPasswordValues,
} from "../schemas"

export function ForgotPasswordForm() {
  const router = useRouter()
  const { isLoaded: isClerkLoaded, signIn, setActive } = useSignIn()

  const [step, setStep] = React.useState<"request" | "reset">("request")
  const [submittedEmail, setSubmittedEmail] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [isResending, setIsResending] = React.useState(false)

  // Step 1: Request reset code form
  const requestForm = useForm<ForgotPasswordRequestValues>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: { email: "" },
  })

  // Step 2: Reset password with code form
  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
      password: "",
      confirmPassword: "",
    },
  })

  // Handle Step 1: Request Code
  async function onRequestCode(data: ForgotPasswordRequestValues) {
    setErrorMessage(null)
    setSuccessMessage(null)

    if (isClerkLoaded && signIn) {
      try {
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: data.email.trim(),
        })

        setSubmittedEmail(data.email.trim())
        setStep("reset")
        setSuccessMessage("A 6-digit recovery code has been sent to your email.")
        return
      } catch (clerkErr: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errAny = clerkErr as any
        const message =
          errAny.errors?.[0]?.longMessage ||
          errAny.errors?.[0]?.message ||
          errAny.message ||
          "Could not send reset code. Please verify your email address."
        setErrorMessage(message)
        return
      }
    }

    setErrorMessage("Authentication service is currently preparing. Please try again shortly.")
  }

  // Handle Step 2: Submit Code & Set New Password
  async function onResetPassword(data: ResetPasswordValues) {
    setErrorMessage(null)
    setSuccessMessage(null)

    if (isClerkLoaded && signIn && setActive) {
      try {
        const result = await signIn.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code: data.code.trim(),
          password: data.password,
        })

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId })
          setSuccessMessage("Password successfully updated! Redirecting to your account...")
          setTimeout(() => {
            router.push("/account")
            router.refresh()
          }, 800)
          return
        }

        if (result.status === "needs_second_factor") {
          setErrorMessage("Two-factor authentication is required. Please sign in normally.")
          return
        }
      } catch (clerkErr: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errAny = clerkErr as any
        const message =
          errAny.errors?.[0]?.longMessage ||
          errAny.errors?.[0]?.message ||
          errAny.message ||
          "Invalid or expired recovery code. Please check your inbox or resend."
        setErrorMessage(message)
        return
      }
    }

    setErrorMessage("Unable to update password. Please try again.")
  }

  // Handle Resend Code
  async function handleResendCode() {
    if (!signIn || !submittedEmail) return
    setIsResending(true)
    setErrorMessage(null)
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: submittedEmail,
      })
      setSuccessMessage("A fresh 6-digit recovery code has been sent.")
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch {
      setErrorMessage("Could not resend code. Please wait a moment and try again.")
    } finally {
      setIsResending(false)
    }
  }

  // Step 2: Verification Code & New Password View
  if (step === "reset") {
    return (
      <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
        {errorMessage && (
          <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xs flex items-start gap-2 leading-relaxed animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xs flex items-start gap-2 leading-relaxed animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="p-3.5 bg-muted/40 border border-border rounded-xs text-xs space-y-1">
          <p className="font-semibold text-foreground">Verification Sent</p>
          <p className="text-muted-foreground leading-relaxed">
            Please enter the 6-digit code dispatched to{" "}
            <span className="font-semibold text-foreground">{submittedEmail}</span>.
          </p>
        </div>

        <FieldGroup className="gap-3.5">
          {/* 6-Digit Code */}
          <Controller
            name="code"
            control={resetForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                  6-Digit Recovery Code *
                </FieldLabel>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="123456"
                    className="pl-9 h-10 tracking-[0.3em] font-mono font-semibold text-center text-sm"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
                {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
              </Field>
            )}
          />

          {/* New Password */}
          <Controller
            name="password"
            control={resetForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                  New Password *
                </FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9 h-10 text-xs"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
              </Field>
            )}
          />

          {/* Confirm New Password */}
          <Controller
            name="confirmPassword"
            control={resetForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                  Confirm New Password *
                </FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9 h-10 text-xs"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
              </Field>
            )}
          />
        </FieldGroup>

        <StoreButton
          type="submit"
          disabled={resetForm.formState.isSubmitting}
          className="w-full h-11 text-xs uppercase tracking-widest font-sans font-medium flex items-center justify-center gap-2 mt-4"
        >
          {resetForm.formState.isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating Password...
            </>
          ) : (
            <>
              Update Password & Sign In
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </StoreButton>

        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setStep("request")}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Change Email
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending}
            className="inline-flex items-center gap-1 text-foreground hover:underline font-medium disabled:opacity-50"
          >
            {isResending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            Resend Code
          </button>
        </div>
      </form>
    )
  }

  // Step 1: Request Reset Code View
  return (
    <form onSubmit={requestForm.handleSubmit(onRequestCode)} className="space-y-4">
      {errorMessage && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xs flex items-start gap-2 leading-relaxed animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xs flex items-start gap-2 leading-relaxed animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        Enter the email address associated with your boutique account. We will send a secure 6-digit recovery code to reset your password.
      </p>

      <FieldGroup className="gap-3.5">
        <Controller
          name="email"
          control={requestForm.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                Email Address *
              </FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  {...field}
                  type="email"
                  placeholder="name@example.com"
                  className="pl-9 h-10 text-xs"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
          )}
        />
      </FieldGroup>

      <StoreButton
        type="submit"
        disabled={requestForm.formState.isSubmitting}
        className="w-full h-11 text-xs uppercase tracking-widest font-sans font-medium flex items-center justify-center gap-2 mt-4"
      >
        {requestForm.formState.isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending Recovery Code...
          </>
        ) : (
          <>
            Send Recovery Code
            <ArrowRight className="w-4 h-4 ml-1" />
          </>
        )}
      </StoreButton>

      <div className="text-center pt-2">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Client Sign In
        </Link>
      </div>
    </form>
  )
}
