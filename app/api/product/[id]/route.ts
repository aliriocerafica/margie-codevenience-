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

    // Prepare update data
    const updateData: any = { name, price, stock, categoryId };
    if (barcode !== null) updateData.barcode = barcode;
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
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
