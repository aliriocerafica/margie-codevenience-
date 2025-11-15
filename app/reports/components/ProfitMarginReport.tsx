"use client";

import { Card, CardHeader, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input } from "@heroui/react";
import { TrendingUp, Download } from "lucide-react";
import { useState, useMemo } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';
import DataTable from "@/components/DataTable";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProfitMarginReport() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return `/api/reports/profit-margin?${params.toString()}`;
  }, [dateFrom, dateTo]);

  const { data, error, isLoading } = useSWR(
    isModalOpen ? query : null, 
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  const rows = data?.rows || [];

  const columns = [
    { key: "#", header: "#", sortable: false, renderCell: (_: any, i: number) => i + 1 },
    { key: "productName", header: "Product Name", sortable: true },
    { 
      key: "costPerUnit", 
      header: "Cost per Unit (₱)", 
      sortable: true, 
      renderCell: (r: any) => `₱${r.costPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    },
    { 
      key: "sellingPrice", 
      header: "Selling Price (₱)", 
      sortable: true, 
      renderCell: (r: any) => `₱${r.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    },
    { 
      key: "grossProfitPerUnit", 
      header: "Gross Profit per Unit (₱)", 
      sortable: true, 
      renderCell: (r: any) => `₱${r.grossProfitPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    },
    { key: "qtySold", header: "Qty Sold", sortable: true },
    { 
      key: "totalProfit", 
      header: "Total Profit (₱)", 
      sortable: true, 
      renderCell: (r: any) => `₱${r.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    },
    { 
      key: "profitMargin", 
      header: "Profit Margin (%)", 
      sortable: true, 
      renderCell: (r: any) => `${r.profitMargin.toFixed(2)}%` 
    },
  ];

  const exportData = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const workbook = XLSX.utils.book_new();
    
    const sheetData = rows.map((r: any) => ({
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
      { wch: 30 }, // Product Name
      { wch: 15 }, // Cost per Unit
      { wch: 15 }, // Selling Price
      { wch: 20 }, // Gross Profit per Unit
      { wch: 12 }, // Qty Sold
      { wch: 15 }, // Total Profit
      { wch: 15 }, // Profit Margin
    ];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Profit Margin');
    XLSX.writeFile(workbook, `profit-margin-${timestamp}.xlsx`);
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
                Profit Margin Report
              </h3>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Analyze product profitability and profit margins.
          </p>
          <Button size="sm" color="secondary" variant="flat" className="w-full" onPress={() => setIsModalOpen(true)}>
            View Report
          </Button>
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-center gap-3 border-b dark:border-gray-700">
            <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-500/20">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profit Margin Report</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Product profitability analysis</p>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="datetime-local"
                  label="From"
                  labelPlacement="outside"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  size="sm"
                />
                <Input
                  type="datetime-local"
                  label="To"
                  labelPlacement="outside"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  size="sm"
                />
              </div>
            </div>
            <DataTable
              columns={columns as any}
              data={rows}
              label="Profit Margin"
              isLoading={isLoading}
            />
          </ModalBody>
          <ModalFooter className="border-t dark:border-gray-700">
            <Button color="default" variant="light" onPress={() => setIsModalOpen(false)}>Close</Button>
            <Button color="secondary" startContent={<Download className="h-4 w-4" />} onPress={exportData}>Export</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

