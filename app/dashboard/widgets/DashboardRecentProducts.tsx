"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { ProductSummaryItem } from "@/types";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatCurrency } from "@/lib/constants";
import Link from "next/link";

interface DashboardRecentProductsProps {
  products: ProductSummaryItem[];
}

export const DashboardRecentProducts: React.FC<DashboardRecentProductsProps> = ({ products }) => {
  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Products</h3>
        <Link href="/product" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No products found</p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
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
                      <span>Stock: {product.stock}</span>
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

export default DashboardRecentProducts;
