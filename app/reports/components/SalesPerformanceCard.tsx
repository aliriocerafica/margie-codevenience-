"use client";

import { Card, CardHeader, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@heroui/react";
import { BarChart3, TrendingUp, Download } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { useState, useEffect } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SalesPerformanceCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFileType, setExportFileType] = useState<string>("xlsx");
  const [period, setPeriod] = useState<string>("7days");
  const [modalPeriod, setModalPeriod] = useState<string>("6months");

  // Fetch data for card preview (7 days)
  const { data: cardData, error: cardError } = useSWR(`/api/reports/sales-performance?period=${period}`, fetcher);
  
  // Fetch data for modal (6 months)
  const { data: modalData, error: modalError } = useSWR(
    isModalOpen ? `/api/reports/sales-performance?period=${modalPeriod}` : null,
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
  };

  const exportSalesPerformance = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const chartData = modalData?.chartData || [];
    const summary = modalSummary;
    
    if (exportFileType === "csv") {
      // Summary Section
      const summaryLines = [
        "SALES PERFORMANCE REPORT",
        `Period: ${modalPeriod === '6months' ? '6 Months' : '30 Days'}`,
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
        ['Period', modalPeriod === '6months' ? '6 Months' : '30 Days'],
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
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Net Sales ({modalPeriod === '6months' ? '6 months' : '30 days'})</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">₱{modalSummary.netSales.toLocaleString()}</p>
                  <div className={`flex items-center gap-1 mt-1 ${modalSummary.salesGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <TrendingUp className={`h-4 w-4 ${modalSummary.salesGrowth < 0 ? 'rotate-180' : ''}`} />
                    <span className="text-sm font-semibold">{modalSummary.salesGrowth >= 0 ? '+' : ''}{modalSummary.salesGrowth}% from last period</span>
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sales Transactions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{modalSummary.salesTransactions.toLocaleString()}</p>
                  <div className="text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                    <span className="text-sm font-semibold">Completed sales</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gross Sales</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₱{modalSummary.grossSales.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Returns</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">₱{modalSummary.returnsAmount.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Return Rate</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{modalSummary.returnRate.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₱{modalSummary.avgOrderValue.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Net Units Sold</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{modalSummary.netUnitsSold.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Units Returned</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{modalSummary.unitsReturned.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sales Success Rate</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{modalSummary.salesSuccessRate.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Peak Sales</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₱{modalSummary.peakSalesAmount.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sales per Day</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{modalSummary.salesPerDay.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Revenue per Day</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₱{modalSummary.revenuePerDay.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Return Frequency</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{modalSummary.returnFrequency.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-teal-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Return Value</p>
                  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">₱{modalSummary.avgReturnValue.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Sales Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={extendedSalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '14px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Sales']}
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
          </ModalBody>
          <ModalFooter className="border-t dark:border-gray-700">
            <Button color="default" variant="light" onPress={() => setIsModalOpen(false)}>Close</Button>
            <Button color="primary" startContent={<Download className="h-4 w-4" />} onPress={() => setIsExportOpen(true)}>Export Report</Button>
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
                  <strong>Export includes:</strong> {modalPeriod === '6months' ? '6 months' : '30 days'} of sales data with period sales, transactions, and average order values.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsExportOpen(false)}>Cancel</Button>
            <Button color="primary" startContent={<Download className="h-4 w-4" />} onPress={exportSalesPerformance}>Export</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

