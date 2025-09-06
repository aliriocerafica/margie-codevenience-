"use client";

import React from "react";
import { Chip } from "@heroui/react";
import useSWR from "swr";
import DataTable from "@/components/DataTable";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Product = () => {
    const { data, error, isLoading } = useSWR(`/api/product`, fetcher);

    if (error) return <div>failed to load</div>;
    if (isLoading) return <div>loading...</div>;

    const StatusColor: Record<string, "success" | "danger" | "warning" | "default"> = {
        available: "success",
        low_stock: "warning",
        out_of_stock: "danger",
    };

    const columns = [
        { key: "id", header: "ID" },
        {
            key: "image",
            header: "Image",
            renderCell: (row: any) => (
                <img src={row.image} alt={row.name} className="w-12 h-12 rounded-md" />
            ),
        },
        { key: "name", header: "Name" },
        { key: "category", header: "Category", renderCell: (row: any) => row.category?.name },
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
                data={data}
            />
        </div>
    );
};

export default Product;