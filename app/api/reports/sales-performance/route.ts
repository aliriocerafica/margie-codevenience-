import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get("period") || "6months"; // 7days, 30days, 6months

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    let groupBy = "month";
    
    if (period === "7days") {
      startDate.setDate(now.getDate() - 6);
      groupBy = "day";
    } else if (period === "30days") {
      startDate.setDate(now.getDate() - 29);
      groupBy = "day";
    } else {
      // 6 months
      startDate.setMonth(now.getMonth() - 5);
      startDate.setDate(1);
      groupBy = "month";
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

    // Separate sales and voids
    const salesOnly = sales.filter(sale => sale.quantity > 0);
    const voidsOnly = sales.filter(sale => sale.quantity < 0);
    
    // Use actual sale data with stored prices and amounts
    const salesWithRevenue = salesOnly.map((sale) => ({
      ...sale,
      revenue: sale.totalAmount,
      quantity: sale.quantity,
    }));

    const voidsWithRevenue = voidsOnly.map((voidSale) => ({
      ...voidSale,
      revenue: Math.abs(voidSale.totalAmount), // Make positive for display
      quantity: Math.abs(voidSale.quantity), // Make positive for display
    }));

    // Group by period for sales
    const groupedData: Record<string, { sales: number; transactions: number; date: Date }> = {};
    
    salesWithRevenue.forEach((sale) => {
      let key = "";
      const date = new Date(sale.createdAt);
      
      if (groupBy === "day") {
        key = date.toISOString().split("T")[0]; // YYYY-MM-DD
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
      }
      
      if (!groupedData[key]) {
        groupedData[key] = { sales: 0, transactions: 0, date };
      }
      
      groupedData[key].sales += sale.revenue;
      groupedData[key].transactions += 1;
    });

    // Format data for response
    let chartData;
    if (groupBy === "day" && period === "7days") {
      // For 7 days, create Monday to Sunday format
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayData: Record<string, { sales: number; transactions: number; avgOrder: number }> = {};
      
      // Initialize all days with 0 values
      days.forEach(day => {
        dayData[day] = { sales: 0, transactions: 0, avgOrder: 0 };
      });
      
      // Fill in actual data
      Object.entries(groupedData).forEach(([key, value]) => {
        const dayIndex = value.date.getDay();
        const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Convert Sunday=0 to Sunday=6
        dayData[dayName].sales += value.sales;
        dayData[dayName].transactions += value.transactions;
      });
      
      // Calculate averages and format
      chartData = days.map(day => ({
        label: day,
        sales: Math.round(dayData[day].sales * 100) / 100,
        transactions: dayData[day].transactions,
        avgOrder: dayData[day].transactions > 0 ? Math.round((dayData[day].sales / dayData[day].transactions) * 100) / 100 : 0,
      }));
    } else {
      // For other periods, use the original logic
      chartData = Object.entries(groupedData).map(([key, value]) => {
        let label = "";
        if (groupBy === "day") {
          label = value.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } else {
          // For months
          label = value.date.toLocaleDateString("en-US", { month: "short" });
        }
        
        return {
          label,
          sales: Math.round(value.sales * 100) / 100,
          transactions: value.transactions,
          avgOrder: value.transactions > 0 ? Math.round((value.sales / value.transactions) * 100) / 100 : 0,
        };
      });
    }

    // Calculate totals following proper business accounting
    // Gross Sales = Total sales before any voids/returns (business volume)
    const grossSales = salesWithRevenue.reduce((sum, sale) => sum + sale.revenue, 0);
    // Returns/Voids = Total amount returned/voided (negative impact)
    const returnsAmount = voidsWithRevenue.reduce((sum, voidSale) => sum + voidSale.revenue, 0);
    // Net Sales = Gross Sales - Returns (actual revenue earned)
    const netSales = grossSales - returnsAmount;
    
    // Transaction counts (business perspective)
    const salesTransactions = salesWithRevenue.length; // Successful sales
    const returnTransactions = voidsWithRevenue.length; // Returns/voids
    const totalTransactions = salesTransactions + returnTransactions; // All transactions
    
    // Business metrics
    const avgOrderValue = salesTransactions > 0 ? netSales / salesTransactions : 0;
    const returnRate = grossSales > 0 ? (returnsAmount / grossSales) * 100 : 0;
    
    // Quantity metrics (business perspective)
    // Units Sold = Total units sold before returns
    const unitsSold = salesWithRevenue.reduce((sum, sale) => sum + sale.quantity, 0);
    // Units Returned = Total units returned/voided
    const unitsReturned = voidsWithRevenue.reduce((sum, voidSale) => sum + voidSale.quantity, 0);
    // Net Units Sold = Units sold minus returns (actual units kept by customers)
    const netUnitsSold = unitsSold - unitsReturned;
    
    // Peak performance metrics (based on NET sales per day)
    const dailySalesMap = new Map<string, { amount: number; date: Date }>();
    
    // Calculate gross sales per day
    salesWithRevenue.forEach(sale => {
      const dateKey = sale.createdAt.toDateString();
      if (!dailySalesMap.has(dateKey)) {
        dailySalesMap.set(dateKey, { amount: 0, date: sale.createdAt });
      }
      dailySalesMap.get(dateKey)!.amount += sale.revenue;
    });
    
    // Subtract returns per day to get net sales per day
    voidsWithRevenue.forEach(voidSale => {
      const dateKey = voidSale.createdAt.toDateString();
      if (!dailySalesMap.has(dateKey)) {
        dailySalesMap.set(dateKey, { amount: 0, date: voidSale.createdAt });
      }
      dailySalesMap.get(dateKey)!.amount -= voidSale.revenue;
    });
    
    // Find peak day
    const peakSalesDay = Array.from(dailySalesMap.values()).reduce((peak, day) => {
      return day.amount > peak.amount ? day : peak;
    }, { amount: 0, date: null as Date | null });
    
    // Essential business metrics
    // Average transaction value (net revenue per all transactions including returns)
    const avgTransactionValue = totalTransactions > 0 ? netSales / totalTransactions : 0;
    
    // Sales success rate (successful sales vs total transactions)
    const salesSuccessRate = totalTransactions > 0 ? (salesTransactions / totalTransactions) * 100 : 0;
    
    // Revenue per successful sale (same as avgOrderValue, kept for clarity in detailed reports)
    const revenuePerSale = salesTransactions > 0 ? netSales / salesTransactions : 0;
    
    // Business efficiency metrics (based on actual period days)
    const totalDays = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const salesPerDay = salesTransactions / totalDays;
    const revenuePerDay = netSales / totalDays;
    
    // Inventory turnover insights (based on NET units, not gross)
    const avgUnitsPerSale = salesTransactions > 0 ? netUnitsSold / salesTransactions : 0;
    const avgUnitsPerReturn = returnTransactions > 0 ? unitsReturned / returnTransactions : 0;
    
    // Customer behavior metrics
    const returnFrequency = totalTransactions > 0 ? (returnTransactions / totalTransactions) * 100 : 0;
    const avgReturnValue = returnTransactions > 0 ? returnsAmount / returnTransactions : 0;

    // Calculate growth (compare to previous period)
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
    });

    // Separate previous sales and voids
    const previousSalesOnly = previousSales.filter(sale => sale.quantity > 0);
    const previousVoidsOnly = previousSales.filter(sale => sale.quantity < 0);
    
    const previousTotalSales = previousSalesOnly.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const previousVoidAmount = previousVoidsOnly.reduce((sum, sale) => sum + Math.abs(sale.totalAmount), 0);
    const previousNetSales = previousTotalSales - previousVoidAmount;

    // Calculate growth based on net sales (actual revenue)
    const salesGrowth = (previousNetSales > 0 && netSales > 0) 
      ? ((netSales - previousNetSales) / previousNetSales) * 100 
      : (previousNetSales === 0 && netSales > 0) 
        ? 100 // 100% growth if starting from 0
        : 0; // No growth if both are 0

    const previousSalesTransactions = previousSalesOnly.length;
    const transactionsGrowth = (previousSalesTransactions > 0 && salesTransactions > 0)
      ? ((salesTransactions - previousSalesTransactions) / previousSalesTransactions) * 100
      : (previousSalesTransactions === 0 && salesTransactions > 0)
        ? 100 // 100% growth if starting from 0
        : 0; // No growth if both are 0

    return NextResponse.json({
      chartData,
      summary: {
        // Core Financial Metrics (Business Standard)
        grossSales: Math.round(grossSales * 100) / 100,        // Total sales before returns
        returnsAmount: Math.round(returnsAmount * 100) / 100,  // Total returns/voids
        netSales: Math.round(netSales * 100) / 100,           // Actual revenue earned
        returnRate: Math.round(returnRate * 10) / 10,          // Return rate percentage
        
        // Transaction Metrics (Business Perspective)
        salesTransactions,                                      // Successful sales
        returnTransactions,                                     // Returns/voids
        totalTransactions,                                      // All transactions
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,  // Average sale value
        avgTransactionValue: Math.round(avgTransactionValue * 100) / 100, // Net revenue per transaction
        revenuePerSale: Math.round(revenuePerSale * 100) / 100, // Revenue per successful sale
        
        // Quantity Metrics (Inventory Perspective)
        unitsSold,                                             // Units sold before returns
        unitsReturned,                                         // Units returned
        netUnitsSold,                                          // Actual units kept by customers
        
        // Performance Metrics (Business KPIs)
        salesSuccessRate: Math.round(salesSuccessRate * 10) / 10, // Sales success rate
        peakSalesAmount: Math.round(peakSalesDay.amount * 100) / 100, // Best day sales
        peakSalesDate: peakSalesDay.date,                      // Date of peak sales
        
        // Business Efficiency Metrics
        salesPerDay: Math.round(salesPerDay * 100) / 100,      // Average sales per day (2 decimals)
        revenuePerDay: Math.round(revenuePerDay * 100) / 100,  // Average revenue per day
        
        // Inventory & Customer Behavior
        avgUnitsPerSale: Math.round(avgUnitsPerSale * 10) / 10, // Average units per sale
        avgUnitsPerReturn: Math.round(avgUnitsPerReturn * 10) / 10, // Average units per return
        returnFrequency: Math.round(returnFrequency * 10) / 10, // Return frequency percentage
        avgReturnValue: Math.round(avgReturnValue * 100) / 100,  // Average return value
        
        // Growth Metrics
        salesGrowth: Math.round(salesGrowth * 10) / 10,
        transactionsGrowth: Math.round(transactionsGrowth * 10) / 10,
        
        // Period Information
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching sales performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales performance data" },
      { status: 500 }
    );
  }
}

