"use client";

import { Card, CardHeader, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input } from "@heroui/react";
import { FileText, Download } from "lucide-react";
import { useState, useMemo } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';
import DataTable from "@/components/DataTable";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DetailedSalesReport() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return `/api/reports/detailed-sales?${params.toString()}`;
  }, [dateFrom, dateTo]);

  const { data, error, isLoading } = useSWR(isModalOpen ? query : null, fetcher);
  const rows = data?.rows || [];

  const columns = [
    { key: "#", header: "#", sortable: false, renderCell: (_: any, i: number) => i + 1 },
    { 
      key: "dateTime", 
      header: "Date & Time", 
      sortable: true, 
      renderCell: (r: any) => new Date(r.dateTime).toLocaleString() 
    },
    { key: "transactionNo", header: "Transaction No.", sortable: true },
    { key: "productName", header: "Product Name", sortable: true },
    { key: "barcode", header: "Barcode", sortable: true },
    { key: "quantity", header: "Quantity", sortable: true },
    { 
      key: "unitPrice", 
      header: "Unit Price (₱)", 
      sortable: true, 
      renderCell: (r: any) => `₱${r.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    },
    { 
      key: "total", 
      header: "Total (₱)", 
      sortable: true, 
      renderCell: (r: any) => `₱${r.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    },
  ];

  const exportData = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const workbook = XLSX.utils.book_new();
    
    const sheetData = rows.map((r: any) => ({
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
      { wch: 20 }, // Date & Time
      { wch: 20 }, // Transaction No.
      { wch: 30 }, // Product Name
      { wch: 15 }, // Barcode
      { wch: 10 }, // Quantity
      { wch: 15 }, // Unit Price
      { wch: 15 }, // Total
    ];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Detailed Sales');
    XLSX.writeFile(workbook, `detailed-sales-${timestamp}.xlsx`);
  };

  return (
    <>
      <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="flex flex-col items-start gap-2 pb-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20">
                <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Detailed Sales Report
              </h3>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            View individual sales transactions with complete details.
          </p>
          <Button size="sm" color="primary" variant="flat" className="w-full" onPress={() => setIsModalOpen(true)}>
            View Report
          </Button>
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-center gap-3 border-b dark:border-gray-700">
            <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Detailed Sales Report</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Individual sales transactions</p>
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
              label="Sales Transactions"
              isLoading={isLoading}
            />
          </ModalBody>
          <ModalFooter className="border-t dark:border-gray-700">
            <Button color="default" variant="light" onPress={() => setIsModalOpen(false)}>Close</Button>
            <Button color="primary" startContent={<Download className="h-4 w-4" />} onPress={exportData}>Export</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

