import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface NewProductEmailProps {
  product: {
    id: string;
    name: string;
    price: string;
    stock: number;
    category: string;
    barcode?: string;
    imageUrl?: string;
  };
}

export const NewProductEmail = ({ product }: NewProductEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        New product "{product.name}" has been added to your inventory
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Professional Header */}
          <Section style={header}>
            <div style={headerContent}>
              <div style={brandSection}>
                <Text style={brandName}>Margie CodeVenience</Text>
                <Text style={brandTagline}>Inventory Management System</Text>
              </div>
              <div style={notificationSection}>
                <Heading style={h1}>New Product Added</Heading>
                <Text style={headerSubtitle}>Inventory Update Notification</Text>
              </div>
            </div>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {/* Success Message */}
            <div style={successBanner}>
              <Text style={successIcon}>✨</Text>
              <Text style={successText}>Product successfully added to your inventory</Text>
            </div>

            {/* Product Card */}
            <Section style={productCard}>
              <Row>
                <Column style={productImageColumn}>
                  {product.imageUrl ? (
                    <Img
                      src={product.imageUrl}
                      alt={product.name}
                      style={productImage}
                    />
                  ) : (
                    <div style={placeholderImage}>
                      <Text style={placeholderText}>📦</Text>
                    </div>
                  )}
                </Column>
                <Column style={productDetailsColumn}>
                  <Heading style={productName}>{product.name}</Heading>
                </Column>
              </Row>
            </Section>

            {/* Product Details Grid */}
            <Section style={detailsSection}>
              <Row style={detailsRow}>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Category</Text>
                  <Text style={detailValue}>{product.category}</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Price</Text>
                  <Text style={detailValue}>${String((parseFloat(product.price) || 0).toFixed(2))}</Text>
                </Column>
              </Row>
              <Row style={detailsRow}>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Initial Stock</Text>
                  <Text style={detailValue}>{product.stock} units</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Barcode</Text>
                  <Text style={detailValue}>{product.barcode || 'Not provided'}</Text>
                </Column>
              </Row>
            </Section>

            {/* Action Section */}
            <Section style={actionSection}>
              <Text style={actionText}>
                Ready to manage this product? Update stock levels, pricing, and other details from your dashboard.
              </Text>
              
              <div style={buttonContainer}>
                <Link href="/product" style={primaryButton}>
                  Manage Products
                </Link>
                <Link href="/dashboard" style={secondaryButton}>
                  View Dashboard
                </Link>
              </div>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerHr} />
            <Text style={footerText}>
              This is an automated notification from Margie CodeVenience.
              <br />
              To adjust your notification settings, visit your dashboard settings.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: '20px',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  borderRadius: '16px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  overflow: 'hidden',
  maxWidth: '650px',
  border: '1px solid #e2e8f0',
};

const header = {
  background: 'linear-gradient(135deg, #003366 0%, #004488 50%, #0056b3 100%)',
  padding: '40px 32px',
  textAlign: 'center' as const,
  borderBottom: '4px solid #003366',
};

const headerContent = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '24px',
  maxWidth: '600px',
  margin: '0 auto',
};

const brandSection = {
  textAlign: 'center' as const,
  marginBottom: '16px',
};

const brandName = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 8px',
  letterSpacing: '0.5px',
  lineHeight: '1.2',
  fontFamily: '"Poppins", sans-serif',
};

const brandTagline = {
  color: '#e0f2fe',
  fontSize: '16px',
  margin: '0',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  lineHeight: '1.4',
  fontFamily: '"Poppins", sans-serif',
};

const notificationSection = {
  textAlign: 'center' as const,
  padding: '20px 32px',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  borderRadius: '16px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  backdropFilter: 'blur(10px)',
  width: '100%',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0 0 8px',
  padding: '0',
  letterSpacing: '-0.025em',
  lineHeight: '1.2',
  fontFamily: '"Poppins", sans-serif',
};

const headerSubtitle = {
  color: '#f0f9ff',
  fontSize: '14px',
  margin: '0',
  fontWeight: '600',
  lineHeight: '1.4',
  fontFamily: '"Poppins", sans-serif',
};

