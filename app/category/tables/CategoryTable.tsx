"use client";

import React from "react";
import DataTable from "@/components/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { CATEGORY_STATUS_COLORS, CATEGORY_STATUS_OPTIONS } from "@/lib/constants";
import type { Category } from "@/types";

interface CategoryTableProps {
  data: Category[] | undefined;
  isLoading?: boolean;
  error?: any;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({ data, isLoading, error }) => {
  const columns = [
    { key: "id", header: "#", renderCell: (_row: Category, index?: number) => index ?? "" },
    { 
      key: "name", 
      header: "Category Name",
      renderCell: (row: Category) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {row.name || `Category ${row.id}` || 'Unnamed Category'}
          </p>
          {row.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {row.description}
            </p>
          )}
        </div>
      )
    },
    { 
      key: "productCount", 
      header: "Products",
      renderCell: (row: Category) => (
        <div className="text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {row.productCount || 0} items
          </span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      renderCell: (row: Category) => (
        <StatusChip 
          status={row.status || 'active'} 
          colorMap={CATEGORY_STATUS_COLORS}
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
          label="Category List"
          description="Loading categories..."
          statusOptions={CATEGORY_STATUS_OPTIONS}
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
          label="Category List"
          description="Failed to load categories."
          statusOptions={CATEGORY_STATUS_OPTIONS}
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
        label="Category List"
        description="Organize your products into categories for better management."
        statusOptions={CATEGORY_STATUS_OPTIONS}
        columns={columns}
        data={data || []}
      />
    </div>
  );
};

export default CategoryTable;
