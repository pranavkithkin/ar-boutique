"use client"

import * as React from "react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { StoreButton } from "@/components/store/StoreButton"
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react"
import { signInSchema, type SignInFormValues } from "../schemas"

export function SignInForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [demoNotice, setDemoNotice] = React.useState(false)

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

  function onSubmit(_data: SignInFormValues) {
    setDemoNotice(true)
    setTimeout(() => setDemoNotice(false), 4000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {demoNotice && (
        <div className="p-3 text-xs bg-muted/60 border border-border text-foreground rounded-xs leading-relaxed animate-in fade-in-50">
          <strong>Design Preview:</strong> Authentication backend (Clerk) is coming next. Your inputs passed client validation cleanly!
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
        Sign In
        <ArrowRight className="h-3.5 w-3.5" />
      </StoreButton>
    </form>
  )
}
