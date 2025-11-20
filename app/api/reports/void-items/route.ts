import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Fetch StockMovements with type "void" only
    const stockMovements = await (prisma as any).stockMovement.findMany({
      where: {
        type: "void",
        ...(dateFrom || dateTo ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? {
              lte: (() => {
                const to = new Date(dateTo);
                if (!dateTo.includes("T")) {
                  to.setHours(23, 59, 59, 999);
                }
                return to;
              })()
            } : {}),
          },
        } : {}),
      },
      include: {
        product: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch user information for all unique userIds from stockMovements and voidSales
    const allUserIds = new Set<string>();
    stockMovements.forEach((mov: any) => {
      if (mov.userId) allUserIds.add(mov.userId);
    });

    // Also check for void sales (negative quantity sales with void refId)
    // Only get sales with negative quantity AND refId starting with "void-" to ensure we only get void transactions, not original sales
    const voidSales = await prisma.sale.findMany({
      where: {
        refId: { startsWith: "void-" },
        quantity: { lt: 0 }, // Only negative quantities (void transactions)
        ...(dateFrom || dateTo ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? {
              lte: (() => {
                const to = new Date(dateTo);
                if (!dateTo.includes("T")) {
                  to.setHours(23, 59, 59, 999);
                }
                return to;
              })()
            } : {}),
          },
        } : {}),
      },
      include: {
        product: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add userIds from voidSales (approvedBy is for audit, not for "handled by")
    voidSales.forEach((sale) => {
      if (sale.userId) allUserIds.add(sale.userId);
    });

    // Fetch all users
    const userMap = new Map<string, string>();
    if (allUserIds.size > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: Array.from(allUserIds) },
        },
        select: {
          id: true,
          email: true,
        },
      });
      users.forEach(u => userMap.set(u.id, u.email));
    }

    // Combine data from both sources
    // Use StockMovements as primary source (they are the actual void actions themselves)
    // Only include void sales that have refId starting with "void-" (actual void transactions, not original sales)
    const voidMap = new Map<string, any>();

    // First, process void stock movements (these are the actual void actions)
    // Use StockMovement ID as unique key to avoid accidentally matching with original sales
    stockMovements.forEach((movement: any) => {
      const key = `sm-${movement.id}`;
      
      // Calculate void amount from product price if available
      const productPrice = parseFloat(movement.product?.price || "0");
      const voidAmount = Math.abs(movement.quantity) * productPrice;
      
      voidMap.set(key, {
        date: movement.createdAt,
        transactionNo: movement.refId || `void-${movement.id}`,
        productName: movement.product?.name || "Unknown Product",
        quantity: Math.abs(movement.quantity),
        voidAmount: voidAmount,
        reason: movement.reason || null,
        handledBy: movement.userId ? userMap.get(movement.userId) || "Unknown" : null,
      });
    });

    // Then, process void sales (only those with refId starting with "void-")
    // Try to match them with StockMovements by product and time proximity
    voidSales.forEach((sale) => {
      // Only process sales that have refId starting with "void-" (actual void transactions)
      if (!sale.refId?.startsWith('void-')) {
        return; // Skip this sale - it's not a void transaction
      }

      // Try to find matching StockMovement by product and time (within 10 seconds)
      let matchedMovement = null;
      for (const movement of stockMovements) {
        if (
          movement.productId === sale.productId &&
          Math.abs(new Date(movement.createdAt).getTime() - new Date(sale.createdAt).getTime()) < 10000
        ) {
          matchedMovement = movement;
          break;
        }
      }

      if (matchedMovement) {
        // Update existing StockMovement entry with more accurate sale data
        const key = `sm-${matchedMovement.id}`;
        const existing = voidMap.get(key);
        if (existing) {
          existing.voidAmount = Math.abs(sale.totalAmount); // Use actual sale amount
          existing.transactionNo = sale.refId; // Use void transaction refId
          // Use userId (staff who requested void, or admin if voiding directly)
          if (!existing.handledBy) {
            existing.handledBy = sale.userId ? userMap.get(sale.userId) || "Unknown" : null;
          }
        }
      } else {
        // Standalone void sale (no matching StockMovement found)
        const key = `sale-${sale.id}`;
        // Use userId (staff who requested void, or admin if voiding directly)
        voidMap.set(key, {
          date: sale.createdAt,
          transactionNo: sale.refId || sale.id,
          productName: sale.product?.name || "Unknown Product",
          quantity: Math.abs(sale.quantity),
          voidAmount: Math.abs(sale.totalAmount),
          reason: null,
          handledBy: sale.userId ? userMap.get(sale.userId) || "Unknown" : null,
        });
      }
    });

    const rows = Array.from(voidMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Error fetching void items:", error);
    return NextResponse.json(
      { error: "Failed to fetch void items data" },
      { status: 500 }
    );
  }
}

