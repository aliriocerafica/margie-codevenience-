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
  Button,
} from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  resetLink: string;
  userName?: string;
}

export const PasswordResetEmail = ({
  resetLink,
  userName,
}: PasswordResetEmailProps) => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Preview>Reset your password for Margie CodeVenience</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={`${baseUrl}/Logo.png`}
              width="120"
              height="120"
              alt="Margie CodeVenience Logo"
              style={logo}
            />
          </Section>
          
          <Heading style={heading}>Password Reset Request</Heading>
          
          <Text style={text}>
            {userName ? `Hello ${userName},` : 'Hello,'}
          </Text>
          
          <Text style={text}>
            We received a request to reset your password for your Margie CodeVenience account.
            Click the button below to reset your password:
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={resetLink}>
              Reset Password
            </Button>
          </Section>
          
          <Text style={text}>
            Or copy and paste this link into your browser:
          </Text>
          <Text style={linkText}>{resetLink}</Text>
          
          <Text style={text}>
            This link will expire in 24 hours. If you didn't request a password reset, please ignore this email.
          </Text>
          
          <Text style={footer}>
            If you have any questions, please contact support.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const logoContainer = {
  textAlign: 'center' as const,
  padding: '32px 0',
};

const logo = {
  margin: '0 auto',
};

const heading = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#003366',
  textAlign: 'center' as const,
  margin: '0 0 24px',
  padding: '0 32px',
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
  padding: '0 32px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '0 32px',
};

const button = {
  backgroundColor: '#003366',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  border: 'none',
};

const linkText = {
  color: '#003366',
  fontSize: '14px',
  lineHeight: '20px',
  wordBreak: 'break-all' as const,
  margin: '0 0 24px',
  padding: '0 32px',
  fontFamily: 'monospace',
  backgroundColor: '#f6f9fc',
  paddingTop: '12px',
  paddingBottom: '12px',
  borderRadius: '4px',
};

const footer = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 0',
  padding: '0 32px',
  textAlign: 'center' as const,
};

export default PasswordResetEmail;