const content = {
  padding: '24px 32px',
  backgroundColor: '#f8fafc',
};

const successBanner = {
  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
  border: '2px solid #003366',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  boxShadow: '0 4px 8px -2px rgba(0, 51, 102, 0.2)',
};

const successIcon = {
  fontSize: '24px',
  margin: '0',
};

const successText = {
  color: '#0c4a6e',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '0.025em',
  lineHeight: '1.4',
  fontFamily: '"Poppins", sans-serif',
};

const productCard = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  border: '2px solid #e2e8f0',
  borderRadius: '16px',
  padding: '24px',
  margin: '0 0 24px',
  boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

const productImageColumn = {
  width: '100px',
  textAlign: 'center' as const,
};

const productDetailsColumn = {
  paddingLeft: '20px',
};

const productImage = {
  width: '80px',
  height: '80px',
  objectFit: 'cover' as const,
  borderRadius: '8px',
  border: '2px solid #e2e8f0',
};

const placeholderImage = {
  width: '80px',
  height: '80px',
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #e2e8f0',
  margin: '0 auto',
};

const placeholderText = {
  fontSize: '24px',
  margin: '0',
};

const productName = {
  color: '#0f172a',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0 0 12px',
  padding: '0',
  letterSpacing: '-0.025em',
  lineHeight: '1.3',
  fontFamily: '"Poppins", sans-serif',
};

const productDescription = {
  color: '#64748b',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  fontFamily: '"Poppins", sans-serif',
};

const detailsSection = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  border: '2px solid #e2e8f0',
  borderRadius: '16px',
  padding: '24px',
  margin: '0 0 24px',
  boxShadow: '0 6px 10px -4px rgba(0, 0, 0, 0.1), 0 3px 4px -2px rgba(0, 0, 0, 0.06)',
};

const detailsRow = {
  marginBottom: '20px',
};

const detailColumn = {
  width: '50%',
  padding: '0 16px',
};

const detailLabel = {
  color: '#64748b',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.2px',
  lineHeight: '1.4',
  fontFamily: '"Poppins", sans-serif',
};

const detailValue = {
  color: '#0f172a',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '-0.025em',
  lineHeight: '1.3',
  fontFamily: '"Poppins", sans-serif',
};

const actionSection = {
  textAlign: 'center' as const,
  padding: '32px 24px',
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  borderRadius: '16px',
  border: '2px solid #e2e8f0',
  boxShadow: '0 6px 10px -4px rgba(0, 0, 0, 0.1), 0 3px 4px -2px rgba(0, 0, 0, 0.06)',
};

const actionText = {
  color: '#475569',
  fontSize: '18px',
  lineHeight: '28px',
  margin: '0 0 24px',
  fontWeight: '500',
  fontFamily: '"Poppins", sans-serif',
};

const buttonContainer = {
  display: 'flex',
  gap: '16px',
  justifyContent: 'center',
  flexWrap: 'wrap' as const,
};

const primaryButton = {
  background: 'linear-gradient(135deg, #003366 0%, #004488 100%)',
  borderRadius: '16px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '20px 40px',
  border: 'none',
  boxShadow: '0 8px 12px -4px rgba(0, 51, 102, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
  letterSpacing: '0.025em',
  lineHeight: '1.2',
  fontFamily: '"Poppins", sans-serif',
};

const secondaryButton = {
  backgroundColor: 'transparent',
  border: '2px solid #003366',
  borderRadius: '16px',
  color: '#003366',
  fontSize: '18px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '18px 38px',
  letterSpacing: '0.025em',
  lineHeight: '1.2',
  fontFamily: '"Poppins", sans-serif',
};

const footer = {
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  padding: '32px',
  textAlign: 'center' as const,
  borderTop: '2px solid #e2e8f0',
};

const footerHr = {
  borderColor: '#cbd5e1',
  margin: '0 0 20px',
  borderWidth: '1px',
};

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  fontWeight: '500',
  fontFamily: '"Poppins", sans-serif',
};

export default NewProductEmail;
