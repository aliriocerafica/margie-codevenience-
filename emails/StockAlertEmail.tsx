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

interface StockAlertEmailProps {
  alertType: 'low_stock' | 'out_of_stock';
  products: Array<{
    id: string;
    name: string;
    stock: number;
    threshold?: number;
    category: string;
    price: string;
  }>;
  threshold: number;
}

export const StockAlertEmail = ({
  alertType,
  products,
  threshold,
}: StockAlertEmailProps) => {
  const isLowStock = alertType === 'low_stock';
  const alertTitle = isLowStock ? 'Low Stock Alert' : 'Out of Stock Alert';
  const alertIcon = isLowStock ? '⚠️' : '🚨';
  const alertColor = isLowStock ? '#f59e0b' : '#ef4444';
  const alertBgColor = isLowStock ? '#fef3c7' : '#fee2e2';
  const alertTextColor = isLowStock ? '#92400e' : '#dc2626';

  return (
    <Html>
      <Head />
      <Preview>
        {isLowStock 
          ? `${products.length} products are running low on stock` 
          : `${products.length} products are out of stock`
        }
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div style={headerContent}>
              <div style={brandSection}>
                <Text style={brandName}>Margie CodeVenience</Text>
                <Text style={brandTagline}>Inventory Management System</Text>
              </div>
              <div style={notificationSection}>
                <Heading style={h1}>Stock Alert</Heading>
                <Text style={headerSubtitle}>Inventory Management Notification</Text>
              </div>
            </div>
          </Section>

          <Section style={content}>
            {/* Alert Banner */}
            <div style={{
              ...alertBanner,
              backgroundColor: alertBgColor,
              borderColor: alertColor,
            }}>
              <Text style={alertIconStyle}>{alertIcon}</Text>
              <div>
                <Text style={{
                  ...alertTitleStyle,
                  color: alertTextColor,
                }}>
                  {alertTitle}
                </Text>
                <Text style={{
                  ...alertDescription,
                  color: alertTextColor,
                }}>
                  {isLowStock 
                    ? `${products.length} products running low on stock (below ${threshold} units)`
                    : `${products.length} products completely out of stock`
                  }
                </Text>
              </div>
            </div>

            {/* Products Table */}
            <Section style={tableSection}>
              <Text style={tableTitle}>Affected Products</Text>
              <table style={table}>
                <thead>
                  <tr style={tableHeader}>
                    <th style={tableHeaderCell}>Product</th>
                    <th style={tableHeaderCell}>Category</th>
                    <th style={tableHeaderCell}>Stock</th>
                    <th style={tableHeaderCell}>Price</th>
                    <th style={tableHeaderCell}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.id} style={{
                      ...tableRow,
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                    }}>
                      <td style={tableCell}>
                        <Text style={productName}>{product.name}</Text>
                      </td>
                      <td style={tableCell}>
                        <Text style={categoryText}>{product.category}</Text>
                      </td>
                      <td style={tableCell}>
                        <Text style={stockText}>{product.stock}</Text>
                      </td>
                      <td style={tableCell}>
                        <Text style={priceText}>${String((parseFloat(product.price) || 0).toFixed(2))}</Text>
                      </td>
                      <td style={tableCell}>
                        <span style={{
                          ...statusBadge,
                          backgroundColor: alertBgColor,
                          color: alertTextColor
                        }}>
                          {isLowStock ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* Action Section */}
            <Section style={actionSection}>
              <Text style={actionText}>
                {isLowStock 
                  ? 'Consider restocking these products soon to avoid stockouts.'
                  : 'These products need immediate restocking to continue sales.'
                }
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

const alertBanner = {
  border: '2px solid',
  borderRadius: '16px',
  padding: '24px 32px',
  margin: '0 0 24px',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  position: 'relative' as const,
  boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

const alertIconStyle = {
  fontSize: '28px',
  margin: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '16px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
};

const alertTitleStyle = {
  fontSize: '24px',
  fontWeight: '800',
  margin: '0 0 8px',
  letterSpacing: '-0.025em',
  lineHeight: '1.3',
  fontFamily: '"Poppins", sans-serif',
};

const alertDescription = {
  fontSize: '18px',
  margin: '0',
  fontWeight: '500',
  opacity: '0.9',
  lineHeight: '1.4',
  fontFamily: '"Poppins", sans-serif',
};

const tableSection = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  border: '2px solid #e2e8f0',
  borderRadius: '16px',
  padding: '24px',
  margin: '0 0 24px',
  boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

const tableTitle = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0 0 20px',
  letterSpacing: '-0.025em',
  lineHeight: '1.3',
  fontFamily: '"Poppins", sans-serif',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
};

const tableHeader = {
  backgroundColor: '#f8fafc',
};

const tableHeaderCell = {
  padding: '16px 20px',
  textAlign: 'left' as const,
  fontSize: '16px',
  fontWeight: '700',
  color: '#475569',
  borderBottom: '2px solid #e2e8f0',
  letterSpacing: '0.025em',
  textTransform: 'uppercase' as const,
  lineHeight: '1.4',
  fontFamily: '"Poppins", sans-serif',
};

const tableRow = {
  borderBottom: '1px solid #f1f5f9',
  transition: 'background-color 0.2s ease',
};

const tableCell = {
  padding: '16px 20px',
  textAlign: 'left' as const,
  fontSize: '16px',
  verticalAlign: 'middle' as const,
  lineHeight: '1.5',
  fontFamily: '"Poppins", sans-serif',
};

const productName = {
  fontWeight: '700',
  color: '#0f172a',
  margin: '0',
  fontSize: '18px',
  lineHeight: '1.4',
  fontFamily: '"Poppins", sans-serif',
};

const categoryText = {
  color: '#64748b',
  margin: '0',
  lineHeight: '1.5',
  fontFamily: '"Poppins", sans-serif',
};

const stockText = {
  fontWeight: '600',
  color: '#1e293b',
  margin: '0',
  lineHeight: '1.5',
  fontFamily: '"Poppins", sans-serif',
};

const priceText = {
  fontWeight: '600',
  color: '#059669',
  margin: '0',
  lineHeight: '1.5',
  fontFamily: '"Poppins", sans-serif',
};

const statusBadge = {
  padding: '16px 24px',
  borderRadius: '28px',
  fontSize: '16px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  display: 'inline-block',
  letterSpacing: '0.05em',
  boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
  lineHeight: '1.3',
  fontFamily: '"Poppins", sans-serif',
};

const actionSection = {
  textAlign: 'center' as const,
  padding: '32px 24px',
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  borderRadius: '16px',
  border: '2px solid #e2e8f0',
  margin: '0 0 24px',
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
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  fontWeight: '500',
  fontFamily: '"Poppins", sans-serif',
};

export default StockAlertEmail;
