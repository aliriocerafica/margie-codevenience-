import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import StockAlertEmail from '../emails/StockAlertEmail';
import NewProductEmail from '../emails/NewProductEmail';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface StockAlertData {
  alertType: 'low_stock' | 'out_of_stock';
  products: Array<{
    id: string;
    name: string;
    stock: number;
    threshold?: number;
    category: string;
    price: number;
  }>;
  threshold: number;
}

interface NewProductData {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    category: string;
    barcode?: string;
    imageUrl?: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Get email configuration from environment variables
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    };

    // Only initialize if we have the required credentials
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.config = emailConfig;
      this.transporter = nodemailer.createTransport(emailConfig);
    }
  }

  private async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized. Please check your email configuration.');
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      return false;
    }
  }

  async sendStockAlertEmail(
    to: string,
    data: StockAlertData
  ): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.error('Email service not configured');
      return false;
    }

    const isConnected = await this.verifyConnection();
    if (!isConnected) {
      return false;
    }

    try {
      const emailHtml = await render(StockAlertEmail(data));
      
      const mailOptions = {
        from: `"Margie CodeVenience" <${this.config.auth.user}>`,
        to,
        subject: `Stock Alert: ${data.products.length} products ${data.alertType === 'low_stock' ? 'running low' : 'out of stock'}`,
        html: emailHtml,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Stock alert email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send stock alert email:', error);
      return false;
    }
  }

  async sendNewProductEmail(
    to: string,
    data: NewProductData
  ): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.error('Email service not configured');
      return false;
    }

    const isConnected = await this.verifyConnection();
    if (!isConnected) {
      return false;
    }

    try {
      const emailHtml = await render(NewProductEmail(data));
      
      const mailOptions = {
        from: `"Margie CodeVenience" <${this.config.auth.user}>`,
        to,
        subject: `New Product Added: ${data.product.name}`,
        html: emailHtml,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('New product email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send new product email:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
  }

  getConfigurationStatus(): {
    configured: boolean;
    hasUser: boolean;
    hasPass: boolean;
    host: string;
    port: number;
  } {
    return {
      configured: this.isConfigured(),
      hasUser: !!process.env.EMAIL_USER,
      hasPass: !!process.env.EMAIL_PASS,
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
    };
  }
}

// Export a singleton instance
export const emailService = new EmailService();
export default emailService;
