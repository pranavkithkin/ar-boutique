import * as React from "react"
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

export interface OrderCancelledEmailProps {
  orderNumber: string
  customerName: string
  cancellationReason?: string
  paymentMethod: "card" | "cod"
  refundStatusText?: string
  storeEmail?: string
  storePhone?: string
}

export function OrderCancelledEmail({
  orderNumber = "AR-1001",
  customerName = "Valued Patron",
  cancellationReason,
  paymentMethod = "cod",
  refundStatusText,
  storeEmail = "concierge@arboutique.ae",
  storePhone = "+971 50 123 4567",
}: OrderCancelledEmailProps) {
  const isCod = paymentMethod === "cod"

  return (
    <Html>
      <Head />
      <Preview>Important: Order #{orderNumber} Cancellation Notice - AR Boutique</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header & Logo */}
          <Section style={headerSection}>
            <Text style={logoText}>AR BOUTIQUE</Text>
            <Text style={taglineText}>DUBAI ATELIER • INDIAN HERITAGE COUTURE</Text>
          </Section>

          <Hr style={divider} />

          {/* Heading */}
          <Section style={greetingSection}>
            <Text style={badge}>ORDER STATUS UPDATE</Text>
            <Heading style={heading}>Order #{orderNumber} Cancelled</Heading>
            <Text style={subheading}>
              Dear {customerName}, this email confirms that order{" "}
              <strong style={{ color: "#111" }}>#{orderNumber}</strong> has been cancelled.
            </Text>
          </Section>

          {/* Reason Box */}
          {cancellationReason && (
            <Section style={reasonBox}>
              <Text style={reasonTitle}>REASON FOR CANCELLATION</Text>
              <Text style={reasonText}>{cancellationReason}</Text>
            </Section>
          )}

          {/* Payment & Refund Note */}
          <Section style={infoBox}>
            <Text style={infoTitle}>PAYMENT DETAILS</Text>
            {isCod ? (
              <Text style={infoText}>
                As this was a Cash on Delivery order, no payment was collected and no charges
                apply. Any inventory reservations for this order have been released.
              </Text>
            ) : (
              <Text style={infoText}>
                {refundStatusText ||
                  "A full refund for your online payment has been submitted to your original card. Funds typically appear on your statement within 5–10 business days."}
              </Text>
            )}
          </Section>

          {/* Concierge Support Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerHeading}>WE ARE HERE TO ASSIST</Text>
            <Text style={footerText}>
              If this was cancelled in error or you wish to replace your order, please reach our
              atelier concierge at{" "}
              <a href={`mailto:${storeEmail}`} style={link}>
                {storeEmail}
              </a>{" "}
              or WhatsApp{" "}
              <a href={`https://wa.me/${storePhone.replace(/[^0-9]/g, "")}`} style={link}>
                {storePhone}
              </a>
              .
            </Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} AR Boutique. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ── Styles ──
const main: React.CSSProperties = {
  backgroundColor: "#fcfbf9",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: "0 auto",
  padding: "32px 0",
}

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #eae7e1",
  maxWidth: "600px",
  margin: "0 auto",
  padding: "40px",
}

const headerSection: React.CSSProperties = {
  textAlign: "center" as const,
  paddingBottom: "16px",
}

const logoText: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "24px",
  fontWeight: 600,
  letterSpacing: "0.2em",
  color: "#111111",
  margin: "0 0 6px",
}

const taglineText: React.CSSProperties = {
  fontSize: "10px",
  letterSpacing: "0.25em",
  color: "#78716c",
  textTransform: "uppercase" as const,
  margin: 0,
}

const divider: React.CSSProperties = {
  borderTop: "1px solid #eae7e1",
  margin: "24px 0",
}

const greetingSection: React.CSSProperties = {
  textAlign: "left" as const,
  marginBottom: "24px",
}

const badge: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.2em",
  color: "#dc2626",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
}

const heading: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "22px",
  fontWeight: 500,
  color: "#111111",
  margin: "0 0 10px",
}

const subheading: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#44403c",
  margin: 0,
}

const reasonBox: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fee2e2",
  padding: "16px 20px",
  marginBottom: "20px",
}

const reasonTitle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#991b1b",
  margin: "0 0 4px",
}

const reasonText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#7f1d1d",
  margin: 0,
}

const infoBox: React.CSSProperties = {
  backgroundColor: "#fcfbf9",
  border: "1px solid #eae7e1",
  padding: "16px 20px",
  marginBottom: "24px",
}

const infoTitle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#78716c",
  margin: "0 0 6px",
}

const infoText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#44403c",
  margin: 0,
}

const footerSection: React.CSSProperties = {
  textAlign: "center" as const,
  paddingTop: "8px",
}

const footerHeading: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.2em",
  color: "#111111",
  margin: "0 0 6px",
}

const footerText: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "1.6",
  color: "#78716c",
  margin: "0 0 16px",
}

const footerCopyright: React.CSSProperties = {
  fontSize: "10px",
  color: "#a8a29e",
  margin: 0,
}

const link: React.CSSProperties = {
  color: "#111111",
  textDecoration: "underline",
}
