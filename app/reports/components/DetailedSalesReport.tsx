"use client";

import { Card, CardHeader, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea } from "@heroui/react";
import { FileText, Download, RotateCcw } from "lucide-react";
import { useState, useMemo } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';
import DataTable from "@/components/DataTable";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DetailedSalesReport() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<string>("");
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

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

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return `/api/reports/detailed-sales?${params.toString()}`;
  }, [dateFrom, dateTo]);

  const { data, error, isLoading, mutate } = useSWR(
    isModalOpen ? query : null, 
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  const rows = data?.rows || [];

  const handleReturnClick = (row: any) => {
    setSelectedSale(row);
    setReturnQuantity(1);
    setReturnReason("");
    setIsReturnModalOpen(true);
  };

  const handleProcessReturn = async () => {
    if (!selectedSale) return;

    if (returnQuantity <= 0 || returnQuantity > selectedSale.quantity) {
      showNotification({
        title: 'Invalid Quantity',
        description: `Return quantity must be between 1 and ${selectedSale.quantity}`,
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
      mutate();
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
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      renderCell: (r: any) => (
        <Button
          size="sm"
          color="warning"
          variant="flat"
          startContent={<RotateCcw className="h-4 w-4" />}
          onPress={() => handleReturnClick(r)}
        >
          Return
        </Button>
      ),
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
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Original Quantity:</span>
                      <span className="ml-2 font-medium">{selectedSale.quantity}</span>
                    </div>
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

                <div className="space-y-4">
                  <Input
                    type="number"
                    label="Return Quantity"
                    labelPlacement="outside"
                    value={returnQuantity.toString()}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setReturnQuantity(Math.max(1, Math.min(val, selectedSale.quantity)));
                    }}
                    min={1}
                    max={selectedSale.quantity}
                    description={`Maximum: ${selectedSale.quantity} units`}
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
            >
              Process Return
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

