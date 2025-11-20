import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {
      quantity: { gt: 0 }, // Only positive quantities (sales, not refunds)
      refId: { not: { startsWith: "void-" } }, // Exclude void transactions
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

    const sales = await prisma.sale.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            barcode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch user information for all unique userIds
    const userIds = Array.from(new Set(sales.map(s => s.userId).filter(Boolean) as string[]));
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
      },
    });
    const userMap = new Map(users.map(u => [u.id, u.email]));

    // Get all void transactions to exclude their corresponding original sales
    // Void transactions have refId format: void-{timestamp}
    // Original sales have refId format: checkout-{timestamp}
    const voidSales = await prisma.sale.findMany({
      where: {
        quantity: { lt: 0 },
        refId: { startsWith: "void-" },
      },
      select: {
        refId: true,
      },
    });

    // Extract timestamps from void transactions
    const voidedTimestamps = new Set<string>();
    voidSales.forEach(voidSale => {
      if (voidSale.refId && voidSale.refId.startsWith("void-")) {
        // Extract timestamp from void-{timestamp}
        const timestamp = voidSale.refId.replace("void-", "");
        voidedTimestamps.add(timestamp);
      }
    });

    // Filter out sales that have been voided
    const validSales = sales.filter(sale => {
      if (!sale.refId || !sale.refId.startsWith("checkout-")) {
        return true; // Keep sales without standard refId format
      }
      // Extract timestamp from checkout-{timestamp}
      const timestamp = sale.refId.replace("checkout-", "");
      // Exclude if this timestamp exists in void transactions
      return !voidedTimestamps.has(timestamp);
    });

    // Check for returns for each sale
    // Returns have refId pattern: return-{originalSaleRefId || originalSaleId}-{timestamp}
    // Get ALL return transactions (not filtered by date) because returns can happen after the sale date
    const returnTransactions = await prisma.sale.findMany({
      where: {
        quantity: { lt: 0 }, // Only return transactions (negative quantity)
        refId: { startsWith: "return-" }, // Only return transactions
      },
      select: {
        refId: true,
        productId: true,
        quantity: true,
        createdAt: true,
      },
    });

    // Calculate returned quantities per sale
    const returnedQuantities = new Map<string, number>();
    returnTransactions.forEach(returnTx => {
      if (!returnTx.refId) return;
      
      // Pattern: return-{originalRefId || originalId}-{timestamp}
      // Try to match each sale to this return transaction
      for (const sale of validSales) {
        // Skip if product doesn't match
        if (sale.productId !== returnTx.productId) continue;
        
        // Check if return refId starts with return-{saleRefId}- or return-{saleId}-
        const saleRefId = sale.refId || sale.id;
        const expectedPrefix = `return-${saleRefId}-`;
        
        if (returnTx.refId.startsWith(expectedPrefix)) {
          const current = returnedQuantities.get(sale.id) || 0;
          returnedQuantities.set(sale.id, current + Math.abs(returnTx.quantity));
          break; // Found match, no need to check other sales
        }
      }
    });

    // Group sales by transaction number (refId)
    const transactionMap = new Map<string, {
      transactionNo: string;
      dateTime: Date;
      items: Array<{
        id: string;
        productId: string;
        productName: string;
        barcode: string;
        quantity: number;
        returnedQuantity: number;
        remainingQuantity: number;
        unitPrice: number;
        total: number;
      }>;
      totalAmount: number;
      totalQuantity: number;
      handledBy: string | null;
      isVoided: boolean;
      hasReturns: boolean;
      isFullyReturned: boolean;
    }>();

    validSales.forEach((sale) => {
      const transactionNo = sale.refId || sale.id;
      const returnedQty = returnedQuantities.get(sale.id) || 0;
      const remainingQty = sale.quantity - returnedQty;
      
      if (!transactionMap.has(transactionNo)) {
        transactionMap.set(transactionNo, {
          transactionNo,
          dateTime: sale.createdAt,
          items: [],
          totalAmount: 0,
          totalQuantity: 0,
          handledBy: sale.userId ? userMap.get(sale.userId) || "Unknown" : null,
          isVoided: false,
          hasReturns: false,
          isFullyReturned: false,
        });
      }

      const transaction = transactionMap.get(transactionNo)!;
      
      transaction.items.push({
        id: sale.id,
        productId: sale.productId,
        productName: sale.product?.name || "Unknown Product",
        barcode: sale.product?.barcode || "-",
        quantity: sale.quantity,
        returnedQuantity: returnedQty,
        remainingQuantity: Math.max(0, remainingQty),
        unitPrice: sale.unitPrice,
        total: sale.totalAmount,
      });

      transaction.totalAmount += sale.totalAmount;
      transaction.totalQuantity += sale.quantity;
      
      if (returnedQty > 0) {
        transaction.hasReturns = true;
      }
      
      if (remainingQty <= 0) {
        transaction.isFullyReturned = true;
      } else {
        transaction.isFullyReturned = false; // If any item is not fully returned, transaction is not fully returned
      }
    });

    // Convert map to array and sort by date (newest first)
    const rows = Array.from(transactionMap.values())
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      .map(transaction => ({
        transactionNo: transaction.transactionNo,
        dateTime: transaction.dateTime,
        items: transaction.items,
        itemCount: transaction.items.length,
        totalQuantity: transaction.totalQuantity,
        totalAmount: transaction.totalAmount,
        handledBy: transaction.handledBy,
        isVoided: transaction.isVoided,
        hasReturns: transaction.hasReturns,
        isFullyReturned: transaction.isFullyReturned,
      }));

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Error fetching detailed sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch detailed sales data" },
      { status: 500 }
    );
  }
}

