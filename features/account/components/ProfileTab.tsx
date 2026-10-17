"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AccountUserProfile } from "../types"
import { profileSchema, passwordChangeSchema, type ProfileFormValues, type PasswordChangeFormValues } from "../schemas"
import { StoreButton } from "@/components/store/StoreButton"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { User, Lock, Check, ShieldCheck } from "lucide-react"

interface ProfileTabProps {
  profile: AccountUserProfile
  onUpdateProfile: (profile: AccountUserProfile) => void
}

export function ProfileTab({ profile, onUpdateProfile }: ProfileTabProps) {
  const [profileSavedNotice, setProfileSavedNotice] = React.useState(false)
  const [passwordSavedNotice, setPasswordSavedNotice] = React.useState(false)

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    formState: { isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      preferredLanguage: profile.preferredLanguage,
      notifyWhatsApp: profile.notifyWhatsApp,
      notifyEmail: profile.notifyEmail,
    },
  })

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onProfileSubmit = (data: ProfileFormValues) => {
    onUpdateProfile({
      ...profile,
      ...data,
    })
    setProfileSavedNotice(true)
    setTimeout(() => setProfileSavedNotice(false), 3500)
  }

  const onPasswordSubmit = (_data: PasswordChangeFormValues) => {
    setPasswordSavedNotice(true)
    resetPasswordForm()
    setTimeout(() => setPasswordSavedNotice(false), 3500)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-sans font-semibold tracking-tight text-foreground">Profile & Preferences</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your personal information, VIP status, and concierge notification channels.
        </p>
      </div>

      {/* Account Tier & Membership Banner */}
      <div className="p-5 rounded-xs border border-border bg-gradient-to-r from-secondary/60 via-card to-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-sans font-semibold text-base shrink-0">
            {profile.firstName.charAt(0)}
            {profile.lastName.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {profile.firstName} {profile.lastName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Member ID: <span className="font-mono text-foreground">{profile.id}</span> • Member since {profile.memberSince}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-xs border border-border/60">
          Complimentary UAE White-Glove Delivery
        </div>
      </div>

      {/* Personal Details Form */}
      <div className="bg-card border border-border rounded-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Personal Information
            </h3>
          </div>
          {profileSavedNotice && (
            <span className="text-xs text-success flex items-center gap-1 font-medium animate-in fade-in">
              <Check className="h-3.5 w-3.5" /> Details updated successfully
            </span>
          )}
        </div>

        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="firstName"
                control={profileControl}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      First Name *
                    </FieldLabel>
                    <Input {...field} className="h-10 text-xs bg-background" />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              <Controller
                name="lastName"
                control={profileControl}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Last Name *
                    </FieldLabel>
                    <Input {...field} className="h-10 text-xs bg-background" />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="email"
                control={profileControl}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Email Address *
                    </FieldLabel>
                    <Input {...field} type="email" className="h-10 text-xs bg-background" />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              <Controller
                name="phone"
                control={profileControl}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      UAE Mobile (+971) *
                    </FieldLabel>
                    <Input {...field} className="h-10 text-xs bg-background font-mono" />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />
            </div>


          </FieldGroup>

          <div className="flex justify-end pt-3">
            <StoreButton
              type="submit"
              disabled={isProfileSubmitting}
              className="h-10 px-6 text-xs uppercase tracking-widest"
            >
              Save Profile Changes
            </StoreButton>
          </div>
        </form>
      </div>

      {/* Password & Security Section */}
      <div className="bg-card border border-border rounded-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Security & Password
            </h3>
          </div>
          {passwordSavedNotice && (
            <span className="text-xs text-success flex items-center gap-1 font-medium animate-in fade-in">
              <ShieldCheck className="h-3.5 w-3.5" /> Password updated securely
            </span>
          )}
        </div>

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <FieldGroup className="gap-4">
            <Controller
              name="currentPassword"
              control={passwordControl}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Current Password *
                  </FieldLabel>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    className="h-10 text-xs bg-background"
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="newPassword"
                control={passwordControl}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      New Password *
                    </FieldLabel>
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••"
                      className="h-10 text-xs bg-background"
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={passwordControl}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Confirm New Password *
                    </FieldLabel>
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••"
                      className="h-10 text-xs bg-background"
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>

          <div className="flex justify-end pt-3">
            <StoreButton
              type="submit"
              disabled={isPasswordSubmitting}
              className="h-10 px-6 text-xs uppercase tracking-widest bg-secondary text-foreground hover:bg-secondary/80 border border-border"
            >
              Update Password
            </StoreButton>
          </div>
        </form>
      </div>
    </div>
  )
}
