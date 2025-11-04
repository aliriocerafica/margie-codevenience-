"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { ProductSummaryItem } from "@/types";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatCurrency } from "@/lib/constants";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface DashboardLowStockProductsProps {
  products: ProductSummaryItem[];
}

export const DashboardLowStockProducts: React.FC<DashboardLowStockProductsProps> = ({ products }) => {
  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Products</h3>
        </div>
        <Link href="/product" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No low stock products found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">All products are well stocked!</p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors duration-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    {product.status && (
                      <StatusChip status={product.status} size="sm" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{product.category}</span>
                    {product.stock !== undefined && (
                      <span className="font-semibold text-yellow-700 dark:text-yellow-300">
                        Stock: {product.stock} units
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#003366] dark:text-[#4488cc]">
                    {typeof product.price === 'string' && product.price.startsWith('₱') 
                      ? product.price 
                      : formatCurrency(product.price)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default DashboardLowStockProducts;

