import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get("period") || "monthly"; // daily, weekly, monthly, all (or legacy: 7days, 30days, 6months)
    const granularity = (searchParams.get("granularity") || "daily") as "daily" | "weekly" | "monthly";

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date | undefined = undefined;
    let groupBy = "day";
    
    if (period === "daily") {
      // Today only
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      groupBy = "day";
    } else if (period === "weekly") {
      // Last 7 days
      startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupBy = "day";
    } else if (period === "monthly") {
      // Last 30 days
      startDate = new Date();
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      groupBy = "day";
    } else if (period === "all") {
      // All time - no date filter
      startDate = undefined;
      groupBy = "month";
    } else if (period === "7days") {
      // Legacy support
      startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      groupBy = "day";
    } else if (period === "30days") {
      // Legacy support
      startDate = new Date();
      startDate.setDate(now.getDate() - 29);
      groupBy = "day";
    } else {
      // Legacy 6months or default
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 5);
      startDate.setDate(1);
      groupBy = "month";
    }

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
        product: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Separate sales, voids, and returns
    const salesOnly = sales.filter(sale => sale.quantity > 0);
    const negativeSales = sales.filter(sale => sale.quantity < 0);
    
    // Separate voids (refId starts with "void-") from returns (refId starts with "return-")
    const voidsOnly = negativeSales.filter(sale => sale.refId?.startsWith("void-"));
    const returnsOnly = negativeSales.filter(sale => sale.refId?.startsWith("return-"));
    
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
        const matchingSale = salesOnly.find(sale => 
          sale.productId === voidMov.productId &&
          Math.abs(new Date(sale.createdAt).getTime() - new Date(voidMov.createdAt).getTime()) < 24 * 60 * 60 * 1000 // Within 24 hours
        );
        if (matchingSale) {
          voidedSaleIds.add(matchingSale.id);
        }
      }
    }
    
    // Also check void sales directly - if a sale's refId matches a void's pattern
    voidsOnly.forEach(voidSale => {
      // Try to find the original sale that was voided
      // Voids are created with refId like "void-{timestamp}", but we need to match by product and time
      const matchingSale = salesOnly.find(sale =>
        sale.productId === voidSale.productId &&
        Math.abs(new Date(sale.createdAt).getTime() - new Date(voidSale.createdAt).getTime()) < 24 * 60 * 60 * 1000 &&
        sale.refId && voidSale.refId && voidSale.refId.includes(sale.refId)
      );
      if (matchingSale) {
        voidedSaleIds.add(matchingSale.id);
      }
    });
    
    // Filter out voided sales from salesWithRevenue
    const salesWithRevenue = salesOnly
      .filter(sale => !voidedSaleIds.has(sale.id))
      .map((sale) => ({
        ...sale,
        revenue: sale.totalAmount,
        quantity: sale.quantity,
      }));

    // Only count returns (not voids) in returnsWithRevenue
    // Voids cancel out the original sale, so they shouldn't be counted separately
    const returnsWithRevenue = returnsOnly.map((returnSale) => ({
      ...returnSale,
      revenue: Math.abs(returnSale.totalAmount), // Make positive for display
      quantity: Math.abs(returnSale.quantity), // Make positive for display
    }));
    
    // Voids are kept for calculating net sales but not counted as separate transactions
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
      chartData = Object.entries(groupedData)
        .sort(([a], [b]) => a.localeCompare(b)) // Sort by date key
        .map(([key, value]) => {
          let label = "";
          if (groupBy === "day") {
            label = value.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          } else {
            // For months - include year for "all time"
            if (period === "all") {
              label = value.date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            } else {
              label = value.date.toLocaleDateString("en-US", { month: "short" });
            }
          }
          
          return {
            label,
            sales: Math.round(value.sales * 100) / 100,
            transactions: value.transactions,
            avgOrder: value.transactions > 0 ? Math.round((value.sales / value.transactions) * 100) / 100 : 0,
          };
        });
    }

    // Build tabular rows based on requested granularity
    const parseNumber = (v: any): number => {
      const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
      return isNaN(n) ? 0 : n;
    };

    type RowDaily = { date: string; sales: number; grossProfit: number; unitsSold: number };
    type RowWeekly = { week: string; totalSales: number; grossProfit: number; changeVsLastWeekPct: number };
    type RowMonthly = { scope: string; totalSales: number; grossProfit: number; totalTransactions: number };

    const startOfWeek = (d: Date) => {
      const dt = new Date(d);
      const day = dt.getDay(); // 0=Sun
      const diff = (day === 0 ? -6 : 1) - day; // make Monday start
      dt.setDate(dt.getDate() + diff);
      dt.setHours(0,0,0,0);
      return dt;
    };
    const endOfWeek = (d: Date) => {
      const s = startOfWeek(d);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      e.setHours(23,59,59,999);
      return e;
    };
    const monthScope = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Precompute per-transaction gross profit using product.unitCost
    const enriched = salesOnly.map(s => {
      const cost = parseNumber(s.product?.unitCost);
      const profitPerUnit = parseNumber(s.unitPrice) - cost;
      const grossProfit = profitPerUnit * s.quantity;
      return { ...s, grossProfit };
    });
    // Note: voids/returns are excluded from sales totals and profit; if needed, can subtract.

    let rows: Array<RowDaily | RowWeekly | RowMonthly> = [];
    if (granularity === 'daily') {
      const map = new Map<string, { sales: number; profit: number; units: number }>();
      enriched.forEach(s => {
        const key = new Date(s.createdAt).toISOString().split('T')[0];
        const prev = map.get(key) || { sales: 0, profit: 0, units: 0 };
        prev.sales += s.totalAmount;
        prev.profit += s.grossProfit;
        prev.units += s.quantity;
        map.set(key, prev);
      });
      rows = Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([key, agg]) => ({
        date: key,
        sales: Math.round(agg.sales * 100) / 100,
        grossProfit: Math.round(agg.profit * 100) / 100,
        unitsSold: agg.units,
      }));
    } else if (granularity === 'weekly') {
      // Group by week (Mon-Sun)
      type Agg = { sales: number; profit: number; start: Date; end: Date };
      const map = new Map<string, Agg>();
      enriched.forEach(s => {
        const d = new Date(s.createdAt);
        const sWeek = startOfWeek(d);
        const eWeek = endOfWeek(d);
        const key = sWeek.toISOString().split('T')[0];
        const prev = map.get(key) || { sales: 0, profit: 0, start: sWeek, end: eWeek };
        prev.sales += s.totalAmount;
        prev.profit += s.grossProfit;
        map.set(key, prev);
      });
      const ordered = Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
      rows = ordered.map(([_, agg], idx) => {
        const label = `Week ${idx + 1} (${agg.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${agg.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
        const prev = idx > 0 ? ordered[idx - 1][1] : null;
        const change = prev && prev.sales > 0 ? ((agg.sales - prev.sales) / prev.sales) * 100 : 0;
        return {
          week: label,
          totalSales: Math.round(agg.sales * 100) / 100,
          grossProfit: Math.round(agg.profit * 100) / 100,
          changeVsLastWeekPct: Math.round(change * 10) / 10,
        } as RowWeekly;
      });
    } else {
      // monthly
      type Agg = { sales: number; profit: number; tx: number; anyDate: Date };
      const map = new Map<string, Agg>();
      enriched.forEach(s => {
        const d = new Date(s.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
        const prev = map.get(key) || { sales: 0, profit: 0, tx: 0, anyDate: d };
        prev.sales += s.totalAmount;
        prev.profit += s.grossProfit;
        prev.tx += 1;
        prev.anyDate = d;
        map.set(key, prev);
      });
      rows = Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([_, agg]) => ({
        scope: monthScope(agg.anyDate),
        totalSales: Math.round(agg.sales * 100) / 100,
        grossProfit: Math.round(agg.profit * 100) / 100,
        totalTransactions: agg.tx,
      }));
    }

    // Calculate totals following proper business accounting
    // Gross Sales = Total sales before any voids/returns (business volume) - excluding voided sales
    const grossSales = salesWithRevenue.reduce((sum, sale) => sum + sale.revenue, 0);
    // Returns = Total amount returned (negative impact)
    const returnsAmount = returnsWithRevenue.reduce((sum, returnSale) => sum + returnSale.revenue, 0);
    // Voids = Total amount voided (these cancel out original sales, so we subtract them)
    const voidsAmount = voidsWithRevenue.reduce((sum, voidSale) => sum + voidSale.revenue, 0);
    // Net Sales = Gross Sales - Returns - Voids (actual revenue earned)
    const netSales = grossSales - returnsAmount - voidsAmount;
    
    // Calculate Total Revenue (unit price x quantity sold) - same as netSales
    const totalRevenue = netSales;
    
    // Calculate Total Cost of Goods Sold (original price x quantity sold)
    const totalCOGS = salesWithRevenue.reduce((sum, sale) => {
      const unitCost = parseNumber(sale.product?.unitCost);
      return sum + (unitCost * sale.quantity);
    }, 0);
    
    // Calculate Gross Profit (Total Revenue - Total COGS)
    const grossProfit = totalRevenue - totalCOGS;
    
    // Transaction counts (business perspective)
    const salesTransactions = salesWithRevenue.length; // Successful sales (excluding voided ones)
    const returnTransactions = returnsWithRevenue.length; // Returns only (not voids - voids cancel out original sales)
    const totalTransactions = salesTransactions + returnTransactions; // All transactions (voided sales are excluded)
    
    // Business metrics
    const avgOrderValue = salesTransactions > 0 ? netSales / salesTransactions : 0;
    const returnRate = grossSales > 0 ? (returnsAmount / grossSales) * 100 : 0;
    
    // Quantity metrics (business perspective)
    // Units Sold = Total units sold before returns
    const unitsSold = salesWithRevenue.reduce((sum, sale) => sum + sale.quantity, 0);
    // Units Returned = Total units returned (not including voids - voids cancel out original sales)
    const unitsReturned = returnsWithRevenue.reduce((sum, returnSale) => sum + returnSale.quantity, 0);
    // Units Voided = Total units voided (for reference, but these cancel out original sales)
    const unitsVoided = voidsWithRevenue.reduce((sum, voidSale) => sum + voidSale.quantity, 0);
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
    
    // Subtract returns and voids per day to get net sales per day
    returnsWithRevenue.forEach(returnSale => {
      const dateKey = returnSale.createdAt.toDateString();
      if (!dailySalesMap.has(dateKey)) {
        dailySalesMap.set(dateKey, { amount: 0, date: returnSale.createdAt });
      }
      dailySalesMap.get(dateKey)!.amount -= returnSale.revenue;
    });
    
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
    // For "all time", calculate days from first sale, otherwise use period
    let totalDays = 1;
    if (startDate) {
      totalDays = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    } else if (sales.length > 0) {
      // For "all time", use first sale date to calculate total days
      const firstSale = sales[0];
      const firstSaleDate = new Date(firstSale.createdAt);
      totalDays = Math.max(1, Math.ceil((now.getTime() - firstSaleDate.getTime()) / (1000 * 60 * 60 * 24)));
    }
    const salesPerDay = salesTransactions / totalDays;
    const revenuePerDay = netSales / totalDays;
    
    // Inventory turnover insights (based on NET units, not gross)
    const avgUnitsPerSale = salesTransactions > 0 ? netUnitsSold / salesTransactions : 0;
    const avgUnitsPerReturn = returnTransactions > 0 ? unitsReturned / returnTransactions : 0;
    
    // Customer behavior metrics
    const returnFrequency = totalTransactions > 0 ? (returnTransactions / totalTransactions) * 100 : 0;
    const avgReturnValue = returnTransactions > 0 ? returnsAmount / returnTransactions : 0;
    
    // Void metrics (for reference)
    const voidFrequency = salesTransactions > 0 ? (voidsWithRevenue.length / (salesTransactions + voidsWithRevenue.length)) * 100 : 0;

    // Calculate growth (compare to previous period)
    // For "all time", skip growth calculation as there's no previous period
    let previousSales: any[] = [];
    if (startDate) {
      const previousPeriodStart = new Date(startDate);
      const periodLength = now.getTime() - startDate.getTime();
      previousPeriodStart.setTime(startDate.getTime() - periodLength);

      previousSales = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      });
    }

    // Separate previous sales, voids, and returns
    const previousSalesOnly = previousSales.filter(sale => sale.quantity > 0);
    const previousNegativeSales = previousSales.filter(sale => sale.quantity < 0);
    const previousVoidsOnly = previousNegativeSales.filter(sale => sale.refId?.startsWith("void-"));
    const previousReturnsOnly = previousNegativeSales.filter(sale => sale.refId?.startsWith("return-"));
    
    // Note: For previous period, we don't need to identify voided sales for transaction count
    // since we're only comparing net sales amounts
    const previousTotalSales = previousSalesOnly.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const previousReturnsAmount = previousReturnsOnly.reduce((sum, sale) => sum + Math.abs(sale.totalAmount), 0);
    const previousVoidAmount = previousVoidsOnly.reduce((sum, sale) => sum + Math.abs(sale.totalAmount), 0);
    const previousNetSales = previousTotalSales - previousReturnsAmount - previousVoidAmount;

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
      granularity,
      rows,
      summary: {
        // Core Financial Metrics (Business Standard)
        grossSales: Math.round(grossSales * 100) / 100,        // Total sales before returns (excluding voided sales)
        returnsAmount: Math.round(returnsAmount * 100) / 100,  // Total returns (not including voids)
        voidsAmount: Math.round(voidsAmount * 100) / 100,      // Total voids (for reference)
        netSales: Math.round(netSales * 100) / 100,           // Actual revenue earned (gross - returns - voids)
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
        
        // New Summary Metrics
        totalRevenue: Math.round(totalRevenue * 100) / 100,   // Total Revenue (unit price x quantity sold) = netSales
        totalCOGS: Math.round(totalCOGS * 100) / 100,          // Total Cost of Goods Sold (original price x quantity sold)
        grossProfit: Math.round(grossProfit * 100) / 100,      // Gross Profit (Total Revenue - Total COGS)
        totalQuantitySold: unitsSold,                         // Total Quantity Sold (gross units, before returns)
        
        // Period Information
        period,
        startDate: startDate ? startDate.toISOString() : null,
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

