import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get("period") || "6weeks"; // 6weeks, 6months

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    let groupBy = "week";
    let numPeriods = 6;
    
    if (period === "6months") {
      startDate.setMonth(now.getMonth() - 5);
      startDate.setDate(1);
      groupBy = "month";
      numPeriods = 6;
    } else {
      // For weekly data, we need to go back further to include "This Month" and "Last Month"
      // Go back 3 months to ensure we have monthly data
      startDate.setMonth(now.getMonth() - 3);
      startDate.setDate(1);
      groupBy = "week";
      numPeriods = 6;
    }

    // Get all sales within date range
    // Exclude returns (negative quantities) and void transactions to show actual sales revenue
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
        quantity: { gt: 0 }, // Only positive quantities (actual sales, not returns)
        refId: { not: { startsWith: "void-" } }, // Exclude void transactions
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Identify voided sales by checking if there's a void transaction that matches
    // A sale is considered voided if there's a void StockMovement or void Sale for the same product
    // within a reasonable time window (e.g., same day or within 24 hours)
    const stockMovement = (prisma as any).stockMovement;
    let voidedSaleIds = new Set<string>();
    
    if (stockMovement) {
      const voidMovements = await stockMovement.findMany({
        where: {
          type: "void",
          ...(startDate && {
            createdAt: {
              gte: startDate,
              lte: now,
            },
          }),
        },
        select: {
          refId: true,
          productId: true,
          createdAt: true,
        },
      });
      
      // Match void movements to sales by product and time proximity
      for (const voidMov of voidMovements) {
        const matchingSale = sales.find(sale => 
          sale.productId === voidMov.productId &&
          Math.abs(new Date(sale.createdAt).getTime() - new Date(voidMov.createdAt).getTime()) < 24 * 60 * 60 * 1000 // Within 24 hours
        );
        if (matchingSale) {
          voidedSaleIds.add(matchingSale.id);
        }
      }
    }
    
    // Also check void sales directly - if a sale's refId matches a void's pattern
    const voidSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
        quantity: { lt: 0 },
        refId: { startsWith: "void-" },
      },
    });
    
    voidSales.forEach(voidSale => {
      // Try to find the original sale that was voided
      // Voids are created with refId like "void-{timestamp}", but we need to match by product and time
      const matchingSale = sales.find(sale =>
        sale.productId === voidSale.productId &&
        Math.abs(new Date(sale.createdAt).getTime() - new Date(voidSale.createdAt).getTime()) < 24 * 60 * 60 * 1000 &&
        sale.refId && voidSale.refId && voidSale.refId.includes(sale.refId)
      );
      if (matchingSale) {
        voidedSaleIds.add(matchingSale.id);
      }
    });
    
    // Filter out voided sales from salesWithRevenue
    // Use actual sale data with stored amounts (all should be positive now, excluding voided ones)
    const salesWithRevenue = sales
      .filter(sale => !voidedSaleIds.has(sale.id))
      .map((sale) => ({
        ...sale,
        revenue: sale.totalAmount,
      }));

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    };

    // Group by period
    const groupedData: Record<string, { revenue: number; date: Date }> = {};
    
    salesWithRevenue.forEach((sale) => {
      let key = "";
      const date = new Date(sale.createdAt);
      
      if (groupBy === "week") {
        // For weekly grouping, calculate Monday of the week
        // Handle timezone by using local date components
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        
        // Calculate days to subtract to get to Monday
        // If Sunday (0), subtract 6 days; otherwise subtract (dayOfWeek - 1) days
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const weekStart = new Date(year, month, day - daysToSubtract);
        weekStart.setHours(0, 0, 0, 0);
        key = weekStart.toISOString().split("T")[0]; // YYYY-MM-DD of Monday
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, date };
      }
      
      groupedData[key].revenue += sale.revenue;
    });

    // Get previous period data for growth calculation
    // Exclude returns and voids to match current period calculation
    const previousPeriodStart = new Date(startDate);
    const periodLength = now.getTime() - startDate.getTime();
    previousPeriodStart.setTime(startDate.getTime() - periodLength);

    const previousSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
        quantity: { gt: 0 }, // Only positive quantities (actual sales, not returns)
        refId: { not: { startsWith: "void-" } }, // Exclude void transactions
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Identify voided sales in previous period (same logic as current period)
    let previousVoidedSaleIds = new Set<string>();
    
    if (stockMovement) {
      const previousVoidMovements = await stockMovement.findMany({
        where: {
          type: "void",
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
        select: {
          refId: true,
          productId: true,
          createdAt: true,
        },
      });
      
      // Match void movements to sales by product and time proximity
      for (const voidMov of previousVoidMovements) {
        const matchingSale = previousSales.find(sale => 
          sale.productId === voidMov.productId &&
          Math.abs(new Date(sale.createdAt).getTime() - new Date(voidMov.createdAt).getTime()) < 24 * 60 * 60 * 1000
        );
        if (matchingSale) {
          previousVoidedSaleIds.add(matchingSale.id);
        }
      }
    }
    
    // Also check void sales directly in previous period
    const previousVoidSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
        quantity: { lt: 0 },
        refId: { startsWith: "void-" },
      },
    });
    
    previousVoidSales.forEach(voidSale => {
      const matchingSale = previousSales.find(sale =>
        sale.productId === voidSale.productId &&
        Math.abs(new Date(sale.createdAt).getTime() - new Date(voidSale.createdAt).getTime()) < 24 * 60 * 60 * 1000 &&
        sale.refId && voidSale.refId && voidSale.refId.includes(sale.refId)
      );
      if (matchingSale) {
        previousVoidedSaleIds.add(matchingSale.id);
      }
    });

    // Filter out voided sales from previous period
    const previousSalesWithRevenue = previousSales
      .filter(sale => !previousVoidedSaleIds.has(sale.id))
      .map((sale) => ({
        ...sale,
        revenue: sale.totalAmount,
      }));

    const previousGroupedData: Record<string, { revenue: number }> = {};
    
    previousSalesWithRevenue.forEach((sale) => {
      let key = "";
      const date = new Date(sale.createdAt);
      
      if (groupBy === "week") {
        const weekNum = getWeekNumber(date);
        key = `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }
      
      if (!previousGroupedData[key]) {
        previousGroupedData[key] = { revenue: 0 };
      }
      
      previousGroupedData[key].revenue += sale.revenue;
    });

    // Calculate average previous revenue for growth comparison
    const previousValues = Object.values(previousGroupedData);
    const avgPreviousRevenue = previousValues.length > 0
      ? previousValues.reduce((sum, p) => sum + p.revenue, 0) / previousValues.length
      : 0;

    // Format data for response - create the specific format shown in the image
    const sortedEntries = Object.entries(groupedData).sort(([a], [b]) => a.localeCompare(b));
    
    // Create the specific periods shown in the image
    const chartData = [];
    
    if (groupBy === "week") {
      // For weekly data, create "This Week", "Last Week", etc.
      // Helper function to get Monday of a week (handles timezone properly)
      const getMondayOfWeek = (date: Date): Date => {
        const d = new Date(date);
        // Get local date components to avoid timezone issues
        const year = d.getFullYear();
        const month = d.getMonth();
        const day = d.getDate();
        const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        
        // Calculate days to subtract to get to Monday
        // If Sunday (0), subtract 6 days; otherwise subtract (dayOfWeek - 1) days
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const monday = new Date(year, month, day - daysToSubtract);
        monday.setHours(0, 0, 0, 0); // Start of day
        return monday;
      };
      
      const now = new Date();
      const thisWeekStart = getMondayOfWeek(now);
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
      thisWeekEnd.setHours(23, 59, 59, 999); // End of Sunday
      
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
      lastWeekEnd.setHours(23, 59, 59, 999);
      
      // This Week - filter sales that fall within this week's date range
      const thisWeekKey = thisWeekStart.toISOString().split("T")[0];
      // Also calculate directly from filtered sales to ensure accuracy
      const thisWeekSales = salesWithRevenue.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= thisWeekStart && saleDate <= thisWeekEnd;
      });
      const thisWeekRevenue = thisWeekSales.reduce((sum, sale) => sum + sale.revenue, 0);
      const thisWeekData = { revenue: thisWeekRevenue, date: thisWeekStart };
      
      // Last Week - filter sales that fall within last week's date range
      const lastWeekKey = lastWeekStart.toISOString().split("T")[0];
      const lastWeekSales = salesWithRevenue.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= lastWeekStart && saleDate <= lastWeekEnd;
      });
      const lastWeekRevenue = lastWeekSales.reduce((sum, sale) => sum + sale.revenue, 0);
      const lastWeekData = { revenue: lastWeekRevenue, date: lastWeekStart };
      
      // Calculate growth for This Week vs Last Week
      const thisWeekGrowth = lastWeekData.revenue > 0 
        ? ((thisWeekData.revenue - lastWeekData.revenue) / lastWeekData.revenue) * 100
        : (lastWeekData.revenue === 0 && thisWeekData.revenue > 0) 
          ? 100 
          : 0;
      
      const lastWeekGrowth = 0; // Last week has no previous period to compare
      
      chartData.push({
        period: "This Week",
        revenue: Math.round(thisWeekData.revenue * 100) / 100,
        growth: Math.round(thisWeekGrowth * 10) / 10,
      });
      
      chartData.push({
        period: "Last Week",
        revenue: Math.round(lastWeekData.revenue * 100) / 100,
        growth: Math.round(lastWeekGrowth * 10) / 10,
      });
      
      // This Month - aggregate all sales from start of current month
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const thisMonthSales = salesWithRevenue.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= thisMonthStart && saleDate <= thisMonthEnd;
      });
      const thisMonthRevenue = thisMonthSales.reduce((sum, sale) => sum + sale.revenue, 0);
      
      // Last Month - aggregate all sales from previous month
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthSales = salesWithRevenue.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= lastMonthStart && saleDate <= lastMonthEnd;
      });
      const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + sale.revenue, 0);
      
      // Calculate growth for This Month vs Last Month
      const thisMonthGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : (lastMonthRevenue === 0 && thisMonthRevenue > 0) 
          ? 100 
          : 0;
      
      const lastMonthGrowth = 0; // Last month has no previous period to compare
      
      chartData.push({
        period: "This Month",
        revenue: Math.round(thisMonthRevenue * 100) / 100,
        growth: Math.round(thisMonthGrowth * 10) / 10,
      });
      
      chartData.push({
        period: "Last Month",
        revenue: Math.round(lastMonthRevenue * 100) / 100,
        growth: Math.round(lastMonthGrowth * 10) / 10,
      });
    } else {
      // For monthly data, use the original logic
      chartData.push(...sortedEntries.map(([key, value], index) => {
        const label = value.date.toLocaleDateString("en-US", { month: "short" });
        
        // Calculate growth compared to average previous revenue
        let growth = 0;
        if (avgPreviousRevenue > 0) {
          growth = ((value.revenue - avgPreviousRevenue) / avgPreviousRevenue) * 100;
        } else if (value.revenue > 0) {
          growth = 100;
        }
        
        return {
          period: label,
          revenue: Math.round(value.revenue * 100) / 100,
          growth: Math.round(growth * 10) / 10,
        };
      }));
    }

    // Calculate summary statistics
    const totalRevenue = salesWithRevenue.reduce((sum, sale) => sum + sale.revenue, 0);
    const previousTotalRevenue = previousSalesWithRevenue.reduce((sum, sale) => sum + sale.revenue, 0);
    
    const overallGrowth = previousTotalRevenue > 0
      ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100
      : 0;

    // Calculate average revenue - for weekly view, only use weekly data points
    let avgRevenue = 0;
    if (groupBy === "week") {
      // Only use "This Week" and "Last Week" for weekly average
      const weeklyData = chartData.filter(d => d.period === "This Week" || d.period === "Last Week");
      const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.revenue, 0);
      avgRevenue = weeklyData.length > 0 ? weeklyTotal / weeklyData.length : 0;
    } else {
      // For monthly view, use all chart data points
      avgRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;
    }

    // Calculate peak revenue - context-aware based on view type
    let peakRevenue = 0;
    let peakPeriod = "";
    
    if (groupBy === "week") {
      // For weekly view, only consider weekly periods (exclude monthly data)
      const weeklyData = chartData.filter(d => d.period === "This Week" || d.period === "Last Week");
      if (weeklyData.length > 0) {
        peakRevenue = Math.max(...weeklyData.map(d => d.revenue));
        peakPeriod = weeklyData.find(d => d.revenue === peakRevenue)?.period || "";
      }
    } else {
      // For monthly view, all chartData entries are already months, so simple max works
      if (chartData.length > 0) {
        peakRevenue = Math.max(...chartData.map(d => d.revenue));
        peakPeriod = chartData.find(d => d.revenue === peakRevenue)?.period || "";
      }
    }

    return NextResponse.json({
      chartData,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgRevenue: Math.round(avgRevenue * 100) / 100,
        peakRevenue: Math.round(peakRevenue * 100) / 100,
        peakPeriod,
        overallGrowth: Math.round(overallGrowth * 10) / 10,
      },
      period,
    });
  } catch (error) {
    console.error("Error fetching revenue trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue trends data" },
      { status: 500 }
    );
  }
}

