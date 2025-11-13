import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {
      quantity: { gt: 0 }, // Only positive quantities (sales, not refunds)
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

    const rows = sales.map((sale) => ({
      dateTime: sale.createdAt,
      transactionNo: sale.refId || sale.id,
      productName: sale.product?.name || "Unknown Product",
      barcode: sale.product?.barcode || "-",
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      total: sale.totalAmount,
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

