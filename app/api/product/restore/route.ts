import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, price, stock, barcode, categoryId, imageUrl } = body;

    if (!id || !name || !price || !stock || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the deleted product
    const deletedProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, barcode: true }
    });

    if (!deletedProduct || deletedProduct.status !== "deleted") {
      return NextResponse.json({ error: "Product not found or not deleted" }, { status: 404 });
    }

    // Check if barcode already exists in active products (if provided)
    if (barcode && barcode.trim() !== "") {
      const existingProduct = await prisma.product.findFirst({
        where: { 
          barcode: barcode.trim(),
          id: { not: id },
          status: { not: "deleted" }
        },
        select: { id: true, name: true }
      });

      if (existingProduct) {
        return NextResponse.json({ 
          error: "Barcode already exists", 
          details: `A product with barcode "${barcode}" already exists (${existingProduct.name})`
        }, { status: 409 });
      }
    }

    // Restore the product
    const restored = await prisma.product.update({
      where: { id },
      data: {
        name,
        price,
        stock,
        status: "available",
        barcode: barcode && barcode.trim() !== "" ? barcode.trim() : null,
        categoryId,
        imageUrl
      },
      include: { category: { select: { name: true } } }
    });

    return NextResponse.json({ 
      message: "Product restored successfully", 
      product: restored 
    }, { status: 200 });

  } catch (error) {
    console.error('Product restoration error:', error);
    return NextResponse.json({ 
      error: "Failed to restore product", 
      details: error instanceof Error ? error.message : "Unknown error occurred" 
    }, { status: 500 });
  }
}
