"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from "lucide-react"
import { adminLoginSchema, type AdminLoginFormValues } from "../schemas"
import { loginAdminAction } from "../actions"

export function AdminLoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: AdminLoginFormValues) {
    setErrorMessage(null)
    try {
      const result = await loginAdminAction(data)
      if (!result.success) {
        setErrorMessage(result.error || "Authentication failed. Please check your credentials.")
        return
      }

      router.push(result.redirectTo || "/admin")
      router.refresh()
    } catch {
      setErrorMessage("An unexpected error occurred during sign in. Please try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-none flex items-start gap-2.5 animate-in fade-in-50"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
          <span className="leading-relaxed">{errorMessage}</span>
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
                Staff Email <span className="text-foreground">*</span>
              </FieldLabel>
              <div className="relative mt-1.5">
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="concierge@arboutique.ae"
                  autoComplete="email"
                  className="pl-9 text-xs sm:text-sm h-10 rounded-none bg-background placeholder:text-muted-foreground/50 border-input text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
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
              <FieldLabel
                htmlFor={field.name}
                className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground"
              >
                Password <span className="text-foreground">*</span>
              </FieldLabel>
              <div className="relative mt-1.5">
                <Input
                  {...field}
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="pl-9 pr-9 text-xs sm:text-sm h-10 rounded-none bg-background placeholder:text-muted-foreground/50 border-input text-foreground focus-visible:ring-1 focus-visible:ring-primary font-mono tracking-wider"
                />
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
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
      </FieldGroup>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-10 text-xs sm:text-sm font-medium uppercase tracking-[0.08em] rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-none mt-2"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Authenticating...
          </span>
        ) : (
          "Sign In to Console"
        )}
      </Button>

      {/* Security Disclaimer */}
      <div className="pt-2 text-center">
        <p className="text-[11px] text-muted-foreground/80 font-sans leading-relaxed">
          Authorized staff access only. All sessions, sign-in attempts, and administrative actions are audited.
        </p>
      </div>
    </form>
  )
}
