"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCartStore } from "@/features/cart/store"
import { formatAED, calculateVatPortion } from "@/lib/money"
import { StoreButton } from "@/components/store/StoreButton"
import {
  checkoutFormSchema,
  UAE_EMIRATES,
  type CheckoutFormValues,
} from "../schemas"
import { placeCheckoutOrderAction } from "../actions"
import type { CheckoutConfig, SavedAddressCandidate } from "../types"
import {
  CreditCard,
  Banknote,
  ShoppingBag,
  ArrowRight,
  ChevronDown,
  MapPin,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react"

interface CheckoutViewProps {
  config: CheckoutConfig
}

export function CheckoutView({ config }: CheckoutViewProps) {
  const router = useRouter()
  const cartItems = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)

  const [mounted, setMounted] = React.useState(false)
  const [savedAddresses, setSavedAddresses] = React.useState<SavedAddressCandidate[]>([])
  const [selectedSavedId, setSelectedSavedId] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "+971 ",
      emirate: "Dubai",
      area: "",
      street: "",
      building: "",
      apartment: "",
      landmark: "",
      instructions: "",
      paymentMethod: "card",
      saveAddress: false,
    },
  })

  const currentPaymentMethod = watch("paymentMethod")

  // Load saved addresses from localStorage on mount (synced from Account page)
  React.useEffect(() => {
    setMounted(true)
    try {
      const storedAddresses = localStorage.getItem("ar_account_addresses")
      if (storedAddresses) {
        const parsed: SavedAddressCandidate[] = JSON.parse(storedAddresses)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAddresses(parsed)
          // Automatically pick default address if available
          const defaultAddr = parsed.find((a) => a.isDefault) || parsed[0]
          if (defaultAddr) {
            setSelectedSavedId(defaultAddr.id)
            setValue("fullName", defaultAddr.recipientName || "")
            setValue("phone", defaultAddr.phone || "+971 ")
            if (UAE_EMIRATES.includes(defaultAddr.emirate as any)) {
              setValue("emirate", defaultAddr.emirate as any)
            }
            setValue("area", defaultAddr.area || "")
            setValue("street", defaultAddr.street || "")
            setValue("building", defaultAddr.building || "")
            setValue("apartment", defaultAddr.apartment || "")
            setValue("landmark", defaultAddr.landmark || "")
          }
        }
      }

      // If user profile is saved, prefill email if still empty
      const storedProfile = localStorage.getItem("ar_account_profile")
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile)
        if (parsedProfile.email) {
          setValue("email", parsedProfile.email)
        }
        if (!storedAddresses && parsedProfile.firstName) {
          setValue("fullName", `${parsedProfile.firstName} ${parsedProfile.lastName}`.trim())
          if (parsedProfile.phone) {
            setValue("phone", parsedProfile.phone)
          }
        }
      }
    } catch {
      // Ignore localStorage access issues
    }
  }, [setValue])

  const handleSelectSavedAddress = (addr: SavedAddressCandidate) => {
    setSelectedSavedId(addr.id)
    setValue("fullName", addr.recipientName)
    setValue("phone", addr.phone)
    if (UAE_EMIRATES.includes(addr.emirate as any)) {
      setValue("emirate", addr.emirate as any)
    }
    setValue("area", addr.area)
    setValue("street", addr.street)
    setValue("building", addr.building)
    setValue("apartment", addr.apartment || "")
    setValue("landmark", addr.landmark || "")
  }

  // Calculate pricing breakdown
  const subtotalFils = React.useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.priceFils * item.quantity, 0)
  }, [cartItems])

  const isFreeDelivery = subtotalFils >= config.freeDeliveryThresholdFils
  const deliveryFeeFils = isFreeDelivery ? 0 : config.deliveryFeeFils
  const isCodSelected = currentPaymentMethod === "cod"
  const codFeeFils = isCodSelected ? config.codFeeFils : 0
  const estimatedTotalFils = subtotalFils + deliveryFeeFils + codFeeFils
  const vatPortionFils = calculateVatPortion(estimatedTotalFils)

  // Evaluate COD availability rules
  const isCodEligibleByAmount = estimatedTotalFils <= config.codMaxOrderFils
  const isCodAvailable = config.codEnabled && isCodEligibleByAmount

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitError(null)

    // Check COD rules before submitting
    if (values.paymentMethod === "cod" && !isCodAvailable) {
      setSubmitError(
        !config.codEnabled
          ? "Cash on delivery is currently turned off."
          : `Cash on delivery is only available for orders up to AED ${config.codMaxOrderFils / 100}.`
      )
      return
    }

    try {
      const result = await placeCheckoutOrderAction(values, cartItems)

      if (!result.success || !result.redirectUrl) {
        setSubmitError(result.error || "Failed to complete checkout. Please review your details.")
        return
      }

      // If user checked "Save this address", persist to localStorage for future orders
      if (values.saveAddress) {
        try {
          const newCandidate: SavedAddressCandidate = {
            id: `addr_${Date.now()}`,
            label: "Checkout Address",
            recipientName: values.fullName,
            phone: values.phone,
            emirate: values.emirate,
            area: values.area,
            street: values.street,
            building: values.building,
            apartment: values.apartment,
            landmark: values.landmark,
            isDefault: false,
          }
          const existing = [...savedAddresses, newCandidate]
          localStorage.setItem("ar_account_addresses", JSON.stringify(existing))
        } catch {
          // Ignore
        }
      }

      // Clear shopping bag after order is recorded
      clearCart()

      // Redirect to confirmed destination
      router.push(result.redirectUrl)
    } catch (err: any) {
      setSubmitError(err?.message || "An unexpected network error occurred. Please try again.")
    }
  }

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-foreground" />
          <span>Preparing secure checkout...</span>
        </div>
      </div>
    )
  }

  // Empty cart fallback
  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
          <ShoppingBag className="w-8 h-8 opacity-60" />
        </div>
        <h2 className="text-2xl font-sans font-semibold tracking-tight text-foreground">
          Your shopping bag is empty
        </h2>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
          Explore our latest festive silhouettes, co-ord sets, and timeless ensembles to begin checkout.
        </p>
        <div className="mt-6">
          <Link href="/collections">
            <StoreButton className="text-xs uppercase tracking-widest px-8 h-11">
              Explore Collections
            </StoreButton>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Header */}
      <div className="mb-8 pb-6 border-b border-border/70">
        <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
          Express Boutique Checkout
        </span>
        <h1 className="text-2xl sm:text-3xl font-sans font-semibold tracking-tight text-foreground mt-1">
          Delivery & Payment
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Delivery Details & Payment Choice */}
          <div className="lg:col-span-7 space-y-8">
            {/* Quick Prefill from Saved Addresses (if customer has saved ones) */}
            {savedAddresses.length > 0 && (
              <div className="p-4 sm:p-5 bg-card border border-border rounded-xs shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Saved UAE Addresses
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    1-Click Autofill
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedSavedId === addr.id
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`text-left p-3 rounded-xs border text-xs transition-all ${
                          isSelected
                            ? "border-primary bg-secondary/40 shadow-xs"
                            : "border-border/70 hover:border-border bg-background"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {addr.label || addr.recipientName}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                        </div>
                        <p className="text-muted-foreground truncate mt-0.5">
                          {addr.building}, {addr.street}
                        </p>
                        <p className="text-muted-foreground font-medium text-[11px]">
                          {addr.area}, {addr.emirate}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Delivery Address Form */}
            <div className="bg-card border border-border rounded-xs p-5 sm:p-7 shadow-xs space-y-5">
              <div className="border-b border-border/60 pb-3">
                <h2 className="text-base font-sans font-semibold tracking-tight text-foreground">
                  1. Shipping Destination
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Where should we deliver your luxury parcel?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register("fullName")}
                    placeholder="e.g. Fatima Al Mansoori"
                    className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                  {errors.fullName && (
                    <p className="text-[11px] text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Email Address (For Confirmation) *
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="name@example.com"
                    className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                  {errors.email && (
                    <p className="text-[11px] text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* UAE Mobile */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    UAE Mobile Number *
                  </label>
                  <input
                    type="tel"
                    {...register("phone")}
                    placeholder="+971 50 123 4567"
                    className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                {/* Emirate Select */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Emirate *
                  </label>
                  <div className="relative">
                    <select
                      {...register("emirate")}
                      className="w-full h-10 px-3 pr-8 text-xs bg-background border border-input rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer"
                    >
                      {UAE_EMIRATES.map((em) => (
                        <option key={em} value={em}>
                          {em}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                  {errors.emirate && (
                    <p className="text-[11px] text-destructive">{errors.emirate.message}</p>
                  )}
                </div>

                {/* Area / District */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Area / District *
                  </label>
                  <input
                    type="text"
                    {...register("area")}
                    placeholder="e.g. Jumeirah 1, Downtown, Al Barsha"
                    className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                  {errors.area && (
                    <p className="text-[11px] text-destructive">{errors.area.message}</p>
                  )}
                </div>

                {/* Street Address */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    {...register("street")}
                    placeholder="e.g. 12B Street, Al Wasl Road"
                    className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                  {errors.street && (
                    <p className="text-[11px] text-destructive">{errors.street.message}</p>
                  )}
                </div>

                {/* Building / Villa */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Villa or Building Name *
                  </label>
                  <input
                    type="text"
                    {...register("building")}
                    placeholder="e.g. Villa 48, Marina Gate 1"
                    className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                  {errors.building && (
                    <p className="text-[11px] text-destructive">{errors.building.message}</p>
                  )}
                </div>

                {/* Apartment / Suite (Optional) */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Apartment / Suite (Optional)
                  </label>
                  <input
                    type="text"
                    {...register("apartment")}
                    placeholder="e.g. Apt 1402"
                    className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                </div>

                {/* Landmark (Optional) */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    {...register("landmark")}
                    placeholder="e.g. Near BoxPark, Opposite Mosque"
                    className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                </div>

                {/* Delivery Instructions (Optional) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Courier Notes / Gate Code (Optional)
                  </label>
                  <input
                    type="text"
                    {...register("instructions")}
                    placeholder="e.g. Leave with building security, call upon arrival"
                    className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                </div>
              </div>

              {/* Save Address Checkbox */}
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                <input
                  type="checkbox"
                  {...register("saveAddress")}
                  className="rounded-xs border-input h-4 w-4 text-primary focus:ring-ring"
                />
                <span>Save this address to my account for faster future checkout</span>
              </label>
            </div>

            {/* Payment Choice Section */}
            <div className="bg-card border border-border rounded-xs p-5 sm:p-7 shadow-xs space-y-5">
              <div className="border-b border-border/60 pb-3">
                <h2 className="text-base font-sans font-semibold tracking-tight text-foreground">
                  2. Payment Method
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select your preferred payment method across the UAE.
                </p>
              </div>

              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <div className="space-y-3">
                    {/* Option 1: Card, Apple Pay, Google Pay */}
                    <label
                      className={`block p-4 rounded-xs border cursor-pointer transition-all ${
                        field.value === "card"
                          ? "border-primary bg-secondary/30 shadow-xs ring-1 ring-primary/20"
                          : "border-border bg-background hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={field.value === "card"}
                            onChange={() => field.onChange("card")}
                            className="h-4 w-4 text-primary border-input focus:ring-ring mt-0.5"
                          />
                          <div>
                            <span className="block text-xs font-semibold text-foreground">
                              Card, Apple Pay or Google Pay
                            </span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5">
                              Instant & secure payment via Stripe. Visa, Mastercard, AMEX accepted.
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </label>

                    {/* Option 2: Cash on Delivery */}
                    <label
                      className={`block p-4 rounded-xs border transition-all ${
                        !isCodAvailable
                          ? "opacity-60 cursor-not-allowed bg-muted/40 border-border"
                          : field.value === "cod"
                          ? "border-primary bg-secondary/30 shadow-xs ring-1 ring-primary/20 cursor-pointer"
                          : "border-border bg-background hover:border-border/80 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            disabled={!isCodAvailable}
                            checked={field.value === "cod"}
                            onChange={() => isCodAvailable && field.onChange("cod")}
                            className="h-4 w-4 text-primary border-input focus:ring-ring mt-0.5 disabled:opacity-50"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">
                                Cash on Delivery (COD)
                              </span>
                              {!isCodAvailable && (
                                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                                  Unavailable
                                </span>
                              )}
                            </div>
                            <span className="block text-[11px] text-muted-foreground mt-0.5">
                              Pay in cash when your order arrives. We will call or WhatsApp you to confirm delivery.
                            </span>

                            {/* Eligibility feedback message if disabled */}
                            {!isCodAvailable && (
                              <p className="text-[11px] text-destructive mt-1.5 font-medium">
                                {!config.codEnabled
                                  ? "Cash on delivery is currently paused in store settings."
                                  : `Available only for orders up to AED ${config.codMaxOrderFils / 100} (Current total: ${formatAED(estimatedTotalFils)}).`}
                              </p>
                            )}
                          </div>
                        </div>

                        <Banknote className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>
                    </label>
                  </div>
                )}
              />

              {errors.paymentMethod && (
                <p className="text-[11px] text-destructive">{errors.paymentMethod.message}</p>
              )}
            </div>

            {/* Error Alert (if submission failed) */}
            {submitError && (
              <div className="p-4 rounded-xs bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{submitError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <StoreButton
                type="submit"
                disabled={isSubmitting}
                className="w-full h-13 uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-sm font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : isCodSelected ? (
                  <>
                    <span>Place Order ({formatAED(estimatedTotalFils)} on delivery)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Pay {formatAED(estimatedTotalFils)} with Card</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </StoreButton>

              <p className="text-[11px] text-muted-foreground text-center mt-3">
                By placing this order, you agree to AR Boutique’s 7-day complimentary return policy and terms of service.
              </p>
            </div>
          </div>

          {/* Right Column: Sticky Order Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            <div className="bg-card border border-border rounded-xs p-5 sm:p-6 shadow-xs space-y-5">
              <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                <h3 className="text-base font-sans font-semibold tracking-tight text-foreground">
                  Order Summary
                </h3>
                <span className="text-xs font-mono text-muted-foreground">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)} piece(s)
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-border/50 max-h-[380px] overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.variantId || item.sku} className="py-3 flex items-start gap-3">
                    <div className="relative w-14 h-18 bg-muted rounded-xs overflow-hidden shrink-0 border border-border/40">
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        className="object-cover object-top"
                        sizes="56px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-foreground truncate">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {item.colourName} • Size: {item.sizeLabel}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">
                        SKU: {item.sku}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="font-semibold text-foreground tabular-nums">
                          {formatAED(item.priceFils * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="border-t border-border/60 pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">Bag Subtotal</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatAED(subtotalFils)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">UAE Doorstep Delivery</span>
                  <span className={`font-semibold tabular-nums ${isFreeDelivery ? "text-emerald-600" : "text-foreground"}`}>
                    {isFreeDelivery ? "FREE" : formatAED(deliveryFeeFils)}
                  </span>
                </div>

                {isCodSelected && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Cash on Delivery Service</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {codFeeFils === 0 ? "FREE" : formatAED(codFeeFils)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline text-[11px]">
                  <span className="text-muted-foreground/80">Included 5% UAE VAT</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatAED(vatPortionFils)}
                  </span>
                </div>

                <div className="pt-3 border-t border-border flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-foreground">Total to Pay</span>
                  <span className="text-xl font-semibold text-foreground tabular-nums font-sans">
                    {formatAED(estimatedTotalFils)}
                  </span>
                </div>
              </div>

              {/* Free delivery progress meter if close */}
              {!isFreeDelivery && subtotalFils < config.freeDeliveryThresholdFils && (
                <div className="p-3 bg-secondary/50 rounded-xs border border-border text-[11px] text-muted-foreground">
                  <p>
                    Add{" "}
                    <strong className="text-foreground">
                      {formatAED(config.freeDeliveryThresholdFils - subtotalFils)}
                    </strong>{" "}
                    more to qualify for complimentary UAE white-glove delivery.
                  </p>
                </div>
              )}
            </div>

            {/* Service & Delivery Assurances */}
            <div className="p-4 bg-muted/30 border border-border rounded-xs space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Complimentary UAE Concierge Care</span>
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
                <li>Packed with bespoke AR Boutique luxury packaging</li>
                <li>Fast dispatch across Dubai, Abu Dhabi & all Emirates in 1–2 days</li>
                <li>WhatsApp concierge confirmation on active orders</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
