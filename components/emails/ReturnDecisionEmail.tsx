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

export interface ReturnDecisionEmailProps {
  returnNumber: string
  orderNumber: string
  customerName: string
  status: "approved" | "rejected"
  instructionsOrReason: string
  storeEmail?: string
  storePhone?: string
}

export function ReturnDecisionEmail({
  returnNumber = "RET-1001",
  orderNumber = "AR-1001",
  customerName = "Valued Patron",
  status = "approved",
  instructionsOrReason = "Please package the unworn garments with original tags intact in the AR Boutique presentation box.",
  storeEmail = "concierge@arboutique.ae",
  storePhone = "+971 50 123 4567",
}: ReturnDecisionEmailProps) {
  const isApproved = status === "approved"

  return (
    <Html>
      <Head />
      <Preview>
        {isApproved
          ? `Return Approved: Instructions for Return #${returnNumber} - AR Boutique`
          : `Update Regarding Return Request #${returnNumber} - AR Boutique`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={logoText}>AR BOUTIQUE</Text>
            <Text style={taglineText}>DUBAI ATELIER • INDIAN HERITAGE COUTURE</Text>
          </Section>

          <Hr style={divider} />

          {/* Heading */}
          <Section style={greetingSection}>
            <Text style={isApproved ? badgeSuccess : badgeDestructive}>
              {isApproved ? "RETURN APPROVED" : "RETURN STATUS UPDATE"}
            </Text>
            <Heading style={heading}>
              {isApproved ? `Return Request #${returnNumber} Approved` : `Return Request #${returnNumber}`}
            </Heading>
            <Text style={subheading}>
              Dear {customerName}, this email is regarding your return request for order #{orderNumber}.
            </Text>
          </Section>

          {/* Main Content Box */}
          {isApproved ? (
            <Section style={approvedBox}>
              <Text style={approvedTitle}>PICKUP & PACKAGING INSTRUCTIONS</Text>
              <Text style={bodyText}>{instructionsOrReason}</Text>
              <Text style={noteText}>
                Our courier will coordinate collection at your delivery address within 1–2 business
                days. Please ensure all original tags, boutique packaging, and craft accessories are
                included.
              </Text>
            </Section>
          ) : (
            <Section style={rejectedBox}>
              <Text style={rejectedTitle}>DECISION DETAILS</Text>
              <Text style={bodyText}>{instructionsOrReason}</Text>
              <Text style={noteText}>
                As per boutique policy, items must be unworn, in original condition with tags
                attached, and requested within our 7-day complimentary window.
              </Text>
            </Section>
          )}

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerHeading}>ATELIER CONCIERGE</Text>
            <Text style={footerText}>
              Need personal assistance? Contact our boutique concierge directly at{" "}
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

const badgeSuccess: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.2em",
  color: "#059669",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
}

const badgeDestructive: React.CSSProperties = {
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

const approvedBox: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  padding: "20px",
  marginBottom: "24px",
}

const approvedTitle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#15803d",
  margin: "0 0 8px",
}

const rejectedBox: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fee2e2",
  padding: "20px",
  marginBottom: "24px",
}

const rejectedTitle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#991b1b",
  margin: "0 0 8px",
}

const bodyText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#1c1917",
  margin: "0 0 12px",
}

const noteText: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#57534e",
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
