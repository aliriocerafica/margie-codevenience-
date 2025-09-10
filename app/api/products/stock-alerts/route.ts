import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threshold = searchParams.get('threshold');
    
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

    // Convert string stock to number and filter for alerts
    const processedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: parseInt(product.stock) || 0,
      status: product.status,
      category: {
        id: product.category.id,
        name: product.category.name
      },
      barcode: product.barcode,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    // Separate low stock and out of stock products
    const lowStockProducts = processedProducts.filter(p => 
      p.stock <= thresholdNum && p.stock > 0
    );
    
    const outOfStockProducts = processedProducts.filter(p => 
      p.stock === 0
    );

    console.log(`Low stock products (≤${thresholdNum}):`, lowStockProducts.length);
    console.log(`Out of stock products:`, outOfStockProducts.length);

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
