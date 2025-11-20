import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ transactionNo: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionNo } = await params;

    // Fetch all sales for this transaction
    const sales = await prisma.sale.findMany({
      where: {
        refId: transactionNo,
        quantity: { gt: 0 }, // Only positive quantities
      },
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
        createdAt: "asc",
      },
    });

    if (sales.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Check if user has access (staff can only see their own, admin can see all)
    const userRole = (session.user as any)?.role;
    if (userRole === "Staff") {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
      });
      if (user && sales[0].userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Check if transaction was voided
    const voidSales = await prisma.sale.findMany({
      where: {
        quantity: { lt: 0 },
        refId: { startsWith: "void-" },
      },
      select: {
        refId: true,
      },
    });

    const voidedTimestamps = new Set<string>();
    voidSales.forEach(voidSale => {
      if (voidSale.refId && voidSale.refId.startsWith("void-")) {
        const timestamp = voidSale.refId.replace("void-", "");
        voidedTimestamps.add(timestamp);
      }
    });

    if (transactionNo.startsWith("checkout-")) {
      const timestamp = transactionNo.replace("checkout-", "");
      if (voidedTimestamps.has(timestamp)) {
        return NextResponse.json({ error: "Transaction was voided" }, { status: 404 });
      }
    }

    // Get user information
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

    // Build receipt data
    const items = sales.map(sale => ({
      name: sale.product.name,
      barcode: sale.product.barcode || null,
      price: sale.unitPrice,
      quantity: sale.quantity,
      total: sale.totalAmount,
    }));

    const subtotal = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const total = subtotal; // Can add discount logic here if needed

    // Get the first sale's date as transaction date
    const dateTime = sales[0].createdAt;
    const handledBy = sales[0].userId ? userMap.get(sales[0].userId) || null : null;

    return NextResponse.json({
      transactionNo,
      dateTime,
      items,
      subtotal,
      discount: 0, // Can be calculated from discount field if stored
      total,
      handledBy,
      storeName: "Margie CodeVenience",
      storePhone: "",
      storeAddressLines: [],
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt" },
      { status: 500 }
    );
  }
}

