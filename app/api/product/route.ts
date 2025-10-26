import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailSettings } from "@/lib/emailSettings";

export async function GET() {
  const product = await prisma.product.findMany({
      where: {
        status: {
          not: "deleted" // Filter out deleted products from main listing
        }
      },
      include: {
          category:
          {
              select:
              {
                  name: true
              }
          }
      },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(product);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, brand, product, quantity, size, price, unitCost, stock, status, imageUrl, barcode, categoryId } = body;

    if (!name || !price || !stock || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if barcode already exists (if barcode is provided)
    if (barcode && barcode.trim() !== "") {
      // First check for active products with same barcode
      const activeProduct = await prisma.product.findFirst({
        where: { 
          barcode: barcode.trim(),
          status: { not: "deleted" }
        },
        select: { id: true, name: true, status: true }
      });

      if (activeProduct) {
        return NextResponse.json({ 
          error: "Barcode already exists", 
          details: `A product with barcode "${barcode}" already exists (${activeProduct.name})`
        }, { status: 409 });
      }

      // Check if there's a deleted product with the same barcode (for restoration)
      const deletedProductByBarcode = await prisma.product.findFirst({
        where: { 
          barcode: barcode.trim(),
          status: "deleted"
        },
        select: { id: true, name: true, barcode: true }
      });

      if (deletedProductByBarcode) {
        const originalName = deletedProductByBarcode.name
          .replace(/^\[DELETED\] /, '')
          .replace(/^\[ARCHIVED-\d+\] /, '');
        
        return NextResponse.json({ 
          error: "Product restoration available", 
          details: `A deleted product with barcode "${barcode}" exists (${originalName}). Would you like to restore it instead of creating a new one?`,
          restoreId: deletedProductByBarcode.id,
          restoreName: originalName,
          restoreBarcode: deletedProductByBarcode.barcode,
          canRestore: true
        }, { status: 409 });
      }
    }


    const created = await prisma.product.create({
      data: { 
        name, 
        brand,
        product,
        quantity,
        size,
        price, 
        unitCost,
        stock, 
        status, 
        imageUrl, 
        barcode: barcode && barcode.trim() !== "" ? barcode.trim() : null, 
        categoryId 
      },
      include: { category: { select: { name: true } } },
    });

    // Send new product email notification if email alerts are enabled
    try {
      // Check for user-configured email settings first
      let notificationEmail = null;
      
      if (emailSettings.isConfigured()) {
        notificationEmail = emailSettings.getNotificationEmail();
        console.log('Using user-configured email for new product notification:', notificationEmail);
      } else {
        // Fallback to default email if no user settings
        notificationEmail = process.env.DEFAULT_NOTIFICATION_EMAIL;
        console.log('Using default email for new product notification:', notificationEmail);
      }
      
      if (notificationEmail) {
        // Send email notification asynchronously
        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/send-new-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: created.id,
            emailAddress: notificationEmail
          }),
        }).catch(error => {
          console.error('Failed to send new product email:', error);
        });
      }
    } catch (error) {
      console.error('Error sending new product email:', error);
      // Don't fail the product creation if email fails
    }

    return NextResponse.json({ message: "Product created", product: created }, { status: 201 });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json({ 
      error: "Failed to create product", 
      details: error instanceof Error ? error.message : "Unknown error occurred" 
    }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...update } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const updated = await prisma.product.update({
      where: { id },
      data: update,
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json({ message: "Product updated", product: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product 123" }, { status: 500 });
  }
}
