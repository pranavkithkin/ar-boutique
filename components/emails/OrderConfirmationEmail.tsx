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

export interface OrderItemEmailData {
  id: string
  product_name: string
  colour_name: string
  size_name?: string | null
  sku?: string | null
  quantity: number
  unit_price_aed: string
  total_aed: string
}

export interface OrderConfirmationEmailProps {
  orderNumber: string
  orderDate: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  paymentMethod: "card" | "cod"
  items: OrderItemEmailData[]
  subtotalAed: string
  discountAed?: string
  deliveryFeeAed: string
  vatAed: string
  totalAed: string
  address: {
    street: string
    building?: string
    apartment?: string
    area: string
    emirate: string
    landmark?: string
  }
  storeEmail?: string
  storePhone?: string
  invoiceUrl?: string
}

export function OrderConfirmationEmail({
  orderNumber = "AR-1001",
  orderDate = "October 19, 2026",
  customerName = "Valued Patron",
  customerEmail = "patron@example.com",
  customerPhone = "+971 50 123 4567",
  paymentMethod = "cod",
  items = [],
  subtotalAed = "AED 1,200.00",
  discountAed,
  deliveryFeeAed = "Complimentary",
  vatAed = "AED 60.00",
  totalAed = "AED 1,260.00",
  address = {
    street: "Al Wasl Road",
    building: "Villa 14",
    area: "Jumeirah 1",
    emirate: "Dubai",
  },
  storeEmail = "concierge@arboutique.ae",
  storePhone = "+971 50 123 4567",
  invoiceUrl,
}: OrderConfirmationEmailProps) {
  const isCod = paymentMethod === "cod"

  return (
    <Html>
      <Head />
      <Preview>
        {isCod
          ? `Cash on Delivery Order ${orderNumber} Received - AR Boutique`
          : `Order Confirmation ${orderNumber} - AR Boutique`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header & Logo */}
          <Section style={headerSection}>
            <Text style={logoText}>AR BOUTIQUE</Text>
            <Text style={taglineText}>DUBAI ATELIER • INDIAN HERITAGE COUTURE</Text>
          </Section>

          <Hr style={divider} />

          {/* Title & Greeting */}
          <Section style={greetingSection}>
            <Heading style={heading}>
              {isCod ? "Order Received" : "Thank You for Your Order"}
            </Heading>
            <Text style={subheading}>
              Dear {customerName}, we have received your order{" "}
              <strong style={orderNumberHighlight}>#{orderNumber}</strong> placed on{" "}
              {orderDate}.
            </Text>
          </Section>

          {/* COD Notice Box */}
          {isCod && (
            <Section style={codNoticeBox}>
              <Text style={codNoticeTitle}>CASH ON DELIVERY NOTICE</Text>
              <Text style={codNoticeText}>
                Please prepare <strong style={{ color: "#111" }}>{totalAed} in exact cash</strong>{" "}
                for the courier upon delivery.
              </Text>
              <Text style={codNoticeSubtext}>
                Our atelier concierge may reach out to you via phone or WhatsApp at{" "}
                <strong>{customerPhone}</strong> to verify delivery timing before dispatch.
              </Text>
            </Section>
          )}

          {/* Items Summary Table */}
          <Section style={sectionWrapper}>
            <Text style={sectionTitle}>ORDER SUMMARY</Text>
            {items.map((item, idx) => (
              <div key={item.id || idx} style={itemRow}>
                <Row>
                  <Column style={{ width: "70%" }}>
                    <Text style={itemName}>{item.product_name}</Text>
                    <Text style={itemMeta}>
                      Colour: {item.colour_name}
                      {item.size_name ? ` • Size: ${item.size_name}` : ""}
                    </Text>
                    {item.sku && (
                      <Text style={itemSku}>SKU: {item.sku}</Text>
                    )}
                  </Column>
                  <Column style={{ width: "30%", textAlign: "right" }}>
                    <Text style={itemPrice}>{item.total_aed}</Text>
                    <Text style={itemQty}>Qty: {item.quantity}</Text>
                  </Column>
                </Row>
                {idx < items.length - 1 && <Hr style={lightDivider} />}
              </div>
            ))}
          </Section>

          {/* Price Breakdown */}
          <Section style={totalsSection}>
            <Row style={totalRow}>
              <Column style={{ width: "70%" }}>
                <Text style={totalLabel}>Bag Subtotal</Text>
              </Column>
              <Column style={{ width: "30%", textAlign: "right" }}>
                <Text style={totalValue}>{subtotalAed}</Text>
              </Column>
            </Row>
            {discountAed && (
              <Row style={totalRow}>
                <Column style={{ width: "70%" }}>
                  <Text style={{ ...totalLabel, color: "#15803d", fontWeight: 600 }}>Promotional Discount</Text>
                </Column>
                <Column style={{ width: "30%", textAlign: "right" }}>
                  <Text style={{ ...totalValue, color: "#15803d", fontWeight: 600 }}>-{discountAed}</Text>
                </Column>
              </Row>
            )}
            <Row style={totalRow}>
              <Column style={{ width: "70%" }}>
                <Text style={totalLabel}>Estimated Delivery</Text>
              </Column>
              <Column style={{ width: "30%", textAlign: "right" }}>
                <Text style={totalValue}>{deliveryFeeAed}</Text>
              </Column>
            </Row>
            <Row style={totalRow}>
              <Column style={{ width: "70%" }}>
                <Text style={totalLabel}>UAE VAT (5% Included)</Text>
              </Column>
              <Column style={{ width: "30%", textAlign: "right" }}>
                <Text style={totalValue}>{vatAed}</Text>
              </Column>
            </Row>
            <Hr style={totalsDivider} />
            <Row style={totalRow}>
              <Column style={{ width: "70%" }}>
                <Text style={grandTotalLabel}>TOTAL AMOUNT</Text>
              </Column>
              <Column style={{ width: "30%", textAlign: "right" }}>
                <Text style={grandTotalValue}>{totalAed}</Text>
              </Column>
            </Row>
          </Section>

          {/* Delivery Address */}
          <Section style={sectionWrapper}>
            <Text style={sectionTitle}>DELIVERY ADDRESS</Text>
            <div style={addressBox}>
              <Text style={addressLine}><strong>{customerName}</strong></Text>
              {address.apartment && <Text style={addressLine}>Apt / Suite: {address.apartment}</Text>}
              {address.building && <Text style={addressLine}>Building: {address.building}</Text>}
              <Text style={addressLine}>{address.street}</Text>
              <Text style={addressLine}>{address.area}, {address.emirate}, UAE</Text>
              {address.landmark && <Text style={addressLine}>Landmark: {address.landmark}</Text>}
              <Text style={addressLine}>Phone: {customerPhone}</Text>
            </div>
          </Section>

          {/* Tax Invoice Download Banner */}
          {invoiceUrl && (
            <Section style={invoiceBanner}>
              <Row>
                <Column style={{ width: "65%" }}>
                  <Text style={invoiceTitle}>OFFICIAL TAX INVOICE</Text>
                  <Text style={invoiceSubtitle}>
                    UAE FTA VAT Compliant (English &amp; Arabic)
                  </Text>
                </Column>
                <Column style={{ width: "35%", textAlign: "right" }}>
                  <a href={invoiceUrl} style={invoiceButton} target="_blank" rel="noopener noreferrer">
                    Download PDF
                  </a>
                </Column>
              </Row>
            </Section>
          )}

          {/* Concierge Care Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerHeading}>ATELIER CONCIERGE</Text>
            <Text style={footerText}>
              Should you require any changes or wish to track your shipment, please reach our
              concierge at <a href={`mailto:${storeEmail}`} style={link}>{storeEmail}</a> or WhatsApp{" "}
              <a href={`https://wa.me/${storePhone.replace(/[^0-9]/g, "")}`} style={link}>{storePhone}</a>.
            </Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} AR Boutique Atelier. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ── Styles (Luxury Monochrome / Ivory theme matching docs/DESIGN.md) ──
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

const orderNumberHighlight: React.CSSProperties = {
  color: "#111111",
  letterSpacing: "0.05em",
}

const codNoticeBox: React.CSSProperties = {
  backgroundColor: "#fdf8ee",
  border: "1px solid #fae8c8",
  padding: "16px 20px",
  marginBottom: "24px",
}

const codNoticeTitle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#92400e",
  margin: "0 0 6px",
}

const codNoticeText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#78350f",
  margin: "0 0 6px",
}

const codNoticeSubtext: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#92400e",
  margin: 0,
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
  fontSize: "15px",
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

const itemPrice: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#111111",
  margin: "0 0 4px",
}

const itemQty: React.CSSProperties = {
  fontSize: "12px",
  color: "#78716c",
  margin: 0,
}

const totalsSection: React.CSSProperties = {
  backgroundColor: "#fbfaf8",
  border: "1px solid #eae7e1",
  padding: "16px 20px",
  marginBottom: "24px",
}

const totalRow: React.CSSProperties = {
  margin: "4px 0",
}

const totalLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "#57534e",
  margin: 0,
}

const totalValue: React.CSSProperties = {
  fontSize: "13px",
  color: "#111111",
  margin: 0,
}

const totalsDivider: React.CSSProperties = {
  borderTop: "1px solid #e7e4dc",
  margin: "10px 0",
}

const grandTotalLabel: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  color: "#111111",
  margin: 0,
}

const grandTotalValue: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#111111",
  margin: 0,
}

const addressBox: React.CSSProperties = {
  backgroundColor: "#fcfbf9",
  border: "1px solid #eae7e1",
  padding: "16px 20px",
}

const addressLine: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#44403c",
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

const invoiceBanner: React.CSSProperties = {
  backgroundColor: "#fcfbf9",
  border: "1px solid #111111",
  padding: "16px 20px",
  marginTop: "24px",
  marginBottom: "12px",
}

const invoiceTitle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.15em",
  color: "#111111",
  margin: "0 0 4px",
}

const invoiceSubtitle: React.CSSProperties = {
  fontSize: "11px",
  color: "#78716c",
  margin: 0,
}

const invoiceButton: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#111111",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  padding: "8px 16px",
  textDecoration: "none",
  borderRadius: "2px",
}
