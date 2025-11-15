import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailSettings } from '@/lib/emailSettings';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threshold = searchParams.get('threshold');
    const sendEmail = searchParams.get('sendEmail') === 'true';
    
    if (!threshold) {
      return NextResponse.json(
        { error: 'Threshold parameter is required' },
        { status: 400 }
      );
    }

    const thresholdNum = parseInt(threshold, 10);
    
    if (isNaN(thresholdNum)) {
      return NextResponse.json(
        { error: 'Threshold must be a valid number' },
        { status: 400 }
      );
    }

    console.log('Fetching products for stock alerts with threshold:', thresholdNum);

    // Fetch all products with their categories
    const products = await prisma.product.findMany({
      include: {
        category: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${products.length} products in database`);

    // Fetch sales data to calculate total quantity sold per product
    const sales = await prisma.sale.findMany({
      where: {
        quantity: { gt: 0 }, // Only positive quantities (actual sales, not returns)
        refId: { not: { startsWith: "void-" } }, // Exclude void transactions
      },
      select: {
        productId: true,
        quantity: true,
      },
    });

    // Calculate total quantity sold per product
    const salesByProduct = new Map<string, number>();
    sales.forEach(sale => {
      const current = salesByProduct.get(sale.productId) || 0;
      salesByProduct.set(sale.productId, current + sale.quantity);
    });

    // Convert string stock to number and filter for alerts
    // Use per-product threshold if available, otherwise use general threshold
    const processedProducts = products.map(product => {
      const stock = parseInt(product.stock) || 0;
      // Use product's custom threshold if it exists, otherwise use general threshold
      const productThreshold = product.lowStockThreshold !== null && product.lowStockThreshold !== undefined
        ? product.lowStockThreshold
        : thresholdNum;
      
      // Get total quantity sold for this product
      const totalQuantitySold = salesByProduct.get(product.id) || 0;
      
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: stock,
        status: product.status,
        category: product.category.name, // Flatten category to just the name
        barcode: product.barcode,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        threshold: productThreshold,
        totalQuantitySold: totalQuantitySold // Add sales quantity for sorting
      };
    });

    // Separate low stock and out of stock products
    // Use each product's individual threshold
    const lowStockProducts = processedProducts
      .filter(p => p.stock < p.threshold && p.stock > 0)
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold); // Sort by sales quantity (top sellers first)
    
    const outOfStockProducts = processedProducts
      .filter(p => p.stock === 0)
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold); // Sort by sales quantity (top sellers first)

    console.log(`Low stock products (≤${thresholdNum}):`, lowStockProducts.length);
    console.log(`Out of stock products:`, outOfStockProducts.length);

    // Send email notifications if there are alerts and email is configured
    try {
      let notificationEmail = null;
      let shouldSendEmail = false;
      
      // Determine email address and sending logic
      const userSettings = emailSettings.get();
      
      if (userSettings) {
        // User has settings configured
        if (userSettings.emailAlerts) {
          // Email alerts are enabled
          if (userSettings.useDefaultEmail) {
            // User wants to use default email
            notificationEmail = process.env.DEFAULT_NOTIFICATION_EMAIL;
            console.log('Using default email as requested by user:', notificationEmail);
          } else {
            // User wants to use custom email
            if (userSettings.emailAddress && userSettings.emailAddress.trim() && 
                /\S+@\S+\.\S+/.test(userSettings.emailAddress.trim())) {
              notificationEmail = userSettings.emailAddress.trim();
              console.log('Using user-configured custom email:', notificationEmail);
            } else {
              // Custom email is invalid, fallback to default
              notificationEmail = process.env.DEFAULT_NOTIFICATION_EMAIL;
              console.log('User custom email invalid, using default email:', notificationEmail);
            }
          }
          shouldSendEmail = true;
        } else {
          // Email alerts disabled by user
          console.log('Email alerts disabled by user settings - no email will be sent');
          shouldSendEmail = false;
        }
      } else {
        // No user settings, use default email if available
        if (process.env.DEFAULT_NOTIFICATION_EMAIL) {
          notificationEmail = process.env.DEFAULT_NOTIFICATION_EMAIL;
          console.log('No user settings, using default email:', notificationEmail);
          shouldSendEmail = true;
        } else {
          console.log('No email configuration available');
        }
      }
      
      // Only send emails if explicitly requested (not for previews) and conditions are met
      if (sendEmail && shouldSendEmail && notificationEmail && (lowStockProducts.length > 0 || outOfStockProducts.length > 0)) {
        console.log('Sending stock alerts to:', notificationEmail);
        
        // Send a single combined email for all stock alerts
        const allAlerts = [...lowStockProducts, ...outOfStockProducts];
        const alertType = outOfStockProducts.length > 0 ? 'out_of_stock' : 'low_stock';
        
        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/send-stock-alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            alertType,
            threshold: thresholdNum,
            emailAddress: notificationEmail,
            products: allAlerts
          }),
        }).catch(error => {
          console.error('Failed to send stock alert email:', error);
        });
      }
    } catch (error) {
      console.error('Error sending stock alert emails:', error);
      // Don't fail the API call if email fails
    }

    return NextResponse.json({
      success: true,
      threshold: thresholdNum,
      products: processedProducts,
      alerts: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      },
      summary: {
        total: processedProducts.length,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length
      }
    });

  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch stock alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
