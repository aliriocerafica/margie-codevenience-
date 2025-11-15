import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {
      quantity: { lt: 0 }, // Only negative quantities (returns/refunds)
      refId: { not: { startsWith: "void-" } }, // Exclude void transactions (those are in separate report)
    };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        if (!dateTo.includes("T")) {
          to.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = to;
      }
    }

    const returns = await prisma.sale.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
          },
        },
        // Get user info if available
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Also check StockMovement for refund types with reasons (exclude void - those are in separate report)
    const stockMovements = await (prisma as any).stockMovement.findMany({
      where: {
        type: "refund", // Only refund, not void
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Combine data from both sources
    // Use refId as the key since both Sale and StockMovement share the same refId for returns
    const returnMap = new Map<string, any>();

    // Process returns from Sale model first (has refund amount)
    returns.forEach((ret) => {
      // Use refId as key to match with StockMovement
      const key = ret.refId || ret.id;
      returnMap.set(key, {
        date: ret.createdAt,
        transactionNo: ret.refId || ret.id,
        productName: ret.product?.name || "Unknown Product",
        quantity: Math.abs(ret.quantity),
        refundAmount: Math.abs(ret.totalAmount),
        reason: null,
        handledBy: ret.userId || null,
      });
    });

    // Process returns from StockMovement model (for reasons)
    // Match by refId to combine with existing Sale records
    stockMovements.forEach((movement: any) => {
      const key = movement.refId || movement.id;
      const existing = returnMap.get(key);
      if (existing) {
        // Update existing entry with reason from StockMovement
        existing.reason = movement.reason || null;
        if (!existing.handledBy) {
          existing.handledBy = movement.userId || null;
        }
      } else {
        // Only create new entry if no matching Sale record exists
        // This handles edge cases where StockMovement exists but Sale doesn't
        returnMap.set(key, {
          date: movement.createdAt,
          transactionNo: movement.refId || movement.id,
          productName: movement.product?.name || "Unknown Product",
          quantity: Math.abs(movement.quantity),
          refundAmount: 0, // StockMovement doesn't have amount
          reason: movement.reason || null,
          handledBy: movement.userId || null,
        });
      }
    });

    const rows = Array.from(returnMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Error fetching returned items:", error);
    return NextResponse.json(
      { error: "Failed to fetch returned items data" },
      { status: 500 }
    );
  }
}

