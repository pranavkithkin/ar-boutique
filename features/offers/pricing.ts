/** Split indivisible fils across Stripe units without changing the order's exact net line total. */
export function splitDiscountedLine(gross: number, discount: number, quantity: number) {
  if (![gross, discount, quantity].every(Number.isSafeInteger) || quantity < 1 || discount < 0 || discount > gross) throw new Error("Invalid line pricing")
  const net = gross - discount
  const base = Math.floor(net / quantity)
  const remainder = net % quantity
  return [
    ...(quantity > remainder ? [{ unitPriceFils: base, quantity: quantity - remainder }] : []),
    ...(remainder ? [{ unitPriceFils: base + 1, quantity: remainder }] : []),
  ]
}

/** Allocate a net line's pennies across successive partial returns without ever exceeding paid value. */
export function returnLineAmount(net: number, quantity: number, alreadyReturned: number, requested: number) {
  if (![net, quantity, alreadyReturned, requested].every(Number.isSafeInteger) || net < 0 || quantity < 1 || alreadyReturned < 0 || requested < 1 || alreadyReturned + requested > quantity) throw new Error("Invalid return quantity")
  return Math.floor(net * (alreadyReturned + requested) / quantity) - Math.floor(net * alreadyReturned / quantity)
}
