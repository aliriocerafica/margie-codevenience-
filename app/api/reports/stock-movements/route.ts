import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const skip = (page - 1) * pageSize;
    const type = searchParams.get("type"); // sale | refund | manual | void
    const dateFromStr = searchParams.get("dateFrom");
    const dateToStr = searchParams.get("dateTo");

    const where: any = {};
    if (type && type !== "all") {
      where.type = type;
    }
    if (dateFromStr || dateToStr) {
      where.createdAt = {};
      if (dateFromStr) where.createdAt.gte = new Date(dateFromStr);
      if (dateToStr) {
        const to = new Date(dateToStr);
        // include entire end day if a date without time
        if (!dateToStr.includes("T")) {
          to.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = to;
      }
    }

    const stockMovement = (prisma as any).stockMovement;
    if (!stockMovement) {
      return NextResponse.json({ page, pageSize, total: 0, rows: [], note: "Prisma client not generated for StockMovement. Run: npx prisma generate && npx prisma db push" });
    }

    const [rows, total] = await Promise.all([
      stockMovement.findMany({
        orderBy: { createdAt: "desc" },
        include: { product: { select: { name: true, barcode: true } } },
        where,
        skip,
        take: pageSize,
      }),
      stockMovement.count({ where }),
    ]);

    return NextResponse.json({ page, pageSize, total, rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch stock movements" }, { status: 500 });
  }
}


