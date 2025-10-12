"use client";

import { Card, CardHeader, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@heroui/react";
import { BarChart3, TrendingUp, Download } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { useState } from "react";
import * as XLSX from 'xlsx';

const salesChartData = [
  { day: 'Mon', sales: 18500 },
  { day: 'Tue', sales: 22300 },
  { day: 'Wed', sales: 19800 },
  { day: 'Thu', sales: 25600 },
  { day: 'Fri', sales: 28900 },
  { day: 'Sat', sales: 31200 },
  { day: 'Sun', sales: 27400 },
];

const extendedSalesData = [
  { month: 'Jan', sales: 98500, transactions: 1150, avgOrder: 85.65 },
  { month: 'Feb', sales: 105200, transactions: 1230, avgOrder: 85.53 },
  { month: 'Mar', sales: 112800, transactions: 1340, avgOrder: 84.18 },
  { month: 'Apr', sales: 108900, transactions: 1280, avgOrder: 85.08 },
  { month: 'May', sales: 118600, transactions: 1410, avgOrder: 84.11 },
  { month: 'Jun', sales: 124580, transactions: 1470, avgOrder: 84.75 },
];

export default function SalesPerformanceCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFileType, setExportFileType] = useState<string>("xlsx");

  const exportSalesPerformance = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (exportFileType === "csv") {
      const header = ["Month", "Sales", "Transactions", "Avg Order Value"];
      const lines = extendedSalesData.map((r: any) => [
        r.month, r.sales, r.transactions, r.avgOrder.toFixed(2)
      ].join(","));
      const csv = [header.join(","), ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-performance-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFileType === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(extendedSalesData.map((r: any) => ({
        'Month': r.month,
        'Sales (₱)': r.sales,
        'Transactions': r.transactions,
        'Avg Order Value (₱)': r.avgOrder.toFixed(2)
      })));
      worksheet['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Performance');
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
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Sales</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">₱124,580</p>
              <div className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-semibold">+18.2%</span>
              </div>
            </div>
            <div className="p-2 bg-white/50 dark:bg-gray-950/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Transactions</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">1,247</p>
              <div className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-semibold">+12.5%</span>
              </div>
            </div>
            <div className="p-2 bg-white/50 dark:bg-gray-950/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Order</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">₱99.90</p>
              <div className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-semibold">+5.1%</span>
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
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales (6 months)</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">₱668,580</p>
                  <div className="text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">+26.5% from last period</span>
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">7,880</p>
                  <div className="text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">+18.3% from last period</span>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Order Value</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">₱84.88</p>
                  <div className="text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">+6.9% from last period</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">6-Month Sales Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={extendedSalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '14px' }} />
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
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '14px' }} />
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
                  <strong>Export includes:</strong> 6 months of sales data with monthly sales, transactions, and average order values.
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

