"use client";

import { Card, CardHeader, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@heroui/react";
import { TrendingUp, Download } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useState } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RevenueTrendsCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFileType, setExportFileType] = useState<string>("xlsx");
  const [period, setPeriod] = useState<string>("6weeks");

  // Fetch data
  const { data, error, isLoading } = useSWR(
    `/api/reports/revenue-trends?period=${period}`, 
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const extendedRevenueData = data?.chartData || [];
  const summary = data?.summary || {
    totalRevenue: 0,
    avgRevenue: 0,
    peakRevenue: 0,
    peakPeriod: '',
    overallGrowth: 0,
  };

  const exportRevenueTrends = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const dataToExport = extendedRevenueData;
    
    if (exportFileType === "csv") {
      const summaryLines = [
        "REVENUE TRENDS REPORT",
        `Period: ${period === '6months' ? '6 Months' : '6 Weeks'}`,
        `Generated: ${new Date().toLocaleString()}`,
        "",
        "SUMMARY",
        `Total Revenue,₱${summary.totalRevenue.toLocaleString()}`,
        `Average Revenue,₱${summary.avgRevenue.toLocaleString()}`,
        `Peak Revenue,₱${summary.peakRevenue.toLocaleString()}`,
        `Peak Period,${summary.peakPeriod}`,
        `Overall Growth,${summary.overallGrowth >= 0 ? '+' : ''}${summary.overallGrowth}%`,
        "",
        "PERIOD BREAKDOWN",
        "Period,Revenue (₱),Growth (%)"
      ];
      const dataLines = dataToExport.map((r: any) => 
        `${r.period},${r.revenue},${r.growth >= 0 ? '+' : ''}${r.growth}`
      );
      const csv = [...summaryLines, ...dataLines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `revenue-trends-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFileType === "xlsx") {
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['REVENUE TRENDS REPORT'],
        ['Period', period === '6months' ? '6 Months' : '6 Weeks'],
        ['Generated', new Date().toLocaleString()],
        [],
        ['SUMMARY'],
        ['Total Revenue (₱)', summary.totalRevenue],
        ['Average Revenue (₱)', summary.avgRevenue],
        ['Peak Revenue (₱)', summary.peakRevenue],
        ['Peak Period', summary.peakPeriod],
        ['Overall Growth (%)', summary.overallGrowth],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Trends Sheet
      const trendsSheet = XLSX.utils.json_to_sheet(dataToExport.map((r: any) => ({
        'Period': r.period,
        'Revenue (₱)': r.revenue,
        'Growth (%)': `${r.growth >= 0 ? '+' : ''}${r.growth}%`
      })));
      trendsSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Revenue Trends');
      
      XLSX.writeFile(workbook, `revenue-trends-${timestamp}.xlsx`);
    }
    setIsExportOpen(false);
  };

  return (
    <>
      <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="flex flex-col items-start gap-2 pb-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-500/20">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Revenue Trends
              </h3>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Monitor revenue patterns and identify growth opportunities across different time periods.
          </p>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : extendedRevenueData.length === 0 ? (
            <div className="bg-white/50 dark:bg-gray-950/30 rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No revenue data available yet</p>
            </div>
          ) : (
          <>
          <div className="space-y-3 bg-white/50 dark:bg-gray-950/30 rounded-lg p-4">
            {extendedRevenueData.map((trend: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{trend.period}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">₱{trend.revenue.toLocaleString()}</p>
                </div>
                <div className={`flex items-center gap-1 ${trend.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {trend.growth >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingUp className="h-4 w-4 rotate-180" />
                  )}
                  <span className="text-sm font-semibold">{trend.growth >= 0 ? '+' : ''}{trend.growth}%</span>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
          <div className="mt-4 flex gap-2">
            <Button size="sm" color="secondary" variant="flat" className="flex-1" onPress={() => setIsModalOpen(true)}>
              View Details
            </Button>
            <Button size="sm" color="default" variant="light" isIconOnly>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="4xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-center gap-3 border-b dark:border-gray-700">
            <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-500/20">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Revenue Trends</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Weekly revenue patterns and growth analysis</p>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average {period === '6months' ? 'Monthly' : 'Weekly'} Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">₱{summary.avgRevenue.toLocaleString()}</p>
                  <div className={`flex items-center gap-1 mt-1 ${summary.overallGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <TrendingUp className={`h-4 w-4 ${summary.overallGrowth < 0 ? 'rotate-180' : ''}`} />
                    <span className="text-sm font-semibold">{summary.overallGrowth >= 0 ? '+' : ''}{summary.overallGrowth}% overall growth</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Peak Period Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">₱{summary.peakRevenue.toLocaleString()}</p>
                  <div className="text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1">
                    <span className="text-sm font-semibold">{summary.peakPeriod || 'N/A'} performance</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{period === '6months' ? 'Monthly' : 'Weekly'} Revenue Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={extendedRevenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="period" stroke="#6b7280" style={{ fontSize: '14px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Growth Rate by {period === '6months' ? 'Month' : 'Week'}</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={extendedRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="period" stroke="#6b7280" style={{ fontSize: '14px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} tickFormatter={(value) => `${value}%`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: any) => [`${value}%`, 'Growth']}
                      />
                      <Bar dataKey="growth" fill="#a855f7" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t dark:border-gray-700">
            <Button color="default" variant="light" onPress={() => setIsModalOpen(false)}>Close</Button>
            <Button color="secondary" startContent={<Download className="h-4 w-4" />} onPress={() => setIsExportOpen(true)}>Export Trends</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Export Modal */}
      <Modal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} size="md">
        <ModalContent>
          <ModalHeader>Export Revenue Trends</ModalHeader>
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
              <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Export includes:</strong> {period === '6months' ? '6 months' : '6 weeks'} of revenue data with period totals and growth percentages.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsExportOpen(false)}>Cancel</Button>
            <Button color="secondary" startContent={<Download className="h-4 w-4" />} onPress={exportRevenueTrends}>Export</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

