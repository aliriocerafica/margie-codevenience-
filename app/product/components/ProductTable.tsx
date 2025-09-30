"use client";

import React from "react";
import { Chip, Button, Tooltip } from "@heroui/react";
import { Trash2, Edit } from "lucide-react";
import DataTable from "@/components/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatCurrency, PRODUCT_STATUS_COLORS, PRODUCT_STATUS_OPTIONS } from "@/lib/constants";
import type { Product as SampleProduct } from "@/types";

// Accept both sample Product and backend Product shape
export type ProductRow = SampleProduct | {
  id: string;
  name: string;
  price: string | number;
  stock: string | number;
  status?: string;
  imageUrl?: string | null;
  image?: string | null;
  category?: { name?: string | null } | null;
};

interface ProductTableProps {
  data: ProductRow[] | undefined;
  isLoading?: boolean;
  error?: any;
  onEdit?: (product: ProductRow) => void;
  onDelete?: (product: ProductRow) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ data, isLoading, error, onEdit, onDelete }) => {
  const columns = [
    { key: "id", header: "#", sortable: false, renderCell: (_row: ProductRow, index?: number) => index ?? "" },
    {
      key: "image",
      header: "Image",
      sortable: false,
      renderCell: (row: ProductRow) => (
        <div className="flex items-center">
          <img 
            src={(row as any).image || (row as any).imageUrl || "https://via.placeholder.com/48"} 
            alt={(row as any).name} 
            className="w-12 h-12 rounded-md object-cover border border-gray-200 dark:border-gray-700" 
          />
        </div>
      ),
    },
    { 
      key: "name", 
      header: "Product Name",
      sortable: true,
      renderCell: (row: ProductRow) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{(row as any).name}</p>
        </div>
      )
    },
    { 
      key: "category", 
      header: "Category",
      sortable: true,
      renderCell: (row: ProductRow) => (
        <Chip 
          variant="flat" 
          color="primary" 
          size="sm"
          className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
        >
          {(row as any).category?.name || "—"}
        </Chip>
      )
    },
    { 
      key: "price", 
      header: "Price",
      sortable: true,
      renderCell: (row: ProductRow) => {
        const price = (row as any).price;
        // Show exact MongoDB value when it is a string; only format numeric values
        const display = typeof price === "string" ? price : formatCurrency(price);
        return (
          <span className="font-semibold text-gray-900 dark:text-white">
            {display}
          </span>
        );
      }
    },
    { 
      key: "stock", 
      header: "Stock",
      sortable: true,
      renderCell: (row: ProductRow) => {
        const stockValue = (row as any).stock;
        const stockNum = typeof stockValue === "string" ? parseInt(stockValue, 10) : stockValue ?? 0;
        return (
          <div className="text-center">
            <span className={`font-medium ${
              stockNum === 0 
                ? "text-red-600 dark:text-red-400" 
                : stockNum <= 10 
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-green-600 dark:text-green-400"
            }`}>
              {Number.isFinite(stockNum) ? stockNum : 0}
            </span>
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      renderCell: (row: ProductRow) => (
        <StatusChip 
          status={(row as any).status} 
          colorMap={PRODUCT_STATUS_COLORS}
          variant="flat"
          size="sm"
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      renderCell: (row: ProductRow) => (
        <div className="flex items-center gap-1 justify-end w-24">
          <Tooltip content="Edit" placement="top">
            <Button 
              isIconOnly 
              size="sm" 
              variant="flat" 
              color="primary" 
              onPress={() => onEdit?.(row)}
            >
              <Edit size={16} />
            </Button>
          </Tooltip>
          <Tooltip content="Delete" placement="top">
            <Button 
              isIconOnly 
              size="sm" 
              variant="flat" 
              color="danger" 
              onPress={() => onDelete?.(row)}
            >
              <Trash2 size={16} />
            </Button>
          </Tooltip>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="py-6">
        <DataTable
          filter={true}
          label="Product List"
          description="Loading products..."
          statusOptions={PRODUCT_STATUS_OPTIONS}
          columns={columns}
          data={[]}
          isLoading={true}
          defaultSort={{ key: "name", direction: "asc" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <DataTable
          filter={true}
          label="Product List"
          description="Failed to load products."
          statusOptions={PRODUCT_STATUS_OPTIONS}
          columns={columns}
          data={[]}
          error={error}
          defaultSort={{ key: "name", direction: "asc" }}
        />
      </div>
    );
  }

  return (
    <div className="py-6">
      <DataTable
        filter={true}
        label="Product List"
        description="Manage your product inventory and pricing."
        statusOptions={PRODUCT_STATUS_OPTIONS}
        columns={columns}
        data={data || []}
        defaultSort={{ key: "name", direction: "asc" }}
      />
    </div>
  );
};

export default ProductTable;
