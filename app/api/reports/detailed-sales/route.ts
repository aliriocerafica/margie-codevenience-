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

    // Identify voided sales by checking for void StockMovements
    // A sale is considered voided if there's a void StockMovement for the same product within 24 hours
    const voidMovementWhere: any = {
      type: "void",
    };
    
    if (dateFrom || dateTo) {
      voidMovementWhere.createdAt = {};
      if (dateFrom) voidMovementWhere.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        if (!dateTo.includes("T")) {
          to.setHours(23, 59, 59, 999);
        }
        voidMovementWhere.createdAt.lte = to;
      }
    }
    
    const voidMovements = await (prisma as any).stockMovement.findMany({
      where: voidMovementWhere,
      select: {
        productId: true,
        createdAt: true,
      },
    });

    // Create a map of voided sale IDs to void dates (for display)
    const voidedSaleInfo = new Map<string, Date>();
    
    // Match void movements to sales by product and time proximity (within 24 hours)
    for (const voidMov of voidMovements) {
      const matchingSale = sales.find(sale => 
        sale.productId === voidMov.productId &&
        Math.abs(new Date(sale.createdAt).getTime() - new Date(voidMov.createdAt).getTime()) < 24 * 60 * 60 * 1000
      );
      if (matchingSale) {
        // Store the void date (when the void happened)
        voidedSaleInfo.set(matchingSale.id, voidMov.createdAt);
      }
    }

    // Also check void sales directly
    const voidSales = await prisma.sale.findMany({
      where: {
        quantity: { lt: 0 },
        refId: { startsWith: "void-" },
      },
      select: {
        refId: true,
        productId: true,
        createdAt: true,
      },
    });

    voidSales.forEach(voidSale => {
      // Try to find the original sale that was voided
      const matchingSale = sales.find(sale =>
        sale.productId === voidSale.productId &&
        Math.abs(new Date(sale.createdAt).getTime() - new Date(voidSale.createdAt).getTime()) < 24 * 60 * 60 * 1000
      );
      if (matchingSale && !voidedSaleInfo.has(matchingSale.id)) {
        voidedSaleInfo.set(matchingSale.id, voidSale.createdAt);
      }
    });

    // Keep all sales (including voided ones) for transparency
    const validSales = sales;

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

    const rows = validSales.map((sale) => {
      const returnedQty = returnedQuantities.get(sale.id) || 0;
      const remainingQty = sale.quantity - returnedQty;
      const isFullyReturned = remainingQty <= 0;
      const isVoided = voidedSaleInfo.has(sale.id);
      const voidedDate = voidedSaleInfo.get(sale.id);
      
      return {
        id: sale.id, // Include sale ID for return functionality
        dateTime: sale.createdAt,
        transactionNo: sale.refId || sale.id,
        productName: sale.product?.name || "Unknown Product",
        barcode: sale.product?.barcode || "-",
        quantity: sale.quantity, // Original quantity
        returnedQuantity: returnedQty, // How much has been returned
        remainingQuantity: Math.max(0, remainingQty), // How much can still be returned
        isFullyReturned, // Flag if fully returned
        isVoided, // Flag if voided
        voidedDate: voidedDate ? voidedDate.toISOString() : null, // When it was voided
        unitPrice: sale.unitPrice,
        total: sale.totalAmount,
        productId: sale.productId, // Include product ID for returns
      };
    });

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Error fetching detailed sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch detailed sales data" },
      { status: 500 }
    );
  }
}

