"use client";

import React from "react";
import DataTable from "@/components/DataTable";
import { Chip } from "@heroui/react";

const Product = () => {
    const products = [
        {
            id: "1",
            image: "https://picsum.photos/id/101/300",
            name: "Espresso Roast",
            price: 250,
            stock: 50,
            category: "Coffee Beans",
            status: "available",
        },
        {
            id: "2",
            image: "https://picsum.photos/id/102/300",
            name: "Cold Brew Bottle",
            price: 180,
            stock: 20,
            category: "Drinks",
            status: "low_stock",
        },
        {
            id: "3",
            image: "https://picsum.photos/id/103/300",
            name: "French Press",
            price: 950,
            stock: 10,
            category: "Equipment",
            status: "available",
        },
        {
            id: "4",
            image: "https://picsum.photos/id/104/300",
            name: "Caramel Latte",
            price: 150,
            stock: 0,
            category: "Drinks",
            status: "out_of_stock",
        },
    ];

    const StatusColor: Record<
        string,
        "success" | "danger" | "warning" | "default"
    > = {
        available: "success",
        low_stock: "warning",
        out_of_stock: "danger",
    };

    const columns = [
        {
            key: "image",
            header: "Image",
            renderCell: (row: any) => (
                <img
                    src={row.image}
                    alt={row.name}
                    className="w-12 h-12 rounded-md"
                />
            ),
        },
        { key: "name", header: "Product Name" },
        { key: "category", header: "Category" },
        { key: "price", header: "Price (₱)" },
        { key: "stock", header: "Stock" },
        {
            key: "status",
            header: "Status",
            renderCell: (row: any) => (
                <Chip color={StatusColor[row.status] || "default"} variant="flat">
                    {row.status}
                </Chip>
            ),
        },
    ];

    const statusOptions = [
        { key: "all", label: "All" },
        { key: "available", label: "Available" },
        { key: "low_stock", label: "Low Stock" },
        { key: "out_of_stock", label: "Out of Stock" },
    ];

    return (
        <div className="py-6">
            <DataTable
                filter={true}
                label="Product List"
                description="An overview of all products."
                statusOptions={statusOptions}
                columns={columns}
                data={products}
            />
        </div>
    );
};

export default Product;