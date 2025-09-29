import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, emailAddress } = body;

    if (!productId || !emailAddress) {
      return NextResponse.json(
        { error: 'Product ID and email address are required' },
        { status: 400 }
      );
    }

    // Fetch the product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Prepare product data for email
    const productData = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      stock: parseInt(product.stock) || 0,
      category: product.category.name,
      barcode: product.barcode || undefined,
      imageUrl: product.imageUrl || undefined
    };

    // Send email
    const emailSent = await emailService.sendNewProductEmail(emailAddress, {
      product: productData
    });

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'New product email sent successfully',
        sent: true
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send new product email',
        sent: false
      });
    }
  } catch (error) {
    console.error('Failed to send new product email:', error);
    return NextResponse.json(
      { error: 'Failed to send new product email' },
      { status: 500 }
    );
  }
}
