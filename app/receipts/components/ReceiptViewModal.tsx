"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from "@heroui/react";
import { Download, Printer, X } from "lucide-react";
import { printReceipt } from "@/app/ScannedList/utils/printReceipt";

export type ReceiptViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transactionNo: string;
};

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
  isOpen,
  onClose,
  transactionNo,
}) => {
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transactionNo) {
      fetchReceipt();
    }
  }, [isOpen, transactionNo]);

  const fetchReceipt = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/receipts/${encodeURIComponent(transactionNo)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch receipt");
      }
      const data = await response.json();
      setReceiptData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load receipt");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!receiptData) return;
    
    const receiptPayload = {
      storeName: receiptData.storeName || "Margie CodeVenience",
      storePhone: receiptData.storePhone || "",
      storeAddressLines: receiptData.storeAddressLines || [],
      logoPath: "/Logo.png",
      items: receiptData.items.map((item: any) => ({
        name: item.name,
        barcode: item.barcode || "",
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal: receiptData.subtotal,
      discount: receiptData.discount || 0,
      total: receiptData.total,
      paidAmount: receiptData.total, // Assuming full payment
      change: 0,
      timestamp: new Date(receiptData.dateTime),
      transactionNo: receiptData.transactionNo,
    };

    printReceipt(receiptPayload);
  };

  const handleDownload = () => {
    // Download uses the same print functionality
    // Users can choose "Save as PDF" from the print dialog
    handlePrint();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold">Receipt Details</h3>
          </div>
          {receiptData && (
            <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
              Transaction: {receiptData.transactionNo}
            </p>
          )}
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : receiptData ? (
            <div className="space-y-4">
              {/* Store Info */}
              <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {receiptData.storeName}
                </h2>
                {receiptData.storePhone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {receiptData.storePhone}
                  </p>
                )}
                {receiptData.storeAddressLines && receiptData.storeAddressLines.length > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {receiptData.storeAddressLines.map((line: string, idx: number) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Transaction Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transaction No:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {receiptData.transactionNo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Date & Time:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {new Date(receiptData.dateTime).toLocaleString()}
                  </span>
                </div>
                {receiptData.handledBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Handled By:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {receiptData.handledBy}
                    </span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Items</h3>
                <div className="space-y-2">
                  {receiptData.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </p>
                        {item.barcode && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Barcode: {item.barcode}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ₱{item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        ₱{item.total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    ₱{receiptData.subtotal.toFixed(2)}
                  </span>
                </div>
                {receiptData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      -₱{receiptData.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    ₱{receiptData.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Close
          </Button>
          {receiptData && (
            <Button
              color="primary"
              startContent={<Printer className="h-4 w-4" />}
              onPress={handlePrint}
            >
              Print / Save as PDF
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

