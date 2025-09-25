"use client";

import React from "react";
import DataTable from "@/components/DataTable";
import type { Category } from "@/types";
import { Button, Tooltip } from "@heroui/react";
import { Pencil, Trash2 } from "lucide-react";

interface CategoryTableProps {
  data: Category[] | undefined;
  isLoading?: boolean;
  error?: any;
  onEdit?: (category: Category) => void;
  onRequestDelete?: (category: Category) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({ data, isLoading, error, onEdit, onRequestDelete }) => {
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
      key: "createdAt", 
      header: "Created At",
      renderCell: (row: any) => {
        const d = row?.createdAt ? new Date(row.createdAt) : null;
        const formatted = d ? `${d.toLocaleDateString()} ${d.toLocaleTimeString()}` : "-";
        return <span className="text-sm text-gray-700 dark:text-gray-300 inline-block w-40 text-right whitespace-nowrap">{formatted}</span>;
      }
    },
    {
      key: "actions",
      header: "Actions",
      renderCell: (row: any) => (
        <div className="flex items-center gap-1 justify-end w-24">
          <Tooltip content="Edit" placement="top">
            <Button isIconOnly size="sm" variant="flat" color="primary" onPress={() => onEdit?.(row)}>
              <Pencil size={16} />
            </Button>
          </Tooltip>
          <Tooltip content="Delete" placement="top">
            <Button isIconOnly size="sm" variant="flat" color="danger" onPress={() => onRequestDelete?.(row)}>
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
          label="Category List"
          description="Loading categories..."
          statusOptions={[]}
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
          statusOptions={[]}
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
        statusOptions={[]}
        columns={columns}
        data={data || []}
      />
    </div>
  );
};

export default CategoryTable;
