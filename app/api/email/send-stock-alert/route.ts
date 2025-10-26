import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertType, threshold, emailAddress, products: providedProducts } = body;

    if (!alertType || !emailAddress) {
      return NextResponse.json(
        { error: 'Alert type and email address are required' },
        { status: 400 }
      );
    }

    let alertProducts = [];
    
    if (providedProducts && providedProducts.length > 0) {
      // Use products provided from the stock alerts API
      alertProducts = providedProducts;
    } else {
      // Fallback: fetch products from database (for backward compatibility)
      const products = await prisma.product.findMany({
        include: {
          category: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Process products and filter based on alert type
      const processedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        stock: parseInt(product.stock) || 0,
        category: product.category.name,
        threshold: threshold
      }));

      if (alertType === 'low_stock') {
        alertProducts = processedProducts.filter(p => 
          p.stock < threshold && p.stock > 0
        );
      } else if (alertType === 'out_of_stock') {
        alertProducts = processedProducts.filter(p => p.stock === 0);
      }
    }

    if (alertProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products found for this alert type',
        sent: false
      });
    }

    // Send email
    const emailSent = await emailService.sendStockAlertEmail(emailAddress, {
      alertType,
      products: alertProducts,
      threshold
    });

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Stock alert email sent successfully',
        sent: true,
        productCount: alertProducts.length
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send stock alert email',
        sent: false
      });
    }
  } catch (error) {
    console.error('Failed to send stock alert email:', error);
    return NextResponse.json(
      { error: 'Failed to send stock alert email' },
      { status: 500 }
    );
  }
}
