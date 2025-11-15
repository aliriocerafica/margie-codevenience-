import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type ReturnItem = {
  saleId: string; // Original sale ID
  productId: string;
  quantity: number; // Quantity to return (must be <= original sale quantity)
  reason?: string;
};

const DEFAULT_THRESHOLD = 10;

function computeStatus(stock: number, threshold: number) {
  if (stock <= 0) return "out_of_stock";
  if (stock < threshold) return "low_stock";
  return "available";
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const body = await req.json();
    const items: ReturnItem[] = Array.isArray(body?.items) ? body.items : [];
    const threshold: number = Number.isFinite(body?.threshold)
      ? Math.max(0, Math.floor(body.threshold))
      : DEFAULT_THRESHOLD;

    if (!items.length) {
      return NextResponse.json({ error: "No items to return" }, { status: 400 });
    }

    // Fetch all original sales to validate
    const saleIds = Array.from(new Set(items.map(i => i.saleId)));
    const originalSales = await prisma.sale.findMany({
      where: { id: { in: saleIds } },
      include: {
        product: true,
      },
    });

    const saleMap = new Map(originalSales.map(s => [s.id, s] as const));

    // Validate all return items
    for (const item of items) {
      const originalSale = saleMap.get(item.saleId);
      if (!originalSale) {
        return NextResponse.json({ error: `Original sale not found: ${item.saleId}` }, { status: 404 });
      }

      if (originalSale.quantity <= 0) {
        return NextResponse.json({ error: `Cannot return from void/return transaction: ${item.saleId}` }, { status: 400 });
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ error: `Invalid return quantity for sale ${item.saleId}` }, { status: 400 });
      }

      if (item.quantity > originalSale.quantity) {
        return NextResponse.json({ 
          error: `Return quantity (${item.quantity}) exceeds original sale quantity (${originalSale.quantity}) for ${originalSale.product?.name || 'product'}` 
        }, { status: 400 });
      }

      // Check if already returned (sum of all returns for this sale)
      const existingReturns = await prisma.sale.findMany({
        where: {
          refId: { startsWith: `return-${originalSale.refId || originalSale.id}-` },
          productId: originalSale.productId,
        },
      });

      const totalReturned = existingReturns.reduce((sum, ret) => sum + Math.abs(ret.quantity), 0);
      const availableToReturn = originalSale.quantity - totalReturned;

      if (item.quantity > availableToReturn) {
        return NextResponse.json({ 
          error: `Cannot return ${item.quantity} units. Only ${availableToReturn} units available to return for ${originalSale.product?.name || 'product'}` 
        }, { status: 400 });
      }
    }

    const stockMovement = (prisma as any).stockMovement;
    if (!stockMovement) {
      return NextResponse.json({ error: "StockMovement model not available. Run: npx prisma generate && npx prisma db push" }, { status: 500 });
    }

    const lowNow: string[] = [];
    const outNow: string[] = [];

    const txResult = await prisma.$transaction(async (tx) => {
      const updates: Promise<any>[] = [];

      for (const item of items) {
        const originalSale = saleMap.get(item.saleId)!;
        const prod = originalSale.product;

        // Get current stock
        const beforeStock = parseInt(prod.stock ?? "0", 10) || 0;
        const afterStock = beforeStock + item.quantity; // Add back to stock

        // Use product's custom threshold if available
        const productThreshold = prod.lowStockThreshold !== null && prod.lowStockThreshold !== undefined
          ? prod.lowStockThreshold
          : threshold;
        const status = computeStatus(afterStock, productThreshold);

        if (status === "out_of_stock") outNow.push(prod.id);
        else if (status === "low_stock") lowNow.push(prod.id);

        // Create return Sale record (negative quantity)
        const unitPrice = originalSale.unitPrice; // Use original sale price
        const totalAmount = item.quantity * unitPrice;

        const returnRefId = `return-${originalSale.refId || originalSale.id}-${Date.now()}`;

        await tx.sale.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity, // Negative for return
            unitPrice: unitPrice,
            totalAmount: -totalAmount, // Negative for return
            refId: returnRefId,
            userId,
          },
        });

        // Create StockMovement record with type "refund"
        updates.push(
          (tx as any).stockMovement.create({
            data: {
              productId: item.productId,
              type: "refund", // Use "refund" type for returns
              quantity: Math.abs(item.quantity), // Positive for refund/return
              beforeStock,
              afterStock,
              refId: returnRefId,
              reason: item.reason || null,
              userId,
            },
          })
        );

        // Update product stock
        updates.push(
          tx.product.update({
            where: { id: item.productId },
            data: { stock: String(afterStock), status },
          })
        );
      }

      await Promise.all(updates);

      return { lowNow, outNow };
    });

    return NextResponse.json({ 
      success: true, 
      action: "return",
      summary: { 
        lowNow: txResult.lowNow, 
        outNow: txResult.outNow 
      },
      message: `Successfully processed return for ${items.length} item(s)`
    });
  } catch (error) {
    console.error("Return error:", error);
    return NextResponse.json({ 
      error: "Failed to process return", 
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

