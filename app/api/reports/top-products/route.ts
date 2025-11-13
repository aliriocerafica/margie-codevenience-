import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const period = searchParams.get("period") || "30days"; // daily, weekly, monthly, all

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date | undefined = undefined;
    
    if (period === "daily") {
      // Today only
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      // Last 7 days
      startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "monthly") {
      // Last 30 days
      startDate = new Date();
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    }
    // If period is "all", startDate remains undefined (no filter)

    // Get all sales within date range
    const sales = await prisma.sale.findMany({
      where: {
        ...(startDate && {
          createdAt: {
            gte: startDate,
            lte: now,
          },
        }),
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Aggregate by product
    const productStats: Record<string, {
      productId: string;
      name: string;
      category: string;
      barcode: string | null;
      price: string;
      unitCost: string | null;
      sold: number;
      revenue: number;
    }> = {};

    sales.forEach((sale) => {
      const productId = sale.productId;
      const product = sale.product;
      const productName = product?.name || "Unknown Product";
      const categoryName = product?.category?.name || "Uncategorized";
      const barcode = product?.barcode || null;
      const price = product?.price || "0";
      const unitCost = product?.unitCost || null;

      if (!productStats[productId]) {
        productStats[productId] = {
          productId,
          name: productName,
          category: categoryName,
          barcode,
          price,
          unitCost,
          sold: 0,
          revenue: 0,
        };
      }

      productStats[productId].sold += sale.quantity;
      productStats[productId].revenue += sale.totalAmount;
    });

    // Convert to array and sort by units sold
    const sortedProducts = Object.values(productStats)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, limit);

    // Calculate total revenue for percentage calculations
    const totalRevenue = sortedProducts.reduce((sum, p) => sum + p.revenue, 0);

    // Calculate growth trends by comparing to previous period
    const productsWithTrends = await Promise.all(
      sortedProducts.map(async (product) => {
        // Get previous period data
        let previousPeriodStart: Date | undefined;
        let previousPeriodEnd: Date | undefined;

        if (startDate) {
          const periodLength = now.getTime() - startDate.getTime();
          previousPeriodEnd = new Date(startDate);
          previousPeriodStart = new Date(startDate.getTime() - periodLength);
        }

        const previousSales = await prisma.sale.findMany({
          where: {
            productId: product.productId,
            ...(previousPeriodStart && previousPeriodEnd && {
              createdAt: {
                gte: previousPeriodStart,
                lt: previousPeriodEnd,
              },
            }),
          },
        });

        const previousQuantity = previousSales.reduce(
          (sum, sale) => sum + sale.quantity,
          0
        );

        let trend = "+0%";
        if (previousQuantity > 0) {
          const growth = ((product.sold - previousQuantity) / previousQuantity) * 100;
          trend = `${growth >= 0 ? "+" : ""}${Math.round(growth)}%`;
        } else if (product.sold > 0) {
          trend = "+100%";
        }

        // Parse price and unitCost to numbers for calculations
        const sellingPrice = parseFloat(product.price) || 0;
        const costPrice = product.unitCost ? parseFloat(product.unitCost) : 0;
        const profitPerUnit = sellingPrice - costPrice;
        const totalProfit = profitPerUnit * product.sold;
        const percentageOfTotalSales = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;

        return {
          ...product,
          revenue: Math.round(product.revenue * 100) / 100,
          trend,
          sellingPrice,
          profitPerUnit: Math.round(profitPerUnit * 100) / 100,
          totalProfit: Math.round(totalProfit * 100) / 100,
          percentageOfTotalSales: Math.round(percentageOfTotalSales * 100) / 100,
        };
      })
    );

    return NextResponse.json({
      products: productsWithTrends,
      period,
    });
  } catch (error) {
    console.error("Error fetching top products:", error);
    return NextResponse.json(
      { error: "Failed to fetch top products data" },
      { status: 500 }
    );
  }
}

