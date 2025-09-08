"use client";

import React from "react";
import { Chip } from "@heroui/react";
import DataTable from "@/components/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatCurrency, PRODUCT_STATUS_COLORS, PRODUCT_STATUS_OPTIONS } from "@/lib/constants";
import type { Product } from "@/types";

interface ProductTableProps {
  data: Product[] | undefined;
  isLoading?: boolean;
  error?: any;
}

export const ProductTable: React.FC<ProductTableProps> = ({ data, isLoading, error }) => {
  const columns = [
    { key: "id", header: "ID" },
    {
      key: "image",
      header: "Image",
      renderCell: (row: Product) => (
        <div className="flex items-center">
          <img 
            src={row.image} 
            alt={row.name} 
            className="w-12 h-12 rounded-md object-cover border border-gray-200 dark:border-gray-700" 
          />
        </div>
      ),
    },
    { 
      key: "name", 
      header: "Product Name",
      renderCell: (row: Product) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
          {row.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {row.description}
            </p>
          )}
        </div>
      )
    },
    { 
      key: "category", 
      header: "Category",
      renderCell: (row: Product) => (
        <Chip 
          variant="flat" 
          color="primary" 
          size="sm"
          className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
        >
          {row.category?.name}
        </Chip>
      )
    },
    { 
      key: "price", 
      header: "Price",
      renderCell: (row: Product) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(row.price)}
        </span>
      )
    },
    { 
      key: "stock", 
      header: "Stock",
      renderCell: (row: Product) => (
        <div className="text-center">
          <span className={`font-medium ${
            row.stock === 0 
              ? "text-red-600 dark:text-red-400" 
              : row.stock <= 10 
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-green-600 dark:text-green-400"
          }`}>
            {row.stock}
          </span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      renderCell: (row: Product) => (
        <StatusChip 
          status={row.status} 
          colorMap={PRODUCT_STATUS_COLORS}
          variant="flat"
          size="sm"
        />
      ),
    },
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
      />
    </div>
  );
};

export default ProductTable;
