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

export interface ReturnRequestedItemData {
  product_name: string
  colour_name: string
  size_name?: string | null
  quantity: number
  reason: string
}

export interface ReturnRequestedEmailProps {
  returnNumber: string
  orderNumber: string
  customerName: string
  items: ReturnRequestedItemData[]
  customerComment?: string
  isBankTransferRefund?: boolean
  bankDetails?: {
    bankName: string
    accountHolderName: string
    iban: string
  }
  storeEmail?: string
  storePhone?: string
}

export function ReturnRequestedEmail({
  returnNumber = "RET-1001",
  orderNumber = "AR-1001",
  customerName = "Valued Patron",
  items = [],
  customerComment,
  isBankTransferRefund = false,
  bankDetails,
  storeEmail = "concierge@arboutique.ae",
  storePhone = "+971 50 123 4567",
}: ReturnRequestedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Return Request Received #{returnNumber} - AR Boutique</Preview>
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
            <Text style={badge}>RETURN & EXCHANGE CARE</Text>
            <Heading style={heading}>Return Request Received</Heading>
            <Text style={subheading}>
              Dear {customerName}, we have received your return request{" "}
              <strong style={{ color: "#111" }}>#{returnNumber}</strong> for order #{orderNumber}.
              Our quality concierge will inspect your request within 24 to 48 hours.
            </Text>
          </Section>

          {/* Process Timeline Card */}
          <Section style={timelineBox}>
            <Text style={timelineTitle}>NEXT STEPS</Text>
            <Text style={timelineStep}>
              <strong>1. Atelier Review:</strong> Our team verifies garment eligibility against
              our 7-day care policy.
            </Text>
            <Text style={timelineStep}>
              <strong>2. Pickup Instructions:</strong> Once approved, you will receive courier
              pickup instructions via email and WhatsApp.
            </Text>
            <Text style={timelineStep}>
              <strong>3. Inspection & Refund:</strong> Upon physical receipt at our Dubai atelier,
              your refund will be processed promptly.
            </Text>
          </Section>

          {/* Items requested for return */}
          <Section style={sectionWrapper}>
            <Text style={sectionTitle}>ITEMS REQUESTED FOR RETURN</Text>
            {items.map((it, idx) => (
              <div key={idx} style={itemRow}>
                <Row>
                  <Column style={{ width: "70%" }}>
                    <Text style={itemName}>{it.product_name}</Text>
                    <Text style={itemMeta}>
                      Colour: {it.colour_name}
                      {it.size_name ? ` • Size: ${it.size_name}` : ""}
                    </Text>
                    <Text style={itemReason}>Reason: {it.reason}</Text>
                  </Column>
                  <Column style={{ width: "30%", textAlign: "right" }}>
                    <Text style={itemQty}>Qty: {it.quantity}</Text>
                  </Column>
                </Row>
                {idx < items.length - 1 && <Hr style={lightDivider} />}
              </div>
            ))}
          </Section>

          {/* Customer comment */}
          {customerComment && (
            <Section style={sectionWrapper}>
              <Text style={sectionTitle}>YOUR NOTES</Text>
              <div style={notesBox}>
                <Text style={notesText}>"{customerComment}"</Text>
              </div>
            </Section>
          )}

          {/* Bank Transfer info for COD orders */}
          {isBankTransferRefund && bankDetails && (
            <Section style={bankBox}>
              <Text style={bankTitle}>SUBMITTED UAE BANK ACCOUNT (FOR COD REFUND)</Text>
              <Text style={bankLine}>Bank: {bankDetails.bankName}</Text>
              <Text style={bankLine}>Beneficiary: {bankDetails.accountHolderName}</Text>
              <Text style={bankLine}>IBAN: {bankDetails.iban}</Text>
            </Section>
          )}

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerHeading}>ATELIER CONCIERGE</Text>
            <Text style={footerText}>
              Questions regarding returns or sizing exchanges? Contact us directly at{" "}
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

const lightDivider: React.CSSProperties = {
  borderTop: "1px solid #f4f2ee",
  margin: "12px 0",
}

const greetingSection: React.CSSProperties = {
  textAlign: "left" as const,
  marginBottom: "24px",
}

const badge: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.2em",
  color: "#78716c",
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

const timelineBox: React.CSSProperties = {
  backgroundColor: "#fbfaf8",
  border: "1px solid #eae7e1",
  padding: "18px 20px",
  marginBottom: "24px",
}

const timelineTitle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#78716c",
  margin: "0 0 8px",
}

const timelineStep: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "1.6",
  color: "#44403c",
  margin: "0 0 6px",
}

const sectionWrapper: React.CSSProperties = {
  marginBottom: "24px",
}

const sectionTitle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.15em",
  color: "#78716c",
  textTransform: "uppercase" as const,
  margin: "0 0 14px",
}

const itemRow: React.CSSProperties = {
  padding: "6px 0",
}

const itemName: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "14px",
  fontWeight: 500,
  color: "#111111",
  margin: "0 0 4px",
}

const itemMeta: React.CSSProperties = {
  fontSize: "12px",
  color: "#57534e",
  margin: "0 0 2px",
}

const itemReason: React.CSSProperties = {
  fontSize: "12px",
  color: "#78716c",
  fontStyle: "italic",
  margin: 0,
}

const itemQty: React.CSSProperties = {
  fontSize: "12px",
  color: "#78716c",
  margin: 0,
}

const notesBox: React.CSSProperties = {
  backgroundColor: "#fcfbf9",
  border: "1px solid #eae7e1",
  padding: "14px 18px",
}

const notesText: React.CSSProperties = {
  fontSize: "13px",
  fontStyle: "italic",
  color: "#57534e",
  lineHeight: "1.5",
  margin: 0,
}

const bankBox: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  padding: "16px 20px",
  marginBottom: "24px",
}

const bankTitle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#166534",
  margin: "0 0 6px",
}

const bankLine: React.CSSProperties = {
  fontSize: "12px",
  color: "#14532d",
  margin: "0 0 4px",
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
