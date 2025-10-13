"use client";

import { Card, CardHeader, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@heroui/react";
import { Package, Download } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TopProductsCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFileType, setExportFileType] = useState<string>("xlsx");
  const [period, setPeriod] = useState<string>("all");

  // Fetch data
  const { data, error, isLoading } = useSWR(`/api/reports/top-products?period=${period}&limit=10`, fetcher);

  const extendedTopProducts = data?.products || [];
  const topFiveProducts = extendedTopProducts.slice(0, 5);

  const exportTopProducts = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const dataToExport = extendedTopProducts;
    const totalRevenue = dataToExport.reduce((sum: number, p: any) => sum + p.revenue, 0);
    const totalUnitsSold = dataToExport.reduce((sum: number, p: any) => sum + p.sold, 0);
    
    if (exportFileType === "csv") {
      const summaryLines = [
        "TOP SELLING PRODUCTS REPORT",
        `Period: ${period === 'all' ? 'All Time' : period === '30days' ? '30 Days' : '7 Days'}`,
        `Generated: ${new Date().toLocaleString()}`,
        "",
        "SUMMARY",
        `Total Products,${dataToExport.length}`,
        `Total Units Sold,${totalUnitsSold}`,
        `Total Revenue,₱${totalRevenue.toLocaleString()}`,
        "",
        "TOP PRODUCTS",
        "Rank,Product,Units Sold,Revenue (₱),Avg Price (₱),Trend (%)"
      ];
      const dataLines = dataToExport.map((r: any, idx: number) => 
        `${idx + 1},${r.name.replaceAll(",", " ")},${r.sold},${r.revenue},${(r.revenue / r.sold).toFixed(2)},${r.trend >= 0 ? '+' : ''}${r.trend}`
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
        ['Period', period === 'all' ? 'All Time' : period === '30days' ? '30 Days' : '7 Days'],
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
        'Product': r.name,
        'Units Sold': r.sold,
        'Revenue (₱)': r.revenue,
        'Avg Price (₱)': (r.revenue / r.sold).toFixed(2),
        'Revenue %': `${((r.revenue / totalRevenue) * 100).toFixed(1)}%`,
        'Trend (%)': `${r.trend >= 0 ? '+' : ''}${r.trend}%`
      })));
      productsSheet['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }];
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="4xl" scrollBehavior="inside">
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

              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Product</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Units Sold</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {extendedTopProducts.map((product: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">#{idx + 1}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-gray-100">{product.sold}</td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">₱{product.revenue.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className={`font-semibold ${product.trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {product.trend}
                          </span>
                        </td>
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

