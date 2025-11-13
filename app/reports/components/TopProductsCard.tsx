"use client";

import { Card, CardHeader, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@heroui/react";
import { Package, Download, TrendingUp, DollarSign, Award } from "lucide-react";
import { useState, useMemo } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TopProductsCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFileType, setExportFileType] = useState<string>("xlsx");
  const [period, setPeriod] = useState<string>("monthly");

  // Fetch data
  const { data, error, isLoading } = useSWR(`/api/reports/top-products?period=${period}&limit=10`, fetcher);

  const extendedTopProducts = data?.products || [];
  const topFiveProducts = extendedTopProducts.slice(0, 5);

  // Calculate chart data
  const barChartData = useMemo(() => {
    return extendedTopProducts.slice(0, 10).map((product: any) => ({
      name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
      sales: product.revenue,
      fullName: product.name
    }));
  }, [extendedTopProducts]);

  const pieChartData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    extendedTopProducts.forEach((product: any) => {
      const category = product.category || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + product.revenue;
    });
    const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);
    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value: Math.round((value / total) * 100 * 100) / 100,
        amount: value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [extendedTopProducts]);

  const kpiData = useMemo(() => {
    const totalSales = extendedTopProducts.reduce((sum: number, p: any) => sum + p.revenue, 0);
    const totalProfit = extendedTopProducts.reduce((sum: number, p: any) => sum + (p.totalProfit || 0), 0);
    const bestProduct = extendedTopProducts.length > 0 ? extendedTopProducts[0] : null;
    return { totalSales, totalProfit, bestProduct };
  }, [extendedTopProducts]);

  // Colors for pie chart
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

  const exportTopProducts = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const dataToExport = extendedTopProducts;
    const totalRevenue = dataToExport.reduce((sum: number, p: any) => sum + p.revenue, 0);
    const totalUnitsSold = dataToExport.reduce((sum: number, p: any) => sum + p.sold, 0);
    
    if (exportFileType === "csv") {
      const summaryLines = [
        "TOP SELLING PRODUCTS REPORT",
        `Period: ${period === 'all' ? 'All Time' : period === 'monthly' ? 'Last 30 Days' : period === 'weekly' ? 'Last 7 Days' : 'Today'}`,
        `Generated: ${new Date().toLocaleString()}`,
        "",
        "SUMMARY",
        `Total Products,${dataToExport.length}`,
        `Total Units Sold,${totalUnitsSold}`,
        `Total Revenue,₱${totalRevenue.toLocaleString()}`,
        "",
        "TOP PRODUCTS",
        "Rank,Product Name,Category,Barcode,Units Sold,Unit Price (₱),Total Sales (₱),% of Total Sales,Profit per Unit (₱),Total Profit (₱)"
      ];
      const dataLines = dataToExport.map((r: any, idx: number) => 
        `${idx + 1},${r.name.replaceAll(",", " ")},${(r.category || "Uncategorized").replaceAll(",", " ")},${r.barcode || "-"},${r.sold},${r.sellingPrice?.toFixed(2) || "0.00"},${r.revenue.toFixed(2)},${r.percentageOfTotalSales?.toFixed(2) || "0.00"}%,${r.profitPerUnit?.toFixed(2) || "0.00"},${r.totalProfit?.toFixed(2) || "0.00"}`
      );
      const csv = [...summaryLines, ...dataLines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `top-products-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFileType === "xlsx") {
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['TOP SELLING PRODUCTS REPORT'],
        ['Period', period === 'all' ? 'All Time' : period === 'monthly' ? 'Last 30 Days' : period === 'weekly' ? 'Last 7 Days' : 'Today'],
        ['Generated', new Date().toLocaleString()],
        [],
        ['SUMMARY'],
        ['Total Products', dataToExport.length],
        ['Total Units Sold', totalUnitsSold],
        ['Total Revenue (₱)', totalRevenue],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Products Sheet
      const productsSheet = XLSX.utils.json_to_sheet(dataToExport.map((r: any, idx: number) => ({
        'Rank': idx + 1,
        'Product Name': r.name,
        'Category': r.category || 'Uncategorized',
        'Barcode': r.barcode || '-',
        'Units Sold': r.sold,
        'Unit Price (₱)': r.sellingPrice || 0,
        'Total Sales (₱)': r.revenue,
        '% of Total Sales': `${r.percentageOfTotalSales?.toFixed(2) || '0.00'}%`,
        'Profit per Unit (₱)': r.profitPerUnit || 0,
        'Total Profit (₱)': r.totalProfit || 0
      })));
      productsSheet['!cols'] = [
        { wch: 8 },   // Rank
        { wch: 25 },  // Product Name
        { wch: 15 },  // Category
        { wch: 15 },  // Barcode
        { wch: 12 },  // Units Sold
        { wch: 15 },  // Unit Price
        { wch: 15 },  // Total Sales
        { wch: 15 },  // % of Total Sales
        { wch: 15 },  // Profit per Unit
        { wch: 15 }   // Total Profit
      ];
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Products');
      
      XLSX.writeFile(workbook, `top-products-${timestamp}.xlsx`);
    }
    setIsExportOpen(false);
  };

  return (
    <>
      <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="flex flex-col items-start gap-2 pb-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 dark:bg-green-500/20">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Top Selling Products
              </h3>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Track your best-performing products based on sales volume and revenue generated.
          </p>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : topFiveProducts.length === 0 ? (
            <div className="bg-white/50 dark:bg-gray-950/30 rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No sales data available yet</p>
            </div>
          ) : (
          <div className="space-y-2 bg-white/50 dark:bg-gray-950/30 rounded-lg p-4">
            {topFiveProducts.map((product: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400">#{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.sold} units sold</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">₱{product.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button size="sm" color="success" variant="flat" className="flex-1" onPress={() => setIsModalOpen(true)}>
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
            <div className="p-2 rounded-lg bg-green-500/10 dark:bg-green-500/20">
              <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Top Selling Products</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Complete product performance breakdown</p>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-6">
              {/* Period Filter */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter by:</span>
                  <Select
                    selectedKeys={[period]}
                    onSelectionChange={(keys) => {
                      const [k] = Array.from(keys) as string[];
                      setPeriod(k);
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
                  {period === "daily" && "Today's sales"}
                  {period === "weekly" && "Last 7 days"}
                  {period === "monthly" && "Last 30 days"}
                  {period === "all" && "All time sales"}
                </div>
              </div>

              {/* KPI Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                      <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Sales</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₱{kpiData.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-green-500/10 dark:bg-green-500/20">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Profit</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₱{kpiData.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-500/20">
                      <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Best Product</h3>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{kpiData.bestProduct?.name || "N/A"}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{kpiData.bestProduct?.sold || 0} units sold</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart - Top 10 Products by Total Sales */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top 10 Products by Total Sales</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#6b7280" 
                          style={{ fontSize: '12px' }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis 
                          stroke="#6b7280" 
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => {
                            if (value >= 1000) {
                              return `₱${(value / 1000).toFixed(0)}k`;
                            } else {
                              return `₱${value.toFixed(0)}`;
                            }
                          }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                          formatter={(value: any, name: string, props: any) => [
                            `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                            'Total Sales'
                          ]}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                        />
                        <Bar dataKey="sales" fill="#10b981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart - % Contribution of Top Categories */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">% Contribution of Top Categories</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                          wrapperStyle={{ color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#fff' }}
                          formatter={(value: any, name: string, props: any) => [
                            `${value}% (₱${props.payload.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
                            'Contribution'
                          ]}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value) => value}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Line Chart - Daily Sales Trend of Top-Selling Items */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Daily Sales Trend of Top-Selling Items</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={barChartData.map((item: any, idx: number) => ({ 
                      name: item.name, 
                      sales: item.sales,
                      rank: idx + 1
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6b7280" 
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => {
                          if (value >= 1000) {
                            return `₱${(value / 1000).toFixed(0)}k`;
                          } else {
                            return `₱${value.toFixed(0)}`;
                          }
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: any) => [
                          `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                          'Sales'
                        ]}
                      />
                      <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {extendedTopProducts.slice(0, 3).map((product: any, idx: number) => (
                  <div key={idx} className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white font-bold">#{idx + 1}</span>
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-semibold">{product.trend}</span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{product.name}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">₱{product.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.sold} units sold</p>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Product Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Barcode</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Units Sold</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Total Sales</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">% of Total Sales</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Profit per Unit</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Total Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {extendedTopProducts.map((product: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">#{idx + 1}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">{product.category || "Uncategorized"}</td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">{product.barcode || "-"}</td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-gray-100">{product.sold}</td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-gray-100">₱{product.sellingPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</td>
                        <td className="px-4 py-4 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">₱{product.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-gray-100">{product.percentageOfTotalSales?.toFixed(2) || "0.00"}%</td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-gray-100">₱{product.profitPerUnit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</td>
                        <td className="px-4 py-4 text-sm text-right font-semibold text-green-600 dark:text-green-400">₱{product.totalProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t dark:border-gray-700">
            <Button color="default" variant="light" onPress={() => setIsModalOpen(false)}>Close</Button>
            <Button color="success" startContent={<Download className="h-4 w-4" />} onPress={() => setIsExportOpen(true)}>Export Products</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Export Modal */}
      <Modal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} size="md">
        <ModalContent>
          <ModalHeader>Export Top Selling Products</ModalHeader>
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
              <div className="p-3 bg-green-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Export includes:</strong> Top {extendedTopProducts.length} products with rankings, units sold, revenue, and growth trends.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsExportOpen(false)}>Cancel</Button>
            <Button color="success" startContent={<Download className="h-4 w-4" />} onPress={exportTopProducts}>Export</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

