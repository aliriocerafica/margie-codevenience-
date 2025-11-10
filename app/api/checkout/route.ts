import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

const DEFAULT_THRESHOLD = 10;

function computeStatus(stock: number, threshold: number) {
  if (stock <= 0) return "out_of_stock";
  if (stock < threshold) return "low_stock";
  return "available";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CheckoutItem[] = Array.isArray(body?.items) ? body.items : [];
    const action: "sale" | "void" = (body?.action === "void" ? "void" : "sale");
    const threshold: number = Number.isFinite(body?.threshold)
      ? Math.max(0, Math.floor(body.threshold))
      : DEFAULT_THRESHOLD;
    const userId: string | undefined = body?.userId ?? undefined;

    if (!items.length) {
      return NextResponse.json({ error: "No items to checkout" }, { status: 400 });
    }

    // Fetch all referenced products
    const productIds = Array.from(new Set(items.map(i => i.productId)));
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map(p => [p.id, p] as const));

    // Basic validation
    for (const it of items) {
      if (!productMap.has(it.productId)) {
        return NextResponse.json({ error: `Product not found: ${it.productId}` }, { status: 404 });
      }
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
        return NextResponse.json({ error: `Invalid quantity for ${it.productId}` }, { status: 400 });
      }
    }

    // Stock validation for sales
    if (action === "sale") {
      const insufficientStock: string[] = [];
      for (const it of items) {
        const prod = productMap.get(it.productId)!;
        const currentStock = parseInt(prod.stock ?? "0", 10) || 0;
        if (it.quantity > currentStock) {
          insufficientStock.push(`${prod.name} (Requested: ${it.quantity}, Available: ${currentStock})`);
        }
      }
      
      if (insufficientStock.length > 0) {
        return NextResponse.json({ 
          error: "Insufficient stock", 
          details: insufficientStock,
          message: "Cannot process checkout due to insufficient stock for the following items:"
        }, { status: 400 });
      }
    }

    const lowNow: string[] = [];
    const outNow: string[] = [];

    const stockMovement = (prisma as any).stockMovement;
    if (!stockMovement) {
      return NextResponse.json({ error: "StockMovement model not available. Run: npx prisma generate && npx prisma db push" }, { status: 500 });
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const updates: Promise<any>[] = [];
      for (const it of items) {
        const prod = productMap.get(it.productId)!;
        const beforeStock = parseInt(prod.stock ?? "0", 10) || 0;
        const afterStock = action === "sale"
          ? Math.max(0, beforeStock - it.quantity)
          : beforeStock + it.quantity;
        // Use product's custom threshold if available, otherwise use general threshold
        const productThreshold = prod.lowStockThreshold !== null && prod.lowStockThreshold !== undefined
          ? prod.lowStockThreshold
          : threshold;
        const status = computeStatus(afterStock, productThreshold);

        if (action === "sale") {
          if (status === "out_of_stock") outNow.push(prod.id);
          else if (status === "low_stock") lowNow.push(prod.id);
        }

        // Create both Sale and StockMovement records
        if (action === "sale") {
          const unitPrice = parseFloat(prod.price);
          const totalAmount = it.quantity * unitPrice;
          
          // Create Sale record
          await tx.sale.create({
            data: {
              productId: prod.id,
              quantity: it.quantity,
              unitPrice: unitPrice,
              totalAmount: totalAmount,
              refId: `checkout-${Date.now()}`,
              userId,
            }
          });
        } else if (action === "void") {
          // For voids, we need to find the original sale and create a refund
          // This is a simplified approach - you might want to enhance this
          const unitPrice = parseFloat(prod.price);
          const totalAmount = it.quantity * unitPrice;
          
          // Create refund Sale record
          await tx.sale.create({
            data: {
              productId: prod.id,
              quantity: -it.quantity, // Negative for refund
              unitPrice: unitPrice,
              totalAmount: -totalAmount, // Negative for refund
              refId: `void-${Date.now()}`,
              userId,
            }
          });
        }

        // Create StockMovement record
        updates.push(
          (tx as any).stockMovement.create({
            data: {
              productId: prod.id,
              type: action,
              quantity: action === "sale" ? -Math.abs(it.quantity) : Math.abs(it.quantity),
              beforeStock,
              afterStock,
              userId,
            },
          })
        );

        updates.push(
          tx.product.update({
            where: { id: prod.id },
            data: { stock: String(afterStock), status },
          })
        );
      }

      await Promise.all(updates);

      return { lowNow, outNow };
    });

    return NextResponse.json({ success: true, action, summary: { lowNow: txResult.lowNow, outNow: txResult.outNow } });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ 
      error: "Failed to process checkout", 
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


