import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
    // Get user from session
    const session = await auth();
    const userId: string | undefined = session?.user?.id ?? undefined;
    
    // Log for debugging (remove in production if needed)
    if (!userId) {
      console.log("Warning: No userId found in session. User may not be logged in.");
    } else {
      console.log("Checkout: User ID from session:", userId);
    }
    
    const body = await req.json();
    const items: CheckoutItem[] = Array.isArray(body?.items) ? body.items : [];
    const action: "sale" | "void" = (body?.action === "void" ? "void" : "sale");
    const originalTransactionNo: string | undefined = body?.originalTransactionNo; // For voids, the original checkout transaction number
    const approvedBy: string | undefined = body?.approvedBy; // Admin who approved the void (for audit purposes)
    const requestedByUserId: string | undefined = body?.requestedByUserId; // For void requests: the staff member who requested the void
    const threshold: number = Number.isFinite(body?.threshold)
      ? Math.max(0, Math.floor(body.threshold))
      : DEFAULT_THRESHOLD;
    
    // For void transactions, use requestedByUserId if provided (staff who requested),
    // otherwise use session userId (admin who is voiding directly)
    // This ensures "handled by" shows the correct person
    const effectiveUserId = (action === "void" && requestedByUserId) ? requestedByUserId : userId;

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

    // Generate transaction number
    // For voids: if originalTransactionNo is provided, extract timestamp and reuse it
    // Otherwise generate new timestamp
    let transactionNo: string;
    if (action === "void") {
      if (originalTransactionNo && originalTransactionNo.startsWith("checkout-")) {
        // Extract timestamp from original checkout-{timestamp} and create void-{timestamp}
        const timestamp = originalTransactionNo.replace("checkout-", "");
        transactionNo = `void-${timestamp}`;
      } else {
        // Fallback if no original transaction number provided
        transactionNo = `void-${Date.now()}`;
      }
    } else {
      transactionNo = `checkout-${Date.now()}`;
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
              refId: transactionNo,
              userId: effectiveUserId,
            }
          });
        } else if (action === "void") {
          // For voids, we need to find the original sale and create a refund
          // This is a simplified approach - you might want to enhance this
          const unitPrice = parseFloat(prod.price);
          const totalAmount = it.quantity * unitPrice;
          
          // Create refund Sale record
          // Use effectiveUserId (staff who requested) for userId, approvedBy for audit
          await tx.sale.create({
            data: {
              productId: prod.id,
              quantity: -it.quantity, // Negative for refund
              unitPrice: unitPrice,
              totalAmount: -totalAmount, // Negative for refund
              refId: transactionNo,
              userId: effectiveUserId, // Staff who requested the void (or admin if voiding directly)
              approvedBy: approvedBy, // Log who approved this void (for audit purposes)
            }
          });
        }

        // Create StockMovement record
        // Use effectiveUserId (staff who requested void, or admin if voiding directly)
        // This ensures "handled by" shows the person who requested/handled the void
        updates.push(
          (tx as any).stockMovement.create({
            data: {
              productId: prod.id,
              type: action,
              quantity: action === "sale" ? -Math.abs(it.quantity) : Math.abs(it.quantity),
              beforeStock,
              afterStock,
              userId: effectiveUserId,
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

    return NextResponse.json({ success: true, action, transactionNo, summary: { lowNow: txResult.lowNow, outNow: txResult.outNow } });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ 
      error: "Failed to process checkout", 
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


