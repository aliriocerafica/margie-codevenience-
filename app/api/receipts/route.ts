import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const transactionNo = searchParams.get("transactionNo");
    const userId = searchParams.get("userId"); // For filtering by user (admin only)

    // Build where clause
    const where: any = {
      quantity: { gt: 0 }, // Only positive quantities (sales, not refunds)
      refId: { not: { startsWith: "void-" } }, // Exclude void transactions
    };

    // Date filter
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

    // Transaction number filter
    if (transactionNo) {
      where.refId = { contains: transactionNo };
    }

    // User filter (for admin to filter by staff member)
    const userRole = (session.user as any)?.role;
    if (userId && userRole === "Admin") {
      where.userId = userId;
    } else if (userRole === "Staff") {
      // Staff can only see their own receipts
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
      });
      if (user) {
        where.userId = user.id;
      }
    }

    // Fetch sales
    const sales = await prisma.sale.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            barcode: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get void transactions to exclude their corresponding original sales
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
        const timestamp = voidSale.refId.replace("void-", "");
        voidedTimestamps.add(timestamp);
      }
    });

    // Filter out sales that have been voided
    const validSales = sales.filter(sale => {
      if (!sale.refId || !sale.refId.startsWith("checkout-")) {
        return true;
      }
      const timestamp = sale.refId.replace("checkout-", "");
      return !voidedTimestamps.has(timestamp);
    });

    // Group sales by transaction number (refId)
    const transactionMap = new Map<string, {
      transactionNo: string;
      dateTime: Date;
      items: Array<{
        name: string;
        barcode: string | null;
        price: number;
        quantity: number;
        total: number;
      }>;
      subtotal: number;
      total: number;
      userId: string | null;
      handledBy: string | null;
    }>();

    validSales.forEach((sale) => {
      const transactionNo = sale.refId || sale.id;
      
      if (!transactionMap.has(transactionNo)) {
        transactionMap.set(transactionNo, {
          transactionNo,
          dateTime: sale.createdAt,
          items: [],
          subtotal: 0,
          total: 0,
          userId: sale.userId,
          handledBy: null,
        });
      }

      const transaction = transactionMap.get(transactionNo)!;
      transaction.items.push({
        name: sale.product.name,
        barcode: sale.product.barcode || null,
        price: sale.unitPrice,
        quantity: sale.quantity,
        total: sale.totalAmount,
      });

      transaction.subtotal += sale.totalAmount;
      transaction.total += sale.totalAmount;
    });

    // Fetch user information for all unique userIds
    const allUserIds = Array.from(new Set(
      Array.from(transactionMap.values())
        .map(t => t.userId)
        .filter(Boolean) as string[]
    ));

    const users = await prisma.user.findMany({
      where: {
        id: { in: allUserIds },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u.email]));

    // Add handledBy email to each transaction
    const transactions = Array.from(transactionMap.values()).map(transaction => ({
      ...transaction,
      handledBy: transaction.userId ? userMap.get(transaction.userId) || null : null,
    }));

    // Sort by date (newest first)
    transactions.sort((a, b) => 
      new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}

