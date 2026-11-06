import * as React from "react"
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

export interface ContactInquiryEmailProps {
  name: string
  email: string
  phone?: string
  topic: string
  message: string
  submittedAt?: string
}

export function ContactInquiryEmail({
  name = "Amina Al Mansoori",
  email = "amina@example.com",
  phone = "+971 50 273 6767",
  topic = "General Inquiry",
  message = "I would like to inquire about bespoke tailoring options for the upcoming festive season.",
  submittedAt = new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai" }),
}: ContactInquiryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        [New Concierge Inquiry] {topic} from {name}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={badge}>CONCIERGE INQUIRY</Text>
            <Heading style={heading}>{topic}</Heading>
            <Text style={timestamp}>Received on {submittedAt}</Text>
          </Section>

          <Hr style={divider} />

          {/* Patron Details */}
          <Section style={sectionWrapper}>
            <Text style={sectionTitle}>CLIENT INFORMATION</Text>
            <div style={detailsBox}>
              <Text style={detailRow}>
                <strong>Name:</strong> {name}
              </Text>
              <Text style={detailRow}>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${email}`} style={linkStyle}>
                  {email}
                </a>
              </Text>
              {phone && (
                <Text style={detailRow}>
                  <strong>Phone / WhatsApp:</strong>{" "}
                  <a href={`tel:${phone}`} style={linkStyle}>
                    {phone}
                  </a>
                </Text>
              )}
              <Text style={detailRow}>
                <strong>Inquiry Topic:</strong> {topic}
              </Text>
            </div>
          </Section>

          {/* Message Content */}
          <Section style={sectionWrapper}>
            <Text style={sectionTitle}>MESSAGE</Text>
            <div style={messageBox}>
              <Text style={messageText}>{message}</Text>
            </div>
          </Section>

          {/* Direct Reply CTA */}
          <Section style={{ textAlign: "center", margin: "28px 0 16px" }}>
            <Button
              href={`mailto:${email}?subject=Re: ${encodeURIComponent(topic)} - AR Boutique Concierge`}
              style={replyButton}
            >
              Reply to Client Directly
            </Button>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              AR Boutique Dubai &bull; Luxury Ready-to-Wear & Atelier
            </Text>
            <Text style={footerSubtext}>
              This is an automated concierge alert sent from arboutique.ae.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function CustomerInquiryAcknowledgmentEmail({
  name = "Amina Al Mansoori",
  topic = "General Inquiry",
  storeEmail = "concierge@arboutique.ae",
  storePhone = "+971 50 273 6767",
}: {
  name: string
  topic: string
  storeEmail?: string
  storePhone?: string
}) {
  return (
    <Html>
      <Head />
      <Preview>Thank you for contacting AR Boutique</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={badge}>AR BOUTIQUE CONCIERGE</Text>
            <Heading style={heading}>We Have Received Your Message</Heading>
            <Text style={timestamp}>Topic: {topic}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={sectionWrapper}>
            <Text style={messageText}>
              Dear {name},
            </Text>
            <Text style={messageText}>
              Thank you for contacting AR Boutique. Our dedicated concierge and styling team have received your inquiry and will personally respond within 24 business hours.
            </Text>
            <Text style={messageText}>
              Should your request require urgent attention or same-day styling consultation, feel free to connect with our atelier directly via WhatsApp at{" "}
              <a href={`https://wa.me/${storePhone.replace(/[^0-9]/g, "")}`} style={linkStyle}>
                {storePhone}
              </a>
              .
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              AR Boutique Dubai &bull; Luxury Ready-to-Wear
            </Text>
            <Text style={footerSubtext}>
              Email: {storeEmail} | Tel: {storePhone}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

/* Luxury Email Styles */
const main: React.CSSProperties = {
  backgroundColor: "#f9f8f6",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "32px 0",
}

const container: React.CSSProperties = {
  maxWidth: "580px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  border: "1px solid #ebe7df",
  padding: "40px",
}

const headerSection: React.CSSProperties = {
  textAlign: "center",
  paddingBottom: "8px",
}

const badge: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "#998b7a",
  fontWeight: 600,
  margin: "0 0 12px",
}

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 400,
  color: "#1c1917",
  margin: "0 0 8px",
  fontFamily: "Georgia, serif",
}

const timestamp: React.CSSProperties = {
  fontSize: "12px",
  color: "#78716c",
  margin: "0",
}

const divider: React.CSSProperties = {
  borderTop: "1px solid #ebe7df",
  margin: "24px 0",
}

const sectionWrapper: React.CSSProperties = {
  margin: "20px 0",
}

const sectionTitle: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#998b7a",
  fontWeight: 600,
  margin: "0 0 12px",
}

const detailsBox: React.CSSProperties = {
  backgroundColor: "#fcfbfa",
  border: "1px solid #f0ede6",
  padding: "16px",
  borderRadius: "2px",
}

const detailRow: React.CSSProperties = {
  fontSize: "13px",
  color: "#44403c",
  margin: "6px 0",
  lineHeight: "1.5",
}

const messageBox: React.CSSProperties = {
  backgroundColor: "#fcfbfa",
  border: "1px solid #f0ede6",
  padding: "18px",
  borderRadius: "2px",
}

const messageText: React.CSSProperties = {
  fontSize: "14px",
  color: "#292524",
  lineHeight: "1.6",
  margin: "0 0 12px",
  whiteSpace: "pre-wrap",
}

const linkStyle: React.CSSProperties = {
  color: "#1c1917",
  textDecoration: "underline",
}

const replyButton: React.CSSProperties = {
  backgroundColor: "#1c1917",
  color: "#ffffff",
  fontSize: "12px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 600,
  padding: "14px 28px",
  borderRadius: "2px",
  textDecoration: "none",
  display: "inline-block",
}

const footer: React.CSSProperties = {
  textAlign: "center",
  paddingTop: "8px",
}

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#57534e",
  margin: "0 0 4px",
  fontWeight: 500,
}

const footerSubtext: React.CSSProperties = {
  fontSize: "11px",
  color: "#a8a29e",
  margin: "0",
}

