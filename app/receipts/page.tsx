"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { Card, CardBody, Button, Input, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Receipt, Download, Search, Calendar, FileText, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import DataTable from "@/components/DataTable";
import { ReceiptViewModal } from "./components/ReceiptViewModal";
import { useSession } from "next-auth/react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ReceiptsPage() {
  const { data: session } = useSession();
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Build API URL with filters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    if (searchQuery) params.append("transactionNo", searchQuery);
    return `/api/receipts?${params.toString()}`;
  }, [dateFrom, dateTo, searchQuery]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });

  const transactions = data?.transactions || [];

  const handleViewReceipt = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedTransaction(null);
  };

  const applyDatePreset = (preset: string) => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

    let from: string = "";
    let to: string = "";

    switch (preset) {
      case "today":
        from = startOfDay(now).toISOString().split("T")[0];
        to = endOfDay(now).toISOString().split("T")[0];
        break;
      case "yesterday":
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        from = startOfDay(yesterday).toISOString().split("T")[0];
        to = endOfDay(yesterday).toISOString().split("T")[0];
        break;
      case "last7":
        const last7 = new Date(now);
        last7.setDate(last7.getDate() - 7);
        from = startOfDay(last7).toISOString().split("T")[0];
        to = endOfDay(now).toISOString().split("T")[0];
        break;
      case "last30":
        const last30 = new Date(now);
        last30.setDate(last30.getDate() - 30);
        from = startOfDay(last30).toISOString().split("T")[0];
        to = endOfDay(now).toISOString().split("T")[0];
        break;
      case "thisMonth":
        from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        to = endOfDay(now).toISOString().split("T")[0];
        break;
      case "lastMonth":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        from = startOfDay(lastMonth).toISOString().split("T")[0];
        to = endOfDay(lastDayOfLastMonth).toISOString().split("T")[0];
        break;
    }

    setDateFrom(from);
    setDateTo(to);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
  };

  const columns = [
    { key: "transactionNo", header: "Transaction No.", sortable: true },
    { 
      key: "dateTime", 
      header: "Date & Time", 
      sortable: true,
      renderCell: (row: any) => new Date(row.dateTime).toLocaleString()
    },
    { 
      key: "items", 
      header: "Items", 
      sortable: false,
      renderCell: (row: any) => `${row.items.length} item(s)`
    },
    { 
      key: "total", 
      header: "Total Amount", 
      sortable: true,
      renderCell: (row: any) => `₱${row.total.toFixed(2)}`
    },
    { 
      key: "handledBy", 
      header: "Handled By", 
      sortable: true,
      renderCell: (row: any) => row.handledBy || "-"
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      renderCell: (row: any) => (
        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<FileText className="h-4 w-4" />}
          onPress={() => handleViewReceipt(row)}
        >
          View Receipt
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receipts"
        description="View and download past transaction receipts"
      />

      {/* Filters */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <Input
              placeholder="Search by transaction number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              className="flex-1"
              size="sm"
            />

            {/* Date From */}
            <Input
              type="date"
              label="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              startContent={<Calendar className="h-4 w-4 text-gray-400" />}
              size="sm"
            />

            {/* Date To */}
            <Input
              type="date"
              label="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              startContent={<Calendar className="h-4 w-4 text-gray-400" />}
              size="sm"
            />

            {/* Clear Filters */}
            {(dateFrom || dateTo || searchQuery) && (
              <Button
                variant="light"
                size="sm"
                startContent={<X className="h-4 w-4" />}
                onPress={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Date Presets */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="flat" onPress={() => applyDatePreset("today")}>
              Today
            </Button>
            <Button size="sm" variant="flat" onPress={() => applyDatePreset("yesterday")}>
              Yesterday
            </Button>
            <Button size="sm" variant="flat" onPress={() => applyDatePreset("last7")}>
              Last 7 Days
            </Button>
            <Button size="sm" variant="flat" onPress={() => applyDatePreset("last30")}>
              Last 30 Days
            </Button>
            <Button size="sm" variant="flat" onPress={() => applyDatePreset("thisMonth")}>
              This Month
            </Button>
            <Button size="sm" variant="flat" onPress={() => applyDatePreset("lastMonth")}>
              Last Month
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading receipts...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Failed to load receipts</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No receipts found</p>
            </div>
          ) : (
            <DataTable
              columns={columns as any}
              data={transactions}
              label="Receipts"
              isLoading={isLoading}
            />
          )}
        </CardBody>
      </Card>

      {/* Receipt View Modal */}
      {selectedTransaction && (
        <ReceiptViewModal
          isOpen={isViewModalOpen}
          onClose={handleCloseModal}
          transactionNo={selectedTransaction.transactionNo}
        />
      )}
    </div>
  );
}

