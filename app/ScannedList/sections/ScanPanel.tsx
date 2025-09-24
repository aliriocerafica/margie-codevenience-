"use client";

import React from "react";
import { ScannerBar } from "../components/ScannerBar";
import { ScannedProductsTable, ScannedProduct } from "../components/ScannedProductsTable";

export type ScanPanelProps = {
    query: string;
    onQueryChange: (value: string) => void;
    onScan: () => void;
    onSelect?: (product: { id: string; name: string; barcode?: string; price: string | number; status?: string }) => void;
    items: ScannedProduct[];
    onIncrease: (id: string) => void;
    onDecrease: (id: string) => void;
    onRemove: (id: string) => void;
    onClear: () => void;
};

export const ScanPanel: React.FC<ScanPanelProps> = ({ query, onQueryChange, onScan, onSelect, items, onIncrease, onDecrease, onRemove, onClear }) => {
    return (
        <div className="space-y-4">
            <ScannerBar value={query} onChange={onQueryChange} onScan={onScan} onSelect={onSelect} onClear={onClear} />
            <ScannedProductsTable items={items} onIncrease={onIncrease} onDecrease={onDecrease} onRemove={onRemove} />
        </div>
    );
};


