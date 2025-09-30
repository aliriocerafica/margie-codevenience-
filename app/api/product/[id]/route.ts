import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { del } from '@vercel/blob';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, stock, barcode, categoryId, imageUrl, oldImageUrl } = body;

    if (!name || !price || !stock || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if barcode already exists (if barcode is provided and different from current)
    if (barcode && barcode.trim() !== "") {
      const existingProduct = await prisma.product.findFirst({
        where: { 
          barcode: barcode.trim(),
          id: { not: id }, // Exclude current product
          status: { not: "deleted" } // Only check active products
        },
        select: { id: true, name: true, status: true }
      });

      if (existingProduct) {
        return NextResponse.json({ 
          error: "Barcode already exists", 
          details: `A product with barcode "${barcode}" already exists (${existingProduct.name})`
        }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData: any = { name, price, stock, categoryId };
    if (barcode !== null) updateData.barcode = barcode && barcode.trim() !== "" ? barcode.trim() : null;
    if (imageUrl !== null) updateData.imageUrl = imageUrl;

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: { select: { name: true } } }
    });

    // Delete old image if new image was uploaded and old image exists
    if (imageUrl && oldImageUrl && oldImageUrl !== imageUrl) {
      try {
        await del(oldImageUrl);
      } catch (imageError) {
        console.error('Error deleting old image:', imageError);
      }
    }

    return NextResponse.json({ message: "Product updated successfully", product: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, imageUrl: true }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if there are any stock movements for this product
    const stockMovements = await prisma.stockMovement.findMany({
      where: { productId: id },
      select: { id: true }
    });

    if (stockMovements.length > 0) {
      // Instead of deleting, we'll mark the product as deleted and preserve audit trail
      // Keep the original barcode for restoration purposes
      await prisma.product.update({
        where: { id },
        data: { 
          status: "deleted",
          name: `[DELETED] ${product.name}` // Mark as deleted but preserve name for audit
          // Keep original barcode - don't clear it for restoration
        }
      });

      return NextResponse.json({ 
        message: "Product marked as deleted. Stock movement records preserved for audit trail.",
        warning: "This product has transaction history and cannot be permanently deleted."
      }, { status: 200 });
    }

    // If no stock movements, safe to delete completely
    await prisma.product.delete({ where: { id } });

    // Delete image from Vercel Blob if exists
    if (product.imageUrl) {
      try {
        await del(product.imageUrl);
      } catch (imageError) {
        // Fallback: try with pathname
        try {
          const url = new URL(product.imageUrl);
          await del(url.pathname);
        } catch (pathError) {
          console.error('Error deleting image:', pathError);
        }
      }
    }

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json({ 
      error: "Failed to delete product", 
      details: error instanceof Error ? error.message : "Unknown error occurred" 
    }, { status: 500 });
  }
}
