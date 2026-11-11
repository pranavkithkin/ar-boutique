interface CheckoutAttempt { fingerprint: string; key: string }

/** Reuse the attempt across network retries, but create a new one for changed checkout details. */
export function getCheckoutAttempt(
  fingerprint: string,
  previous: CheckoutAttempt | null,
  createKey: () => string,
): CheckoutAttempt {
  return previous?.fingerprint === fingerprint ? previous : { fingerprint, key: createKey() }
}
