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
            price: true,
            unitCost: true,
          },
        },
      },
    });

    // Aggregate by product
    const productMap: Record<string, {
      productName: string;
      costPerUnit: number;
      sellingPrice: number;
      qtySold: number;
      totalProfit: number;
    }> = {};

    sales.forEach((sale) => {
      const productId = sale.productId;
      const productName = sale.product?.name || "Unknown Product";
      const sellingPrice = sale.unitPrice;
      const costPerUnit = sale.product?.unitCost ? parseFloat(sale.product.unitCost) : 0;
      const grossProfitPerUnit = sellingPrice - costPerUnit;
      const quantity = sale.quantity;

      if (!productMap[productId]) {
        productMap[productId] = {
          productName,
          costPerUnit,
          sellingPrice,
          qtySold: 0,
          totalProfit: 0,
        };
      }

      productMap[productId].qtySold += quantity;
      productMap[productId].totalProfit += grossProfitPerUnit * quantity;
    });

    const rows = Object.values(productMap).map((product) => {
      const grossProfitPerUnit = product.sellingPrice - product.costPerUnit;
      const profitMargin = product.sellingPrice > 0 
        ? (grossProfitPerUnit / product.sellingPrice) * 100 
        : 0;

      return {
        productName: product.productName,
        costPerUnit: Math.round(product.costPerUnit * 100) / 100,
        sellingPrice: Math.round(product.sellingPrice * 100) / 100,
        grossProfitPerUnit: Math.round(grossProfitPerUnit * 100) / 100,
        qtySold: product.qtySold,
        totalProfit: Math.round(product.totalProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
      };
    }).sort((a, b) => b.totalProfit - a.totalProfit);

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Error fetching profit margin:", error);
    return NextResponse.json(
      { error: "Failed to fetch profit margin data" },
      { status: 500 }
    );
  }
}

