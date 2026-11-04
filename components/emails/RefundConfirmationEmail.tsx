import * as React from "react"
import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components"

export interface RefundConfirmationEmailProps {
  orderNumber: string
  returnNumber?: string
  customerName: string
  refundAmountAed: string
  method: "card" | "bank_transfer"
  bankTransferDate?: string
  bankTransferReference?: string
  storeEmail?: string
  storePhone?: string
}

export function RefundConfirmationEmail({
  orderNumber = "AR-1001",
  returnNumber = "RET-1001",
  customerName = "Valued Patron",
  refundAmountAed = "AED 1,260.00",
  method = "card",
  bankTransferDate = "October 20, 2026",
  bankTransferReference = "TRF-9812456",
  storeEmail = "concierge@arboutique.ae",
  storePhone = "+971 50 123 4567",
}: RefundConfirmationEmailProps) {
  const isBankTransfer = method === "bank_transfer"

  return (
    <Html>
      <Head />
      <Preview>Refund Confirmation: {refundAmountAed} - AR Boutique</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={logoText}>AR BOUTIQUE</Text>
            <Text style={taglineText}>DUBAI ATELIER • INDIAN HERITAGE COUTURE</Text>
          </Section>

          <Hr style={divider} />

          {/* Greeting */}
          <Section style={greetingSection}>
            <Text style={badge}>REFUND ISSUED</Text>
            <Heading style={heading}>Your Refund Has Been Processed</Heading>
            <Text style={subheading}>
              Dear {customerName}, a refund of{" "}
              <strong style={{ color: "#111" }}>{refundAmountAed}</strong> has been issued for{" "}
              {returnNumber ? `return #${returnNumber} (Order #${orderNumber})` : `order #${orderNumber}`}.
            </Text>
          </Section>

          {/* Refund Details Box */}
          <Section style={detailsCard}>
            <Row style={detailRow}>
              <Column style={{ width: "50%" }}>
                <Text style={label}>REFUND AMOUNT</Text>
                <Text style={amountValue}>{refundAmountAed}</Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text style={label}>REFUND METHOD</Text>
                <Text style={methodValue}>
                  {isBankTransfer ? "UAE Bank Transfer" : "Original Payment Card"}
                </Text>
              </Column>
            </Row>

            {isBankTransfer ? (
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
                <Text style={subLabel}>TRANSFER REFERENCE</Text>
                <Text style={refValue}>{bankTransferReference || "N/A"}</Text>
                {bankTransferDate && (
                  <Text style={dateValue}>Processed on {bankTransferDate}</Text>
                )}
                <Text style={timingNotice}>
                  Direct UAE bank transfers typically reflect in your account within 1–2 UAE
                  banking days depending on your bank.
                </Text>
              </div>
            ) : (
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
                <Text style={timingNotice}>
                  Card refunds are processed via Stripe directly back to your payment card. Most
                  banks post the credit within 5 to 10 business days.
                </Text>
              </div>
            )}
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerHeading}>ATELIER CONCIERGE</Text>
            <Text style={footerText}>
              If you have any questions regarding your refund statement, our concierge is here to
              help at{" "}
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
  color: "#059669",
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

const detailsCard: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  padding: "20px",
  marginBottom: "24px",
}

const detailRow: React.CSSProperties = {
  margin: 0,
}

const label: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#64748b",
  margin: "0 0 4px",
}

const amountValue: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#0f172a",
  margin: 0,
}

const methodValue: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#0f172a",
  margin: 0,
}

const subLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#64748b",
  margin: "0 0 2px",
}

const refValue: React.CSSProperties = {
  fontSize: "13px",
  fontFamily: "monospace",
  fontWeight: 600,
  color: "#0f172a",
  margin: "0 0 2px",
}

const dateValue: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
  margin: "0 0 8px",
}

const timingNotice: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#475569",
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
