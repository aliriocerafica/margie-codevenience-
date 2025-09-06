"use client";

import React from "react";
import { Chip } from "@heroui/react";
import useSWR from "swr";
import DataTable from "@/components/DataTable";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Category = () => {
    const { data, error, isLoading } = useSWR(`/api/category`, fetcher);

    if (error) return <div>failed to load</div>;
    if (isLoading) return <div>loading...</div>;



    const columns = [
        { key: "id", header: "ID" },
        { key: "name", header: "Name" },
    ];

    return (
        <div className="py-6">
            <DataTable
                filter={true}
                label="Category List"
                description="An overview of all categories."
                columns={columns}
                data={data}
            />
        </div>
    );
};

export default Category;