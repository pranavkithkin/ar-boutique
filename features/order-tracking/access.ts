export function canRevealTrackingId(
  customerSubject: string | null | undefined,
  signedInSubject: string | null | undefined,
  storedSession: string | null | undefined,
  providedSession: string | null | undefined,
): boolean {
  const ownsOrder = Boolean(customerSubject && signedInSubject && customerSubject === signedInSubject)
  const hasCheckoutSession = Boolean(storedSession && providedSession && storedSession === providedSession)
  return ownsOrder || hasCheckoutSession
}
