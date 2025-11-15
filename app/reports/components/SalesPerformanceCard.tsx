"use client";

import { Card, CardHeader, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem, Tabs, Tab, Input, Textarea, Chip, Pagination } from "@heroui/react";
import { BarChart3, TrendingUp, Download, FileText, RotateCcw, XCircle, ArrowUpDown, Calendar, Hash, Package, DollarSign, Percent } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';
import DataTable from "@/components/DataTable";
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SalesPerformanceCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFileType, setExportFileType] = useState<string>("xlsx");
  const [period, setPeriod] = useState<string>("7days");
  const [modalPeriod, setModalPeriod] = useState<string>("monthly");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [reportDateFrom, setReportDateFrom] = useState<string>("");
  const [reportDateTo, setReportDateTo] = useState<string>("");
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<string>("");
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [sortField, setSortField] = useState<string>("dateTime");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  
  // Profit Margin sorting and pagination
  const [profitSortField, setProfitSortField] = useState<string>("totalProfit");
  const [profitSortDirection, setProfitSortDirection] = useState<"asc" | "desc">("desc");
  const [profitCurrentPage, setProfitCurrentPage] = useState<number>(1);

  // Toast notification function
  const showNotification = ({ title, description, type }: { title: string; description: string; type: 'success' | 'error' }) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${type === 'success'
      ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
      : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
      }`;

    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          ${type === 'success'
        ? '<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
        : '<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
      }
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-sm">${title}</h4>
          <p class="text-sm mt-1">${description}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  };

  // Auto-determine granularity based on period
  const getGranularity = (period: string): "daily" | "weekly" | "monthly" => {
    if (period === "all") return "monthly";
    if (period === "daily" || period === "weekly") return "daily";
    if (period === "monthly") return "daily";
    return "daily";
  };

  const granularity = getGranularity(modalPeriod);

  // Fetch data for card preview (7 days)
  const { data: cardData, error: cardError } = useSWR(
    `/api/reports/sales-performance?period=${period}&granularity=daily`, 
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  
  // Fetch data for modal
  const { data: modalData, error: modalError } = useSWR(
    isModalOpen ? `/api/reports/sales-performance?period=${modalPeriod}&granularity=${granularity}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const salesChartData = cardData?.chartData || [];
  const extendedSalesData = modalData?.chartData || [];
  const summary = cardData?.summary || {
    // Core Financial Metrics (Business Standard)
    grossSales: 0,
    returnsAmount: 0,
    netSales: 0,
    returnRate: 0,
    // Transaction Metrics (Business Perspective)
    salesTransactions: 0,
    returnTransactions: 0,
    totalTransactions: 0,
    avgOrderValue: 0,
    avgTransactionValue: 0,
    revenuePerSale: 0,
    // Quantity Metrics (Inventory Perspective)
    unitsSold: 0,
    unitsReturned: 0,
    netUnitsSold: 0,
    // Performance Metrics (Business KPIs)
    salesSuccessRate: 0,
    peakSalesAmount: 0,
    peakSalesDate: null,
    // Business Efficiency Metrics
    salesPerDay: 0,
    revenuePerDay: 0,
    // Inventory & Customer Behavior
    avgUnitsPerSale: 0,
    avgUnitsPerReturn: 0,
    returnFrequency: 0,
    avgReturnValue: 0,
    // Growth Metrics
    salesGrowth: 0,
    transactionsGrowth: 0,
  };
  const modalSummary = modalData?.summary || {
    // Core Financial Metrics (Business Standard)
    grossSales: 0,
    returnsAmount: 0,
    netSales: 0,
    returnRate: 0,
    // Transaction Metrics (Business Perspective)
    salesTransactions: 0,
    returnTransactions: 0,
    totalTransactions: 0,
    avgOrderValue: 0,
    avgTransactionValue: 0,
    revenuePerSale: 0,
    // Quantity Metrics (Inventory Perspective)
    unitsSold: 0,
    unitsReturned: 0,
    netUnitsSold: 0,
    // Performance Metrics (Business KPIs)
    salesSuccessRate: 0,
    peakSalesAmount: 0,
    peakSalesDate: null,
    // Business Efficiency Metrics
    salesPerDay: 0,
    revenuePerDay: 0,
    // Inventory & Customer Behavior
    avgUnitsPerSale: 0,
    avgUnitsPerReturn: 0,
    returnFrequency: 0,
    avgReturnValue: 0,
    // Growth Metrics
    salesGrowth: 0,
    transactionsGrowth: 0,
    // New Summary Metrics
    totalRevenue: 0,
    totalCOGS: 0,
    grossProfit: 0,
    totalQuantitySold: 0,
  };

  const rows = (modalData?.rows ?? []) as any[];

  // Fetch data for detailed reports
  const detailedSalesQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (reportDateFrom) params.set("dateFrom", reportDateFrom);
    if (reportDateTo) params.set("dateTo", reportDateTo);
    return `/api/reports/detailed-sales?${params.toString()}`;
  }, [reportDateFrom, reportDateTo]);

  const profitMarginQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (reportDateFrom) params.set("dateFrom", reportDateFrom);
    if (reportDateTo) params.set("dateTo", reportDateTo);
    return `/api/reports/profit-margin?${params.toString()}`;
  }, [reportDateFrom, reportDateTo]);

  const returnedItemsQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (reportDateFrom) params.set("dateFrom", reportDateFrom);
    if (reportDateTo) params.set("dateTo", reportDateTo);
    return `/api/reports/returned-items?${params.toString()}`;
  }, [reportDateFrom, reportDateTo]);

  const voidItemsQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (reportDateFrom) params.set("dateFrom", reportDateFrom);
    if (reportDateTo) params.set("dateTo", reportDateTo);
    return `/api/reports/void-items?${params.toString()}`;
  }, [reportDateFrom, reportDateTo]);

  const { data: detailedSalesData, mutate: mutateDetailedSales } = useSWR(
    isModalOpen && activeTab === "detailed-sales" ? detailedSalesQuery : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  const { data: profitMarginData } = useSWR(
    isModalOpen && activeTab === "profit-margin" ? profitMarginQuery : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  const { data: returnedItemsData } = useSWR(
    isModalOpen && activeTab === "returned-items" ? returnedItemsQuery : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  const { data: voidItemsData } = useSWR(
    isModalOpen && activeTab === "void-items" ? voidItemsQuery : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const detailedSalesRows = detailedSalesData?.rows || [];
  const profitMarginRows = profitMarginData?.rows || [];
  const returnedItemsRows = returnedItemsData?.rows || [];
  const voidItemsRows = voidItemsData?.rows || [];

  // Sorting and pagination for detailed sales
  const sortedAndPaginatedSales = useMemo(() => {
    const sorted = [...detailedSalesRows].sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "dateTime") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [detailedSalesRows, sortField, sortDirection, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(detailedSalesRows.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // Sorting and pagination for profit margin
  const sortedAndPaginatedProfit = useMemo(() => {
    const sorted = [...profitMarginRows].sort((a: any, b: any) => {
      let aVal = a[profitSortField];
      let bVal = b[profitSortField];
      
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (profitSortDirection === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    const startIndex = (profitCurrentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [profitMarginRows, profitSortField, profitSortDirection, profitCurrentPage, itemsPerPage]);

  const profitTotalPages = Math.ceil(profitMarginRows.length / itemsPerPage);

  const handleProfitSort = (field: string) => {
    if (profitSortField === field) {
      setProfitSortDirection(profitSortDirection === "asc" ? "desc" : "asc");
    } else {
      setProfitSortField(field);
      setProfitSortDirection("desc");
    }
    setProfitCurrentPage(1);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setProfitCurrentPage(1);
  }, [reportDateFrom, reportDateTo]);

  const handleReturnClick = (row: any) => {
    // Prevent opening modal for voided items
    if (row.isVoided) {
      showNotification({
        title: 'Item Voided',
        description: 'This item has been voided and cannot be returned.',
        type: 'error'
      });
      return;
    }
    // Prevent opening modal for fully returned items
    if (row.isFullyReturned) {
      showNotification({
        title: 'Item Already Returned',
        description: 'This item has been fully returned and cannot be returned again.',
        type: 'error'
      });
      return;
    }
    setSelectedSale(row);
    setReturnQuantity(1);
    setReturnReason("");
    setIsReturnModalOpen(true);
  };

  const handleProcessReturn = async () => {
    if (!selectedSale) return;

    const maxReturnable = selectedSale.remainingQuantity || selectedSale.quantity;
    if (returnQuantity <= 0 || returnQuantity > maxReturnable) {
      showNotification({
        title: 'Invalid Quantity',
        description: `Return quantity must be between 1 and ${maxReturnable} (${selectedSale.returnedQuantity || 0} already returned)`,
        type: 'error'
      });
      return;
    }

    setIsProcessingReturn(true);
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            saleId: selectedSale.id,
            productId: selectedSale.productId,
            quantity: returnQuantity,
            reason: returnReason || undefined,
          }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification({
          title: 'Return Failed',
          description: data.error || 'Failed to process return',
          type: 'error'
        });
        return;
      }

      showNotification({
        title: 'Return Processed',
        description: data.message || 'Item returned successfully',
        type: 'success'
      });

      // Refresh the data
      mutateDetailedSales();
      setIsReturnModalOpen(false);
      setSelectedSale(null);
      setReturnQuantity(1);
      setReturnReason("");
    } catch (error) {
      showNotification({
        title: 'Return Failed',
        description: 'An error occurred while processing the return',
        type: 'error'
      });
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const exportCurrentTab = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (activeTab === "detailed-sales") {
      const workbook = XLSX.utils.book_new();
      const sheetData = detailedSalesRows.map((r: any) => ({
        'Date & Time': new Date(r.dateTime).toLocaleString(),
        'Transaction No.': r.transactionNo,
        'Product Name': r.productName,
        'Barcode': r.barcode,
        'Quantity': r.quantity,
        'Unit Price (₱)': r.unitPrice,
        'Total (₱)': r.total,
      }));
      const sheet = XLSX.utils.json_to_sheet(sheetData);
      sheet['!cols'] = [
        { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, sheet, 'Detailed Sales');
      XLSX.writeFile(workbook, `detailed-sales-${timestamp}.xlsx`);
      setIsExportOpen(false);
      return;
    }
    
    if (activeTab === "profit-margin") {
      const workbook = XLSX.utils.book_new();
      const sheetData = profitMarginRows.map((r: any) => ({
        'Product Name': r.productName,
        'Cost per Unit (₱)': r.costPerUnit,
        'Selling Price (₱)': r.sellingPrice,
        'Gross Profit per Unit (₱)': r.grossProfitPerUnit,
        'Qty Sold': r.qtySold,
        'Total Profit (₱)': r.totalProfit,
        'Profit Margin (%)': r.profitMargin,
      }));
      const sheet = XLSX.utils.json_to_sheet(sheetData);
      sheet['!cols'] = [
        { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, sheet, 'Profit Margin');
      XLSX.writeFile(workbook, `profit-margin-${timestamp}.xlsx`);
      setIsExportOpen(false);
      return;
    }
    
    if (activeTab === "returned-items") {
      const workbook = XLSX.utils.book_new();
      const sheetData = returnedItemsRows.map((r: any) => ({
        'Date': new Date(r.date).toLocaleDateString(),
        'Transaction No.': r.transactionNo,
        'Product Name': r.productName,
        'Quantity': r.quantity,
        'Refund Amount (₱)': r.refundAmount,
        'Reason for Return': r.reason || '-',
      }));
      const sheet = XLSX.utils.json_to_sheet(sheetData);
      sheet['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 25 }
      ];
      XLSX.utils.book_append_sheet(workbook, sheet, 'Returned Items');
      XLSX.writeFile(workbook, `returned-items-${timestamp}.xlsx`);
      setIsExportOpen(false);
      return;
    }
    
    if (activeTab === "void-items") {
      const workbook = XLSX.utils.book_new();
      const sheetData = voidItemsRows.map((r: any) => ({
        'Date': new Date(r.date).toLocaleDateString(),
        'Transaction No.': r.transactionNo,
        'Product Name': r.productName,
        'Quantity': r.quantity,
        'Void Amount (₱)': r.voidAmount,
      }));
      const sheet = XLSX.utils.json_to_sheet(sheetData);
      sheet['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, sheet, 'Void Items');
      XLSX.writeFile(workbook, `void-items-${timestamp}.xlsx`);
      setIsExportOpen(false);
      return;
    }

    // For overview tab, export sales performance report
    if (activeTab === "overview") {
      exportSalesPerformance();
      return;
    }

    // Fallback: open export modal
    setIsExportOpen(true);
  };

  const exportSalesPerformance = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const chartData = modalData?.chartData || [];
    const summary = modalSummary;
    
    if (exportFileType === "csv") {
      // Summary Section
      const summaryLines = [
        "SALES PERFORMANCE REPORT",
        `Period: ${modalPeriod === 'all' ? 'All Time' : modalPeriod === 'monthly' ? 'Last 30 Days' : modalPeriod === 'weekly' ? 'Last 7 Days' : 'Today'}`,
        `Generated: ${new Date().toLocaleString()}`,
        "",
        "SUMMARY METRICS",
        `Net Sales,₱${summary.netSales.toLocaleString()}`,
        `Gross Sales,₱${summary.grossSales.toLocaleString()}`,
        `Returns Amount,₱${summary.returnsAmount.toLocaleString()}`,
        `Return Rate,${summary.returnRate.toFixed(1)}%`,
        `Sales Transactions,${summary.salesTransactions}`,
        `Return Transactions,${summary.returnTransactions}`,
        `Avg Order Value,₱${summary.avgOrderValue.toFixed(2)}`,
        `Sales Growth,${summary.salesGrowth >= 0 ? '+' : ''}${summary.salesGrowth.toFixed(1)}%`,
        "",
        "PERIOD BREAKDOWN",
        "Period,Sales (₱),Transactions,Avg Order Value (₱)"
      ];
      const dataLines = chartData.map((r: any) => 
        `${r.label},${r.sales},${r.transactions},${r.avgOrder.toFixed(2)}`
      );
      const csv = [...summaryLines, ...dataLines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-performance-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFileType === "xlsx") {
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['SALES PERFORMANCE REPORT'],
        ['Period', modalPeriod === 'all' ? 'All Time' : modalPeriod === 'monthly' ? 'Last 30 Days' : modalPeriod === 'weekly' ? 'Last 7 Days' : 'Today'],
        ['Generated', new Date().toLocaleString()],
        [],
        ['FINANCIAL METRICS'],
        ['Net Sales', summary.netSales],
        ['Gross Sales', summary.grossSales],
        ['Returns Amount', summary.returnsAmount],
        ['Return Rate (%)', summary.returnRate],
        [],
        ['TRANSACTION METRICS'],
        ['Sales Transactions', summary.salesTransactions],
        ['Return Transactions', summary.returnTransactions],
        ['Total Transactions', summary.totalTransactions],
        ['Avg Order Value', summary.avgOrderValue],
        [],
        ['PERFORMANCE METRICS'],
        ['Sales Success Rate (%)', summary.salesSuccessRate],
        ['Sales Per Day', summary.salesPerDay],
        ['Revenue Per Day', summary.revenuePerDay],
        ['Sales Growth (%)', summary.salesGrowth],
        ['Transaction Growth (%)', summary.transactionsGrowth],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Period Breakdown Sheet
      const periodSheet = XLSX.utils.json_to_sheet(chartData.map((r: any) => ({
        'Period': r.label,
        'Sales (₱)': r.sales,
        'Transactions': r.transactions,
        'Avg Order Value (₱)': r.avgOrder.toFixed(2)
      })));
      periodSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, periodSheet, 'Period Breakdown');
      
      XLSX.writeFile(workbook, `sales-performance-${timestamp}.xlsx`);
    }
    setIsExportOpen(false);
  };

  return (
    <>
      <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="flex flex-col items-start gap-2 pb-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Sales Performance Report
              </h3>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Comprehensive analytics of sales performance metrics across all channels and time periods.
          </p>
          
          <div className="bg-white/50 dark:bg-gray-950/30 rounded-lg p-4 mb-3">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-2 bg-white/50 dark:bg-gray-950/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Net Sales</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">₱{summary.netSales.toLocaleString()}</p>
              <div className={`flex items-center gap-1 ${summary.salesGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <TrendingUp className={`h-3 w-3 ${summary.salesGrowth < 0 ? 'rotate-180' : ''}`} />
                <span className="text-xs font-semibold">{summary.salesGrowth >= 0 ? '+' : ''}{summary.salesGrowth}%</span>
              </div>
            </div>
            <div className="p-2 bg-white/50 dark:bg-gray-950/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Sales Transactions</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{summary.salesTransactions.toLocaleString()}</p>
              <div className={`flex items-center gap-1 ${summary.transactionsGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <TrendingUp className={`h-3 w-3 ${summary.transactionsGrowth < 0 ? 'rotate-180' : ''}`} />
                <span className="text-xs font-semibold">{summary.transactionsGrowth >= 0 ? '+' : ''}{summary.transactionsGrowth}%</span>
              </div>
            </div>
            <div className="p-2 bg-white/50 dark:bg-gray-950/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Order Value</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">₱{summary.avgOrderValue.toFixed(2)}</p>
              <div className={`flex items-center gap-1 ${summary.salesGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <TrendingUp className={`h-3 w-3 ${summary.salesGrowth < 0 ? 'rotate-180' : ''}`} />
                <span className="text-xs font-semibold">{summary.salesGrowth >= 0 ? '+' : ''}{summary.salesGrowth}%</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" color="primary" variant="flat" className="flex-1" onPress={() => setIsModalOpen(true)}>
              View Details
            </Button>
            <Button size="sm" color="default" variant="light" isIconOnly>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-center gap-3 border-b dark:border-gray-700">
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sales Performance Report</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Detailed analytics and trends</p>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <Tabs 
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              aria-label="Sales Performance Tabs"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                cursor: "w-full bg-blue-500",
                tab: "max-w-fit px-0 h-12",
                tabContent: "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400"
              }}
            >
              <Tab 
                key="overview" 
                title={
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Overview</span>
                  </div>
                }
              >
                <div className="space-y-6 pt-4">
                  {/* Period Filter */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter by:</span>
                      <Select
                        selectedKeys={[modalPeriod]}
                        onSelectionChange={(keys) => {
                          const [k] = Array.from(keys) as string[];
                          setModalPeriod(k);
                        }}
                        size="sm"
                        className="w-32"
                      >
                        <SelectItem key="daily">Daily</SelectItem>
                        <SelectItem key="weekly">Weekly</SelectItem>
                        <SelectItem key="monthly">Monthly</SelectItem>
                        <SelectItem key="all">All Time</SelectItem>
                      </Select>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {modalPeriod === "daily" && "Today's sales"}
                      {modalPeriod === "weekly" && "Last 7 days"}
                      {modalPeriod === "monthly" && "Last 30 days"}
                      {modalPeriod === "all" && "All time sales"}
                    </div>
                  </div>

              {/* Summary Cards Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-6 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Transactions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{modalSummary.totalTransactions?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All sales and returns</p>
                </div>
                
                <div className="p-6 bg-green-50 dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">₱{modalSummary.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unit price × quantity sold</p>
                </div>
                
                <div className="p-6 bg-orange-50 dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Cost of Goods Sold</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">₱{modalSummary.totalCOGS?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Original price × quantity sold</p>
                </div>
                
                <div className="p-6 bg-purple-50 dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Gross Profit</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">₱{modalSummary.grossProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Revenue - Total COGS</p>
                </div>
                
                <div className="p-6 bg-teal-50 dark:bg-gray-800 rounded-lg border border-teal-200 dark:border-teal-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Quantity Sold</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{modalSummary.totalQuantitySold?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total units sold</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Sales Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={extendedSalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis 
                        dataKey="label" 
                        stroke="#6b7280" 
                        style={{ fontSize: '14px' }}
                        angle={granularity === 'weekly' ? -45 : 0}
                        textAnchor={granularity === 'weekly' ? 'end' : 'middle'}
                        height={granularity === 'weekly' ? 80 : 30}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        style={{ fontSize: '14px' }} 
                        tickFormatter={(value) => {
                          if (value >= 1000) {
                            return `₱${(value / 1000).toFixed(0)}k`;
                          } else {
                            return `₱${value.toFixed(0)}`;
                          }
                        }}
                        label={{ value: 'Sales Amount', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Net Sales']}
                        labelFormatter={(label) => `Period: ${label}`}
                      />
                      <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Transaction Volume</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={extendedSalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '14px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: any) => [value, 'Transactions']}
                      />
                      <Bar dataKey="transactions" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
                </div>
              </Tab>

              <Tab 
                key="detailed-sales" 
                title={
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Detailed Sales</span>
                  </div>
                }
              >
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <Input
                        type="datetime-local"
                        label="From (Optional)"
                        labelPlacement="outside"
                        placeholder="Click to select start date"
                        value={reportDateFrom || ""}
                        onChange={(e) => {
                          // Only set if user actually selected a value
                          const val = e.target.value;
                          setReportDateFrom(val || "");
                        }}
                        onBlur={(e) => {
                          // Clear if user didn't confirm a selection (field still appears empty)
                          if (!e.target.value) {
                            setReportDateFrom("");
                          }
                        }}
                        size="sm"
                        description="Leave empty to show all sales. Picker shows today as reference only."
                      />
                      <Input
                        type="datetime-local"
                        label="To (Optional)"
                        labelPlacement="outside"
                        placeholder="Click to select end date"
                        value={reportDateTo || ""}
                        onChange={(e) => {
                          // Only set if user actually selected a value
                          const val = e.target.value;
                          setReportDateTo(val || "");
                        }}
                        onBlur={(e) => {
                          // Clear if user didn't confirm a selection (field still appears empty)
                          if (!e.target.value) {
                            setReportDateTo("");
                          }
                        }}
                        size="sm"
                        description="Leave empty to show all sales. Picker shows today as reference only."
                      />
                    </div>
                  </div>
                  {/* Card-based Layout */}
                  <div className="space-y-4">
                    {/* Sort Controls */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                        <Button
                          size="sm"
                          variant={sortField === "dateTime" ? "flat" : "light"}
                          color={sortField === "dateTime" ? "primary" : "default"}
                          startContent={<Calendar className="h-4 w-4" />}
                          endContent={<ArrowUpDown className="h-3 w-3" />}
                          onPress={() => handleSort("dateTime")}
                        >
                          Date & Time {sortField === "dateTime" && (sortDirection === "asc" ? "↑" : "↓")}
                        </Button>
                        <Button
                          size="sm"
                          variant={sortField === "total" ? "flat" : "light"}
                          color={sortField === "total" ? "primary" : "default"}
                          startContent={<DollarSign className="h-4 w-4" />}
                          endContent={<ArrowUpDown className="h-3 w-3" />}
                          onPress={() => handleSort("total")}
                        >
                          Total Amount {sortField === "total" && (sortDirection === "asc" ? "↑" : "↓")}
                        </Button>
                        <Button
                          size="sm"
                          variant={sortField === "productName" ? "flat" : "light"}
                          color={sortField === "productName" ? "primary" : "default"}
                          startContent={<Package className="h-4 w-4" />}
                          endContent={<ArrowUpDown className="h-3 w-3" />}
                          onPress={() => handleSort("productName")}
                        >
                          Product {sortField === "productName" && (sortDirection === "asc" ? "↑" : "↓")}
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {sortedAndPaginatedSales.length} of {detailedSalesRows.length} transactions
                      </div>
                    </div>

                    {/* Loading State */}
                    {!detailedSalesData && activeTab === "detailed-sales" ? (
                      <div className="flex items-center justify-center p-12">
                        <div className="text-gray-500 dark:text-gray-400">Loading transactions...</div>
                      </div>
                    ) : sortedAndPaginatedSales.length === 0 ? (
                      <div className="flex items-center justify-center p-12">
                        <div className="text-gray-500 dark:text-gray-400">No transactions found</div>
                      </div>
                    ) : (
                      <>
                        {/* Transaction Cards */}
                        <div className="grid grid-cols-1 gap-4">
                          {sortedAndPaginatedSales.map((sale: any, index: number) => {
                            const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                            return (
                              <Card key={sale.id || index} className="border border-gray-200 dark:border-gray-700">
                                <CardBody className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    {/* Left Section - Transaction Info */}
                                    <div className="md:col-span-5 space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Chip size="sm" variant="flat" color="default">
                                              #{rowNumber}
                                            </Chip>
                                            {sale.isVoided && (
                                              <Chip size="sm" variant="flat" color="danger">
                                                Voided
                                              </Chip>
                                            )}
                                            {sale.isFullyReturned && (
                                              <Chip size="sm" variant="flat" color="warning">
                                                Returned
                                              </Chip>
                                            )}
                                            {!sale.isFullyReturned && !sale.isVoided && sale.returnedQuantity > 0 && (
                                              <Chip size="sm" variant="flat" color="warning">
                                                Partial Return
                                              </Chip>
                                            )}
                                          </div>
                                          <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                              <Calendar className="h-4 w-4 text-gray-400" />
                                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {new Date(sale.dateTime).toLocaleString()}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Hash className="h-4 w-4 text-gray-400" />
                                              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                                {sale.transactionNo}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Middle Section - Product Info */}
                                    <div className="md:col-span-4 space-y-3">
                                      <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                          <Package className="h-4 w-4 text-gray-400" />
                                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {sale.productName}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono ml-6">
                                          Barcode: {sale.barcode}
                                        </div>
                                        <div className="flex items-center gap-4 ml-6">
                                          <div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Quantity: </span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                              {sale.quantity}
                                            </span>
                                            {sale.returnedQuantity > 0 && (
                                              <span className="text-xs text-orange-600 dark:text-orange-400 ml-2">
                                                ({sale.returnedQuantity} returned, {sale.remainingQuantity} remaining)
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right Section - Pricing & Actions */}
                                    <div className="md:col-span-3 space-y-3">
                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500 dark:text-gray-400">Unit Price:</span>
                                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            ₱{sale.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total:</span>
                                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            ₱{sale.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="pt-2">
                                        <Button
                                          size="sm"
                                          color="warning"
                                          variant="flat"
                                          startContent={<RotateCcw className="h-4 w-4" />}
                                          onPress={() => handleReturnClick(sale)}
                                          isDisabled={sale.isFullyReturned || sale.isVoided}
                                          className="w-full"
                                        >
                                          {sale.isVoided ? "Voided" : sale.isFullyReturned ? "Returned" : "Return Item"}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            );
                          })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex justify-center pt-4">
                            <Pagination
                              total={totalPages}
                              page={currentPage}
                              onChange={setCurrentPage}
                              showControls
                              showShadow
                              color="primary"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Tab>

              <Tab 
                key="profit-margin" 
                title={
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Profit Margin</span>
                  </div>
                }
              >
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <Input
                        type="datetime-local"
                        label="From"
                        labelPlacement="outside"
                        value={reportDateFrom}
                        onChange={(e) => setReportDateFrom(e.target.value)}
                        size="sm"
                      />
                      <Input
                        type="datetime-local"
                        label="To"
                        labelPlacement="outside"
                        value={reportDateTo}
                        onChange={(e) => setReportDateTo(e.target.value)}
                        size="sm"
                      />
                    </div>
                  </div>
                  {/* Card-based Layout */}
                  <div className="space-y-4">
                    {/* Sort Controls */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                        <Button
                          size="sm"
                          variant={profitSortField === "totalProfit" ? "flat" : "light"}
                          color={profitSortField === "totalProfit" ? "primary" : "default"}
                          startContent={<DollarSign className="h-4 w-4" />}
                          endContent={<ArrowUpDown className="h-3 w-3" />}
                          onPress={() => handleProfitSort("totalProfit")}
                        >
                          Total Profit {profitSortField === "totalProfit" && (profitSortDirection === "asc" ? "↑" : "↓")}
                        </Button>
                        <Button
                          size="sm"
                          variant={profitSortField === "profitMargin" ? "flat" : "light"}
                          color={profitSortField === "profitMargin" ? "primary" : "default"}
                          startContent={<Percent className="h-4 w-4" />}
                          endContent={<ArrowUpDown className="h-3 w-3" />}
                          onPress={() => handleProfitSort("profitMargin")}
                        >
                          Profit Margin {profitSortField === "profitMargin" && (profitSortDirection === "asc" ? "↑" : "↓")}
                        </Button>
                        <Button
                          size="sm"
                          variant={profitSortField === "productName" ? "flat" : "light"}
                          color={profitSortField === "productName" ? "primary" : "default"}
                          startContent={<Package className="h-4 w-4" />}
                          endContent={<ArrowUpDown className="h-3 w-3" />}
                          onPress={() => handleProfitSort("productName")}
                        >
                          Product {profitSortField === "productName" && (profitSortDirection === "asc" ? "↑" : "↓")}
                        </Button>
                        <Button
                          size="sm"
                          variant={profitSortField === "qtySold" ? "flat" : "light"}
                          color={profitSortField === "qtySold" ? "primary" : "default"}
                          startContent={<TrendingUp className="h-4 w-4" />}
                          endContent={<ArrowUpDown className="h-3 w-3" />}
                          onPress={() => handleProfitSort("qtySold")}
                        >
                          Qty Sold {profitSortField === "qtySold" && (profitSortDirection === "asc" ? "↑" : "↓")}
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {sortedAndPaginatedProfit.length} of {profitMarginRows.length} products
                      </div>
                    </div>

                    {/* Loading State */}
                    {!profitMarginData && activeTab === "profit-margin" ? (
                      <div className="flex items-center justify-center p-12">
                        <div className="text-gray-500 dark:text-gray-400">Loading profit margin data...</div>
                      </div>
                    ) : sortedAndPaginatedProfit.length === 0 ? (
                      <div className="flex items-center justify-center p-12">
                        <div className="text-gray-500 dark:text-gray-400">No profit margin data found</div>
                      </div>
                    ) : (
                      <>
                        {/* Profit Margin Cards */}
                        <div className="grid grid-cols-1 gap-4">
                          {sortedAndPaginatedProfit.map((product: any, index: number) => {
                            const rowNumber = (profitCurrentPage - 1) * itemsPerPage + index + 1;
                            const profitMarginColor = product.profitMargin >= 50 ? "success" : product.profitMargin >= 30 ? "warning" : "danger";
                            return (
                              <Card key={product.productName || index} className="border border-gray-200 dark:border-gray-700">
                                <CardBody className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    {/* Left Section - Product Info */}
                                    <div className="md:col-span-4 space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Chip size="sm" variant="flat" color="default">
                                              #{rowNumber}
                                            </Chip>
                                            <Chip size="sm" variant="flat" color={profitMarginColor}>
                                              {product.profitMargin.toFixed(2)}% Margin
                                            </Chip>
                                          </div>
                                          <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                              <Package className="h-4 w-4 text-gray-400" />
                                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {product.productName}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-4 ml-6">
                                              <div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">Qty Sold: </span>
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                  {product.qtySold}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Middle Section - Pricing Breakdown */}
                                    <div className="md:col-span-5 space-y-3">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500 dark:text-gray-400">Cost per Unit:</span>
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            ₱{product.costPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-500 dark:text-gray-400">Selling Price:</span>
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            ₱{product.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Gross Profit per Unit:</span>
                                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                            ₱{product.grossProfitPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right Section - Total Profit */}
                                    <div className="md:col-span-3 space-y-3">
                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between pt-2">
                                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Profit:</span>
                                          <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                            ₱{product.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                        <div className="pt-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Profit Margin:</span>
                                            <Chip 
                                              size="sm" 
                                              variant="flat" 
                                              color={profitMarginColor}
                                              className="font-semibold"
                                            >
                                              {product.profitMargin.toFixed(2)}%
                                            </Chip>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            );
                          })}
                        </div>

                        {/* Pagination */}
                        {profitTotalPages > 1 && (
                          <div className="flex justify-center pt-4">
                            <Pagination
                              total={profitTotalPages}
                              page={profitCurrentPage}
                              onChange={setProfitCurrentPage}
                              showControls
                              showShadow
                              color="primary"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Tab>

              <Tab 
                key="void-items" 
                title={
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4" />
                    <span>Void Items</span>
                  </div>
                }
              >
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <Input
                        type="datetime-local"
                        label="From"
                        labelPlacement="outside"
                        value={reportDateFrom}
                        onChange={(e) => setReportDateFrom(e.target.value)}
                        size="sm"
                      />
                      <Input
                        type="datetime-local"
                        label="To"
                        labelPlacement="outside"
                        value={reportDateTo}
                        onChange={(e) => setReportDateTo(e.target.value)}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <DataTable
                      columns={[
                        { key: "#", header: "#", sortable: false, renderCell: (_: any, i: number) => i },
                        { key: "date", header: "Date", sortable: true, renderCell: (r: any) => new Date(r.date).toLocaleDateString() },
                        { key: "transactionNo", header: "Transaction No.", sortable: true },
                        { key: "productName", header: "Product Name", sortable: true },
                        { key: "quantity", header: "Quantity", sortable: true },
                        { key: "voidAmount", header: "Void Amount (₱)", sortable: true, renderCell: (r: any) => `₱${r.voidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                      ] as any}
                      data={voidItemsRows}
                      label="Void Items"
                      isLoading={!voidItemsData && activeTab === "void-items"}
                    />
                  </div>
                </div>
              </Tab>

              <Tab 
                key="returned-items" 
                title={
                  <div className="flex items-center space-x-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>Returned Items</span>
                  </div>
                }
              >
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <Input
                        type="datetime-local"
                        label="From"
                        labelPlacement="outside"
                        value={reportDateFrom}
                        onChange={(e) => setReportDateFrom(e.target.value)}
                        size="sm"
                      />
                      <Input
                        type="datetime-local"
                        label="To"
                        labelPlacement="outside"
                        value={reportDateTo}
                        onChange={(e) => setReportDateTo(e.target.value)}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <DataTable
                      columns={[
                        { key: "#", header: "#", sortable: false, renderCell: (_: any, i: number) => i },
                        { key: "date", header: "Date", sortable: true, renderCell: (r: any) => new Date(r.date).toLocaleDateString() },
                        { key: "transactionNo", header: "Transaction No.", sortable: true },
                        { key: "productName", header: "Product Name", sortable: true },
                        { key: "quantity", header: "Quantity", sortable: true },
                        { key: "refundAmount", header: "Refund Amount (₱)", sortable: true, renderCell: (r: any) => `₱${r.refundAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { key: "reason", header: "Reason for Return", sortable: true, renderCell: (r: any) => r.reason || "-" },
                      ] as any}
                      data={returnedItemsRows}
                      label="Returned Items"
                      isLoading={!returnedItemsData && activeTab === "returned-items"}
                    />
                  </div>
                </div>
              </Tab>
            </Tabs>
          </ModalBody>
          <ModalFooter className="border-t dark:border-gray-700">
            <Button color="default" variant="light" onPress={() => setIsModalOpen(false)}>Close</Button>
            {activeTab === "overview" ? (
              <Button color="primary" startContent={<Download className="h-4 w-4" />} onPress={() => setIsExportOpen(true)}>Export Report</Button>
            ) : (
              <Button color="primary" startContent={<Download className="h-4 w-4" />} onPress={exportCurrentTab}>
                Export {activeTab === "detailed-sales" ? "Detailed Sales" : activeTab === "profit-margin" ? "Profit Margin" : activeTab === "void-items" ? "Void Items" : "Returned Items"}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Return Modal */}
      <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} size="2xl">
        <ModalContent>
          <ModalHeader className="flex items-center gap-3 border-b dark:border-gray-700">
            <div className="p-2 rounded-lg bg-orange-500/10 dark:bg-orange-500/20">
              <RotateCcw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Process Return</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Return item from sale</p>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            {selectedSale && (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Original Sale Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Product:</span>
                      <span className="ml-2 font-medium">{selectedSale.productName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Transaction No:</span>
                      <span className="ml-2 font-medium">{selectedSale.transactionNo}</span>
                    </div>
                    {selectedSale.isVoided && (
                      <div className="col-span-2">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className="ml-2 font-medium text-red-600 dark:text-red-400">Voided</span>
                        {selectedSale.voidedDate && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            (Voided on {new Date(selectedSale.voidedDate).toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Original Quantity:</span>
                      <span className="ml-2 font-medium">{selectedSale.quantity}</span>
                    </div>
                    {selectedSale.returnedQuantity > 0 && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Already Returned:</span>
                        <span className="ml-2 font-medium text-orange-600 dark:text-orange-400">{selectedSale.returnedQuantity}</span>
                      </div>
                    )}
                    {!selectedSale.isVoided && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Remaining Quantity:</span>
                        <span className="ml-2 font-medium text-green-600 dark:text-green-400">{selectedSale.remainingQuantity || selectedSale.quantity}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Unit Price:</span>
                      <span className="ml-2 font-medium">₱{selectedSale.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Sale Date:</span>
                      <span className="ml-2 font-medium">{new Date(selectedSale.dateTime).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!selectedSale.isVoided && (
                  <div className="space-y-4">
                    <Input
                      type="number"
                      label="Return Quantity"
                      labelPlacement="outside"
                      value={returnQuantity.toString()}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const maxReturnable = selectedSale.remainingQuantity || selectedSale.quantity;
                        setReturnQuantity(Math.max(1, Math.min(val, maxReturnable)));
                      }}
                      min={1}
                      max={selectedSale.remainingQuantity || selectedSale.quantity}
                      description={`Maximum: ${selectedSale.remainingQuantity || selectedSale.quantity} units available to return`}
                      size="lg"
                    />

                  <Textarea
                    label="Reason for Return (Optional)"
                    labelPlacement="outside"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Enter reason for return..."
                    minRows={3}
                    size="lg"
                  />

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Refund Amount:</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ₱{(returnQuantity * selectedSale.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter className="border-t dark:border-gray-700">
            <Button 
              color="default" 
              variant="light" 
              onPress={() => {
                setIsReturnModalOpen(false);
                setSelectedSale(null);
                setReturnQuantity(1);
                setReturnReason("");
              }}
              isDisabled={isProcessingReturn}
            >
              Cancel
            </Button>
            <Button 
              color="warning" 
              startContent={<RotateCcw className="h-4 w-4" />}
              onPress={handleProcessReturn}
              isLoading={isProcessingReturn}
              isDisabled={selectedSale?.isVoided}
            >
              Process Return
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Export Modal */}
      <Modal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} size="md">
        <ModalContent>
          <ModalHeader>Export Sales Performance Report</ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Select File Format</p>
                <Select 
                  selectedKeys={[exportFileType]}
                  onSelectionChange={(keys) => {
                    const [k] = Array.from(keys) as string[];
                    setExportFileType(k);
                  }}
                  label="File type"
                  labelPlacement="outside"
                  size="lg"
                >
                  <SelectItem key="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem key="csv">CSV (Comma-separated)</SelectItem>
                </Select>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Export includes:</strong> {modalPeriod === 'all' ? 'All time' : modalPeriod === 'monthly' ? 'Last 30 days' : modalPeriod === 'weekly' ? 'Last 7 days' : 'Today'} sales data with period sales, transactions, and average order values.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsExportOpen(false)}>Cancel</Button>
            <Button color="primary" startContent={<Download className="h-4 w-4" />} onPress={exportCurrentTab}>Export</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

