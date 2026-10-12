"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StoreButton } from "@/components/store/StoreButton"
import { Check, Send } from "lucide-react"
import { contactFormSchema, type ContactFormValues } from "../schemas"

export function ContactForm() {
  const [submitted, setSubmitted] = React.useState(false)

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      topic: "General Inquiry",
      message: "",
    },
  })

  function onSubmit(_data: ContactFormValues) {
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-xs border border-border/80 bg-card p-8 sm:p-10 text-center flex flex-col items-center gap-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground">
          <Check className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="font-heading text-2xl font-normal text-foreground">
          Thank you for reaching out
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
          Your inquiry has been received by our dedicated concierge team. We will respond via email or WhatsApp within 24 hours.
        </p>
        <StoreButton
          variant="outline"
          onClick={() => {
            reset()
            setSubmitted(false)
          }}
          className="mt-2 text-xs"
        >
          Send Another Message
        </StoreButton>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup className="gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.5">
                <FieldLabel htmlFor={field.name} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name <span className="text-foreground">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Amina Al Mansoori"
                  className="h-10 px-3.5 text-xs sm:text-sm bg-background border border-input rounded-xs"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Email Address */}
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.5">
                <FieldLabel htmlFor={field.name} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address <span className="text-foreground">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="amina@example.com"
                  className="h-10 px-3.5 text-xs sm:text-sm bg-background border border-input rounded-xs"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone / WhatsApp */}
          <Controller
            control={control}
            name="phone"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.5">
                <FieldLabel htmlFor={field.name} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone / WhatsApp (Optional)
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="tel"
                  placeholder="+971 50 xxx xxxx"
                  className="h-10 px-3.5 text-xs sm:text-sm bg-background border border-input rounded-xs"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Inquiry Topic */}
          <Controller
            control={control}
            name="topic"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-1.5">
                <FieldLabel htmlFor={field.name} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Inquiry Topic
                </FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    className="w-full h-10 px-3.5 text-xs sm:text-sm bg-background border border-input rounded-xs"
                  >
                    <SelectValue placeholder="Select an inquiry topic">
                      {field.value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} align="start">
                    <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                    <SelectItem value="Order & Delivery Tracking">Order & Delivery Tracking</SelectItem>
                    <SelectItem value="Sizing & Styling Advice">Sizing & Styling Advice</SelectItem>
                    <SelectItem value="Returns & Exchanges">Returns & Exchanges</SelectItem>
                    <SelectItem value="Bespoke & Private Consultation">Bespoke & Private Consultation</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Message */}
        <Controller
          control={control}
          name="message"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <FieldLabel htmlFor={field.name} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Message <span className="text-foreground">*</span>
              </FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                rows={5}
                placeholder="How may our concierge assist you today?"
                className="p-3.5 text-xs sm:text-sm bg-background border border-input rounded-xs resize-none leading-relaxed min-h-[120px]"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <StoreButton
        type="submit"
        disabled={isSubmitting}
        className="gap-2 w-full sm:w-auto self-start px-8"
      >
        <Send className="w-4 h-4" />
        <span>Submit Inquiry</span>
      </StoreButton>
    </form>
  )
}
