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
import { ChevronDown, Search, SlidersHorizontal, Columns3, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Column {
    key: string;
    header: string;
    renderCell?: (row: any, displayIndex?: number) => React.ReactNode;
    sortable?: boolean;
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
    filterKey?: string; // which field to filter on (default: 'status')
    filterLabel?: string; // button label (default: 'Filter Status')
    isLoading?: boolean;
    error?: any;
    customFilters?: React.ReactNode; // extra filter controls area
    defaultSort?: { key: string; direction: 'asc' | 'desc' }; // default sorting
    defaultVisibleColumns?: string[]; // columns to show by default
    showColumnFilter?: boolean; // show/hide column visibility filter (default: true)
}

const DataTable = ({
    columns,
    data,
    label,
    description = "",
    filter = false,
    statusOptions = [],
    filterKey = "status",
    filterLabel = "Filter Status",
    isLoading = false,
    error = null,
    customFilters,
    defaultSort,
    defaultVisibleColumns,
    showColumnFilter = true,
}: DataTableProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);
    // Ensure actions column is always included in visible columns
    const allColumnKeys = columns.map((col) => col.key);
    const hasActionsColumn = allColumnKeys.includes("actions");
    // Use defaultVisibleColumns if provided, otherwise show all columns
    const initialVisibleColumns = defaultVisibleColumns 
        ? [...defaultVisibleColumns, ...(hasActionsColumn && !defaultVisibleColumns.includes("actions") ? ["actions"] : [])]
        : allColumnKeys;
    const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortKey, setSortKey] = useState(defaultSort?.key || "");
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSort?.direction || 'asc');

    // handle show/hide columns
    const handleColumnFilterChange = (selectedKeys: any) => {
        const selected = Array.from(selectedKeys) as string[];
        // Always include actions column if it exists
        if (hasActionsColumn && !selected.includes("actions")) {
            selected.push("actions");
        }
        setVisibleColumns(selected);
    };

    // handle status filter
    const handleStatusFilterChange = (selectedKeys: any) => {
        const selectedValue = selectedKeys.currentKey;
        setStatusFilter(selectedValue);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    // handle sorting
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
        setCurrentPage(1); // Reset to first page when sorting
    };

    // get sort icon for column header
    const getSortIcon = (key: string) => {
        if (sortKey !== key) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
        return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
    };

    // filtering + search + sorting
    const filteredData = useMemo(() => {
        if (!data || !Array.isArray(data)) {
            return [];
        }
        
        // Ensure searchTerm and statusFilter are strings
        const safeSearchTerm = searchTerm != null ? String(searchTerm) : "";
        const safeStatusFilter = statusFilter != null ? String(statusFilter) : "all";
        
        let filtered = data.filter((item) => {
            if (!item) return false;
            
            const matchesSearch = columns.some(
                (column) => {
                    if (!visibleColumns.includes(column.key)) return false;
                    
                    const value = item[column.key];
                    let stringValue = "";
                    if (value == null) {
                        stringValue = "";
                    } else if (typeof value === "object") {
                        if (typeof (value as any).name === "string") stringValue = (value as any).name as string;
                        else if (typeof (value as any).label === "string") stringValue = (value as any).label as string;
                        else {
                            try { stringValue = Object.values(value as any).join(" "); }
                            catch { stringValue = JSON.stringify(value); }
                        }
                    } else {
                        stringValue = String(value);
                    }
                    return stringValue
                        .toLowerCase()
                        .includes(safeSearchTerm.toLowerCase());
                }
            );

            const itemStatus = filterKey ? item[filterKey] : item.status;
            const statusString = itemStatus != null ? String(itemStatus) : "Unknown";
            const matchesStatus =
                safeStatusFilter === "all" ||
                statusString.toLowerCase() === safeStatusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });

        // Apply sorting if sortKey is set
        if (sortKey) {
            filtered.sort((a, b) => {
                let aValue = a[sortKey];
                let bValue = b[sortKey];

                // Handle nested objects (like category.name, product.name)
                if (sortKey === 'category' && aValue && typeof aValue === 'object') {
                    aValue = aValue.name || '';
                }
                if (sortKey === 'category' && bValue && typeof bValue === 'object') {
                    bValue = bValue.name || '';
                }
                if (sortKey === 'product' && aValue && typeof aValue === 'object') {
                    aValue = aValue.name || '';
                }
                if (sortKey === 'product' && bValue && typeof bValue === 'object') {
                    bValue = bValue.name || '';
                }

                // Handle null/undefined values
                if (aValue == null) aValue = '';
                if (bValue == null) bValue = '';

                // Convert to appropriate types for comparison
                let comparison = 0;
                
                // Handle date fields (createdAt, updatedAt, etc.)
                if (sortKey === 'createdAt' || sortKey === 'updatedAt' || sortKey.includes('Date') || sortKey.includes('date')) {
                    const aDate = new Date(aValue);
                    const bDate = new Date(bValue);
                    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
                        comparison = aDate.getTime() - bDate.getTime();
                    } else {
                        // Fallback to string comparison if dates are invalid
                        const aStr = String(aValue).toLowerCase();
                        const bStr = String(bValue).toLowerCase();
                        comparison = aStr.localeCompare(bStr);
                    }
                } else {
                    // Check if values are numeric
                    const aNum = typeof aValue === 'string' ? parseFloat(aValue) : Number(aValue);
                    const bNum = typeof bValue === 'string' ? parseFloat(bValue) : Number(bValue);
                    
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        // Numeric comparison
                        comparison = aNum - bNum;
                    } else {
                        // String comparison
                        const aStr = String(aValue).toLowerCase();
                        const bStr = String(bValue).toLowerCase();
                        comparison = aStr.localeCompare(bStr);
                    }
                }

                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        return filtered;
    }, [searchTerm, data, visibleColumns, columns, statusFilter, sortKey, sortDirection]);

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

                    {/* Desktop layout - original state */}
                    <div className="hidden sm:flex items-center gap-4 flex-nowrap overflow-x-auto sm:overflow-visible no-scrollbar">
                        <Input
                            startContent={<Search size={18} />}
                            size="lg"
                            type="search"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page when search changes
                            }}
                            className="w-[180px] sm:w-64"
                            classNames={{ inputWrapper: "h-12", input: "text-sm" }}
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
                                                startContent={<SlidersHorizontal className="h-4 w-4" />}
                                                size="lg"
                                                variant="flat"
                                            className="px-3 sm:px-4"
                                            >
                                                <span className="hidden sm:inline">{filterLabel}</span>
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
                                {showColumnFilter && (
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                color="primary"
                                                endContent={<ChevronDown />}
                                                startContent={<Columns3 className="h-4 w-4" />}
                                                size="lg"
                                                variant="flat"
                                                className="px-3 sm:px-4"
                                            >
                                                <span className="hidden sm:inline">Show Columns</span>
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
                                )}
                            </>
                        )}
                        <div className="whitespace-nowrap flex items-center">{customFilters}</div>
                    </div>

                    {/* Mobile layout - search field full width, filters below */}
                    <div className="flex sm:hidden flex-col gap-3 w-full">
                        <Input
                            startContent={<Search size={18} />}
                            size="lg"
                            type="search"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page when search changes
                            }}
                            className="w-full"
                            classNames={{ inputWrapper: "h-12", input: "text-sm" }}
                        />

                        {filter && (
                            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto no-scrollbar">
                                {/* Filter by status */}
                                {statusOptions.length > 0 && (
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                color="primary"
                                                endContent={<ChevronDown />}
                                                startContent={<SlidersHorizontal className="h-4 w-4" />}
                                                size="lg"
                                                variant="flat"
                                                className="px-3"
                                            >
                                                <span className="hidden xs:inline">{filterLabel}</span>
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
                                {showColumnFilter && (
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                color="primary"
                                                endContent={<ChevronDown />}
                                                startContent={<Columns3 className="h-4 w-4" />}
                                                size="lg"
                                                variant="flat"
                                                className="px-3"
                                            >
                                                <span className="hidden xs:inline">Columns</span>
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
                                )}

                                {/* Custom filters */}
                                <div className="whitespace-nowrap flex items-center">{customFilters}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg">
                    <Table 
                        aria-label={label}
                        classNames={{
                            wrapper: "min-w-full",
                            th: "text-xs px-2 py-2",
                            td: "text-xs px-2 py-2",
                        }}
                    >
                        <TableHeader>
                            {columns
                                .filter((col) => visibleColumns.includes(col.key))
                                .map((column) => (
                                    <TableColumn key={column.key}>
                                        {column.sortable !== false ? (
                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="h-auto p-0 font-semibold text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                                onPress={() => handleSort(column.key)}
                                                startContent={getSortIcon(column.key)}
                                            >
                                                {column.header}
                                            </Button>
                                        ) : (
                                            <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                                                {column.header}
                                            </span>
                                        )}
                                    </TableColumn>
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