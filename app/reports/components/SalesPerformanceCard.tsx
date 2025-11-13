"use client";

import { Card, CardHeader, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem, Tabs, Tab, Input } from "@heroui/react";
import { BarChart3, TrendingUp, Download, FileText, RotateCcw } from "lucide-react";
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

  // Auto-determine granularity based on period
  const getGranularity = (period: string): "daily" | "weekly" | "monthly" => {
    if (period === "all") return "monthly";
    if (period === "daily" || period === "weekly") return "daily";
    if (period === "monthly") return "daily";
    return "daily";
  };

  const granularity = getGranularity(modalPeriod);

  // Fetch data for card preview (7 days)
  const { data: cardData, error: cardError } = useSWR(`/api/reports/sales-performance?period=${period}&granularity=daily`, fetcher);
  
  // Fetch data for modal
  const { data: modalData, error: modalError } = useSWR(
    isModalOpen ? `/api/reports/sales-performance?period=${modalPeriod}&granularity=${granularity}` : null,
    fetcher
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

  const { data: detailedSalesData } = useSWR(
    isModalOpen && activeTab === "detailed-sales" ? detailedSalesQuery : null,
    fetcher
  );
  const { data: profitMarginData } = useSWR(
    isModalOpen && activeTab === "profit-margin" ? profitMarginQuery : null,
    fetcher
  );
  const { data: returnedItemsData } = useSWR(
    isModalOpen && activeTab === "returned-items" ? returnedItemsQuery : null,
    fetcher
  );

  const detailedSalesRows = detailedSalesData?.rows || [];
  const profitMarginRows = profitMarginData?.rows || [];
  const returnedItemsRows = returnedItemsData?.rows || [];

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
        'Handled By': r.handledBy || '-',
      }));
      const sheet = XLSX.utils.json_to_sheet(sheetData);
      sheet['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, sheet, 'Returned Items');
      XLSX.writeFile(workbook, `returned-items-${timestamp}.xlsx`);
      setIsExportOpen(false);
      return;
    }

    // For overview tab, open export modal instead
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
                        { key: "#", header: "#", sortable: false, renderCell: (_: any, i: number) => i + 1 },
                        { key: "dateTime", header: "Date & Time", sortable: true, renderCell: (r: any) => new Date(r.dateTime).toLocaleString() },
                        { key: "transactionNo", header: "Transaction No.", sortable: true },
                        { key: "productName", header: "Product Name", sortable: true },
                        { key: "barcode", header: "Barcode", sortable: true },
                        { key: "quantity", header: "Quantity", sortable: true },
                        { key: "unitPrice", header: "Unit Price (₱)", sortable: true, renderCell: (r: any) => `₱${r.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { key: "total", header: "Total (₱)", sortable: true, renderCell: (r: any) => `₱${r.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                      ] as any}
                      data={detailedSalesRows}
                      label="Sales Transactions"
                      isLoading={!detailedSalesData && activeTab === "detailed-sales"}
                    />
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
                  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <DataTable
                      columns={[
                        { key: "#", header: "#", sortable: false, renderCell: (_: any, i: number) => i + 1 },
                        { key: "productName", header: "Product Name", sortable: true },
                        { key: "costPerUnit", header: "Cost per Unit (₱)", sortable: true, renderCell: (r: any) => `₱${r.costPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { key: "sellingPrice", header: "Selling Price (₱)", sortable: true, renderCell: (r: any) => `₱${r.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { key: "grossProfitPerUnit", header: "Gross Profit per Unit (₱)", sortable: true, renderCell: (r: any) => `₱${r.grossProfitPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { key: "qtySold", header: "Qty Sold", sortable: true },
                        { key: "totalProfit", header: "Total Profit (₱)", sortable: true, renderCell: (r: any) => `₱${r.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { key: "profitMargin", header: "Profit Margin (%)", sortable: true, renderCell: (r: any) => `${r.profitMargin.toFixed(2)}%` },
                      ] as any}
                      data={profitMarginRows}
                      label="Profit Margin"
                      isLoading={!profitMarginData && activeTab === "profit-margin"}
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
                        { key: "#", header: "#", sortable: false, renderCell: (_: any, i: number) => i + 1 },
                        { key: "date", header: "Date", sortable: true, renderCell: (r: any) => new Date(r.date).toLocaleDateString() },
                        { key: "transactionNo", header: "Transaction No.", sortable: true },
                        { key: "productName", header: "Product Name", sortable: true },
                        { key: "quantity", header: "Quantity", sortable: true },
                        { key: "refundAmount", header: "Refund Amount (₱)", sortable: true, renderCell: (r: any) => `₱${r.refundAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { key: "reason", header: "Reason for Return", sortable: true, renderCell: (r: any) => r.reason || "-" },
                        { key: "handledBy", header: "Handled By", sortable: true, renderCell: (r: any) => r.handledBy || "-" },
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
                Export {activeTab === "detailed-sales" ? "Detailed Sales" : activeTab === "profit-margin" ? "Profit Margin" : "Returned Items"}
              </Button>
            )}
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

