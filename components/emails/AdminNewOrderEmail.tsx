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

export interface AdminNewOrderEmailProps {
  orderNumber: string
  orderDate: string
  customerName: string
  customerEmail: string
  customerPhone: string
  paymentMethod: "card" | "cod"
  totalAed: string
  itemCount: number
  adminOrderUrl: string
  emirate: string
}

export function AdminNewOrderEmail({
  orderNumber = "AR-1001",
  orderDate = "October 19, 2026",
  customerName = "Fatima Al Mansoori",
  customerEmail = "fatima@example.com",
  customerPhone = "+971 50 123 4567",
  paymentMethod = "cod",
  totalAed = "AED 1,260.00",
  itemCount = 2,
  adminOrderUrl = "https://arboutique.ae/admin/orders",
  emirate = "Dubai",
}: AdminNewOrderEmailProps) {
  const isCod = paymentMethod === "cod"

  return (
    <Html>
      <Head />
      <Preview>
        [New Order] #{orderNumber} - {customerName} ({totalAed})
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={badge}>BOUTIQUE OPERATIONS ALERT</Text>
            <Heading style={heading}>New Order Received: #{orderNumber}</Heading>
            <Text style={timestamp}>Placed on {orderDate}</Text>
          </Section>

          <Hr style={divider} />

          {/* Quick Metrics */}
          <Section style={metricsBox}>
            <Row>
              <Column style={{ width: "50%" }}>
                <Text style={metricLabel}>ORDER TOTAL</Text>
                <Text style={metricValue}>{totalAed}</Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text style={metricLabel}>PAYMENT METHOD</Text>
                <Text style={metricValue}>
                  {isCod ? "Cash on Delivery (COD)" : "Online Card (Paid)"}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Customer Details */}
          <Section style={sectionWrapper}>
            <Text style={sectionTitle}>CUSTOMER & FULFILMENT</Text>
            <div style={detailsBox}>
              <Text style={detailRow}>
                <strong>Name:</strong> {customerName}
              </Text>
              <Text style={detailRow}>
                <strong>Email:</strong> {customerEmail}
              </Text>
              <Text style={detailRow}>
                <strong>Phone:</strong> {customerPhone}
              </Text>
              <Text style={detailRow}>
                <strong>Emirate:</strong> {emirate}, UAE
              </Text>
              <Text style={detailRow}>
                <strong>Items:</strong> {itemCount} garment(s)
              </Text>
            </div>
          </Section>

          {/* Action Reminder */}
          {isCod ? (
            <Section style={codAlertBox}>
              <Text style={codAlertTitle}>ACTION REQUIRED FOR COD</Text>
              <Text style={codAlertText}>
                Please confirm this order via telephone or WhatsApp concierge with the customer
                before packing and marking as Shipped.
              </Text>
            </Section>
          ) : (
            <Section style={cardAlertBox}>
              <Text style={cardAlertTitle}>PAID VIA STRIPE</Text>
              <Text style={cardAlertText}>
                Payment has been confirmed. You may proceed directly to pack and arrange courier dispatch.
              </Text>
            </Section>
          )}

          {/* Action Button */}
          <Section style={actionSection}>
            <Button style={button} href={adminOrderUrl}>
              Open Order in Admin Console
            </Button>
          </Section>

          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerCopyright}>
              AR Boutique Admin Operations System • Automated Internal Notification
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ── Styles ──
const main: React.CSSProperties = {
  backgroundColor: "#f4f3f0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: "0 auto",
  padding: "32px 0",
}

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e2db",
  maxWidth: "580px",
  margin: "0 auto",
  padding: "36px",
}

const headerSection: React.CSSProperties = {
  textAlign: "center" as const,
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
  fontWeight: 600,
  color: "#111111",
  margin: "0 0 6px",
}

const timestamp: React.CSSProperties = {
  fontSize: "12px",
  color: "#78716c",
  margin: 0,
}

const divider: React.CSSProperties = {
  borderTop: "1px solid #eae7e1",
  margin: "24px 0",
}

const metricsBox: React.CSSProperties = {
  backgroundColor: "#faf9f6",
  border: "1px solid #eae7e1",
  padding: "16px 20px",
  marginBottom: "24px",
}

const metricLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.15em",
  color: "#78716c",
  margin: "0 0 4px",
}

const metricValue: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#111111",
  margin: 0,
}

const sectionWrapper: React.CSSProperties = {
  marginBottom: "20px",
}

const sectionTitle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.15em",
  color: "#78716c",
  textTransform: "uppercase" as const,
  margin: "0 0 10px",
}

const detailsBox: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #eae7e1",
  padding: "14px 18px",
}

const detailRow: React.CSSProperties = {
  fontSize: "13px",
  color: "#333",
  lineHeight: "1.6",
  margin: "0 0 4px",
}

const codAlertBox: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  border: "1px solid #fde68a",
  padding: "14px 18px",
  marginBottom: "24px",
}

const codAlertTitle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#92400e",
  margin: "0 0 4px",
}

const codAlertText: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#78350f",
  margin: 0,
}

const cardAlertBox: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  border: "1px solid #a7f3d0",
  padding: "14px 18px",
  marginBottom: "24px",
}

const cardAlertTitle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#065f46",
  margin: "0 0 4px",
}

const cardAlertText: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#047857",
  margin: 0,
}

const actionSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
}

const button: React.CSSProperties = {
  backgroundColor: "#111111",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  padding: "12px 24px",
  textDecoration: "none",
  borderRadius: "0px",
  display: "inline-block",
}

const footerSection: React.CSSProperties = {
  textAlign: "center" as const,
}

const footerCopyright: React.CSSProperties = {
  fontSize: "11px",
  color: "#a8a29e",
  margin: 0,
}
