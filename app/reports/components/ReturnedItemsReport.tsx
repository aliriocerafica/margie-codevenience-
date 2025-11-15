"use client";

import { Card, CardHeader, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input } from "@heroui/react";
import { RotateCcw, Download } from "lucide-react";
import { useState, useMemo } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';
import DataTable from "@/components/DataTable";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ReturnedItemsReport() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return `/api/reports/returned-items?${params.toString()}`;
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
    { 
      key: "date", 
      header: "Date", 
      sortable: true, 
      renderCell: (r: any) => new Date(r.date).toLocaleDateString() 
    },
    { key: "transactionNo", header: "Transaction No.", sortable: true },
    { key: "productName", header: "Product Name", sortable: true },
    { key: "quantity", header: "Quantity", sortable: true },
    { 
      key: "refundAmount", 
      header: "Refund Amount (₱)", 
      sortable: true, 
      renderCell: (r: any) => `₱${r.refundAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    },
    { key: "reason", header: "Reason for Return", sortable: true, renderCell: (r: any) => r.reason || "-" },
    { key: "handledBy", header: "Handled By", sortable: true, renderCell: (r: any) => r.handledBy || "-" },
  ];

  const exportData = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const workbook = XLSX.utils.book_new();
    
    const sheetData = rows.map((r: any) => ({
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
      { wch: 15 }, // Date
      { wch: 20 }, // Transaction No.
      { wch: 30 }, // Product Name
      { wch: 10 }, // Quantity
      { wch: 15 }, // Refund Amount
      { wch: 25 }, // Reason for Return
      { wch: 15 }, // Handled By
    ];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Returned Items');
    XLSX.writeFile(workbook, `returned-items-${timestamp}.xlsx`);
  };

  return (
    <>
      <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="flex flex-col items-start gap-2 pb-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 dark:bg-red-500/20">
                <RotateCcw className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Returned / Refunded Items Report
              </h3>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Track all returned and refunded items with reasons.
          </p>
          <Button size="sm" color="danger" variant="flat" className="w-full" onPress={() => setIsModalOpen(true)}>
            View Report
          </Button>
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-center gap-3 border-b dark:border-gray-700">
            <div className="p-2 rounded-lg bg-red-500/10 dark:bg-red-500/20">
              <RotateCcw className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Returned / Refunded Items Report</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">All returns and refunds</p>
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
              label="Returned Items"
              isLoading={isLoading}
            />
          </ModalBody>
          <ModalFooter className="border-t dark:border-gray-700">
            <Button color="default" variant="light" onPress={() => setIsModalOpen(false)}>Close</Button>
            <Button color="danger" startContent={<Download className="h-4 w-4" />} onPress={exportData}>Export</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

