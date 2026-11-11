import * as React from "react"
import {
  Body,
  Button,
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

export interface ShippedItemEmailData {
  product_name: string
  colour_name: string
  size_name?: string | null
  sku?: string | null
  quantity: number
}

export interface OrderShippedEmailProps {
  orderNumber: string
  customerName: string
  customerPhone?: string
  courier?: string
  trackingNumber?: string
  trackingUrl?: string
  items: ShippedItemEmailData[]
  deliveryAddress: string
  storeEmail?: string
  storePhone?: string
}

export function OrderShippedEmail({
  orderNumber = "AR-1001",
  customerName = "Valued Patron",
  courier,
  trackingNumber,
  trackingUrl,
  items = [],
  deliveryAddress = "Jumeirah 1, Dubai, United Arab Emirates",
  storeEmail = "concierge@arboutique.ae",
  storePhone = "+971 50 123 4567",
}: OrderShippedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your AR Boutique Order #{orderNumber} has Shipped</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header & Logo */}
          <Section style={headerSection}>
            <Text style={logoText}>AR BOUTIQUE</Text>
            <Text style={taglineText}>DUBAI ATELIER • INDIAN HERITAGE COUTURE</Text>
          </Section>

          <Hr style={divider} />

          {/* Greeting */}
          <Section style={greetingSection}>
            <Text style={badge}>DISPATCH CONFIRMATION</Text>
            <Heading style={heading}>Your Order is on Its Way</Heading>
            <Text style={subheading}>
              Dear {customerName}, your garments from order{" "}
              <strong style={{ color: "#111" }}>#{orderNumber}</strong> have been packaged with
              atelier care and handed over to our courier partner.
            </Text>
          </Section>

          {/* Courier & Tracking Card */}
          <Section style={courierCard}>
            <Row>
              {courier?.trim() && <Column style={{ width: "50%" }}>
                <Text style={metaLabel}>COURIER PARTNER</Text>
                <Text style={metaValue}>{courier}</Text>
              </Column>}
              <Column style={{ width: "50%" }}>
                <Text style={metaLabel}>TRACKING NUMBER</Text>
                <Text style={trackingMono}>{trackingNumber?.trim() || "Tracking details are not available yet."}</Text>
              </Column>
            </Row>
            {trackingUrl && (
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <Button style={button} href={trackingUrl}>
                  Track Shipment Online
                </Button>
              </div>
            )}
          </Section>

          {/* Delivery Destination */}
          <Section style={sectionWrapper}>
            <Text style={sectionTitle}>DELIVERING TO</Text>
            <div style={addressBox}>
              <Text style={addressText}>{deliveryAddress}</Text>
              <Text style={dispatchNotice}>
                Standard UAE deliveries arrive within 1–2 business days. The courier driver will
                coordinate with you via mobile prior to arrival.
              </Text>
            </div>
          </Section>

          {/* Items in this Shipment */}
          <Section style={sectionWrapper}>
            <Text style={sectionTitle}>ITEMS IN SHIPMENT</Text>
            {items.map((it, idx) => (
              <div key={idx} style={itemRow}>
                <Row>
                  <Column style={{ width: "75%" }}>
                    <Text style={itemName}>{it.product_name}</Text>
                    <Text style={itemMeta}>
                      Colour: {it.colour_name}
                      {it.size_name ? ` • Size: ${it.size_name}` : ""}
                    </Text>
                    {it.sku && <Text style={itemSku}>SKU: {it.sku}</Text>}
                  </Column>
                  <Column style={{ width: "25%", textAlign: "right" }}>
                    <Text style={itemQty}>Qty: {it.quantity}</Text>
                  </Column>
                </Row>
                {idx < items.length - 1 && <Hr style={lightDivider} />}
              </div>
            ))}
          </Section>

          {/* Atelier Care Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerHeading}>ATELIER CONCIERGE</Text>
            <Text style={footerText}>
              Need to reschedule or update delivery directions? Contact our atelier concierge at{" "}
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
  color: "#0284c7",
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

const courierCard: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  padding: "18px 20px",
  marginBottom: "24px",
}

const metaLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#64748b",
  margin: "0 0 4px",
}

const metaValue: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#0f172a",
  margin: 0,
}

const trackingMono: React.CSSProperties = {
  fontSize: "13px",
  fontFamily: "monospace",
  fontWeight: 600,
  color: "#0284c7",
  margin: 0,
}

const button: React.CSSProperties = {
  backgroundColor: "#111111",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  padding: "10px 20px",
  textDecoration: "none",
  borderRadius: "0px",
  display: "inline-block",
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

const addressBox: React.CSSProperties = {
  backgroundColor: "#fcfbf9",
  border: "1px solid #eae7e1",
  padding: "16px 20px",
}

const addressText: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#1c1917",
  margin: "0 0 6px",
}

const dispatchNotice: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#78716c",
  margin: 0,
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

const itemSku: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "monospace",
  color: "#78716c",
  margin: 0,
}

const itemQty: React.CSSProperties = {
  fontSize: "12px",
  color: "#78716c",
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
