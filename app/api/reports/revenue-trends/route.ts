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
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Use actual sale data with stored amounts
    const salesWithRevenue = sales.map((sale) => ({
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
        // For weekly grouping, use a simpler approach
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1); // Start of week (Monday)
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
    const previousPeriodStart = new Date(startDate);
    const periodLength = now.getTime() - startDate.getTime();
    previousPeriodStart.setTime(startDate.getTime() - periodLength);

    const previousSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const previousSalesWithRevenue = previousSales.map((sale) => ({
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
      const now = new Date();
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay() + 1); // Monday of this week
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      
      // This Week
      const thisWeekKey = thisWeekStart.toISOString().split("T")[0];
      const thisWeekData = groupedData[thisWeekKey] || { revenue: 0, date: thisWeekStart };
      
      // Last Week
      const lastWeekKey = lastWeekStart.toISOString().split("T")[0];
      const lastWeekData = groupedData[lastWeekKey] || { revenue: 0, date: lastWeekStart };
      
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

    const avgRevenue = chartData.length > 0
      ? totalRevenue / chartData.length
      : 0;

    const peakRevenue = chartData.length > 0
      ? Math.max(...chartData.map(d => d.revenue))
      : 0;

    const peakPeriod = chartData.find(d => d.revenue === peakRevenue)?.period || "";

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

