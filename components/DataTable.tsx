"use client";

import {
    Button,
    Card,
    CardBody,
    Dropdown,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    DropdownItem,
} from "@heroui/react";
import React, { useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

interface Column {
    key: string;
    header: string;
    renderCell?: (row: any, displayIndex?: number) => React.ReactNode;
}

interface StatusOption {
    key: string;
    label: string;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    label: string;
    description?: string;
    filter?: boolean;
    statusOptions?: StatusOption[];
    isLoading?: boolean;
    error?: any;
}

const DataTable = ({
    columns,
    data,
    label,
    description = "",
    filter = false,
    statusOptions = [],
    isLoading = false,
    error = null,
}: DataTableProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [visibleColumns, setVisibleColumns] = useState(
        columns.map((col) => col.key)
    );
    const [statusFilter, setStatusFilter] = useState("all");

    // handle show/hide columns
    const handleColumnFilterChange = (selectedKeys: any) => {
        setVisibleColumns(Array.from(selectedKeys));
    };

    // handle status filter
    const handleStatusFilterChange = (selectedKeys: any) => {
        const selectedValue = selectedKeys.currentKey;
        setStatusFilter(selectedValue);
    };

    // filtering + search
    const filteredData = useMemo(() => {
        if (!data || !Array.isArray(data)) {
            return [];
        }
        
        // Ensure searchTerm and statusFilter are strings
        const safeSearchTerm = searchTerm != null ? String(searchTerm) : "";
        const safeStatusFilter = statusFilter != null ? String(statusFilter) : "all";
        
        return data.filter((item) => {
            if (!item) return false;
            
            const matchesSearch = columns.some(
                (column) => {
                    if (!visibleColumns.includes(column.key)) return false;
                    
                    const value = item[column.key];
                    const stringValue = value != null ? String(value) : "";
                    return stringValue
                        .toLowerCase()
                        .includes(safeSearchTerm.toLowerCase());
                }
            );

            const itemStatus = item.status;
            const statusString = itemStatus != null ? String(itemStatus) : "Unknown";
            const matchesStatus =
                safeStatusFilter === "all" ||
                statusString.toLowerCase() === safeStatusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, data, visibleColumns, columns, statusFilter]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    return (
        <Card>
            <CardBody>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4 w-full">
                    <div>
                        <h1 className="text-2xl font-semibold">{label}</h1>
                        <p className="text-gray-500 text-sm">{description}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Input
                            startContent={<Search size={18} />}
                            size="lg"
                            type="search"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64"
                        />

                        {filter && (
                            <>
                                {/* Filter by status */}
                                {statusOptions.length > 0 && (
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                color="primary"
                                                endContent={<ChevronDown />}
                                                size="lg"
                                                variant="flat"
                                            >
                                                Filter Status
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            aria-label="Filter by Status"
                                            selectionMode="single"
                                            selectedKeys={new Set([statusFilter])}
                                            onSelectionChange={handleStatusFilterChange}
                                        >
                                            {statusOptions.map((status) => (
                                                <DropdownItem key={status.key}>
                                                    {status.label}
                                                </DropdownItem>
                                            ))}
                                        </DropdownMenu>
                                    </Dropdown>
                                )}

                                {/* Show/hide columns */}
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            color="primary"
                                            endContent={<ChevronDown />}
                                            size="lg"
                                            variant="flat"
                                        >
                                            Show Columns
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="Table Columns"
                                        closeOnSelect={false}
                                        selectionMode="multiple"
                                        selectedKeys={new Set(visibleColumns)}
                                        onSelectionChange={handleColumnFilterChange}
                                    >
                                        {columns.map((column) => (
                                            <DropdownItem key={column.key}>
                                                {column.header}
                                            </DropdownItem>
                                        ))}
                                    </DropdownMenu>
                                </Dropdown>
                            </>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg">
                    <Table aria-label={label}>
                        <TableHeader>
                            {columns
                                .filter((col) => visibleColumns.includes(col.key))
                                .map((column) => (
                                    <TableColumn key={column.key}>{column.header}</TableColumn>
                                ))}
                        </TableHeader>
                        <TableBody emptyContent={"No data found"}>
                            {paginatedData.map((item, index) => (
                                <TableRow key={index}>
                                    {columns
                                        .filter((col) => visibleColumns.includes(col.key))
                                        .map((column) => (
                                            <TableCell key={column.key}>
                                                {column.renderCell
                                                    ? column.renderCell(item, (currentPage - 1) * rowsPerPage + index + 1)
                                                    : item[column.key]}
                                            </TableCell>
                                        ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="py-2 px-2 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        Showing {paginatedData.length} of {filteredData.length} items
                    </span>
                    <Pagination
                        isCompact
                        showControls
                        color="primary"
                        page={currentPage}
                        total={totalPages}
                        onChange={setCurrentPage}
                    />
                </div>
            </CardBody>
        </Card>
    );
};

export default DataTable;