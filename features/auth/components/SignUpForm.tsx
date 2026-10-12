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
import { Eye, EyeOff, Lock, Mail, User, Phone, ArrowRight } from "lucide-react"
import { signUpSchema, type SignUpFormValues } from "../schemas"

export function SignUpForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [demoNotice, setDemoNotice] = React.useState(false)

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

  function onSubmit(_data: SignUpFormValues) {
    setDemoNotice(true)
    setTimeout(() => setDemoNotice(false), 4000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {demoNotice && (
        <div className="p-3 text-xs bg-muted/60 border border-border text-foreground rounded-xs leading-relaxed animate-in fade-in-50">
          <strong>Design Preview:</strong> Account creation layout complete! Backend authentication (Clerk) is scheduled next in Phase 5.
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
                    placeholder="Al-Mansoor"
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

        {/* Mobile Phone (Optional) */}
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-baseline justify-between">
                <FieldLabel htmlFor={field.name} className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Mobile Number
                </FieldLabel>
                <span className="text-[10px] text-muted-foreground/75 font-sans">UAE (+971)</span>
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
        Create Account
        <ArrowRight className="h-3.5 w-3.5" />
      </StoreButton>
    </form>
  )
}
