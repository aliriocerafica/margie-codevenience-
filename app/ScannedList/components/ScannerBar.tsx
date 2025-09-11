"use client";

import React from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Barcode, Search, Trash2, Plus } from "lucide-react";

export type ScannerBarProps = {
    value: string;
    onChange: (value: string) => void;
    onScan: () => void;
    onSearch?: () => void;
    onClear?: () => void;
};

export const ScannerBar: React.FC<ScannerBarProps> = ({ value, onChange, onScan, onSearch, onClear }) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onScan();
        }
    };

    return (
        <div className="flex items-center gap-3">
            <Input
                value={value}
                onChange={(e) => onChange((e.target as HTMLInputElement).value)}
                onKeyDown={handleKeyDown}
                placeholder="Scan barcode or search product..."
                size="lg"
                startContent={<Barcode className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />}
                classNames={{
                    inputWrapper: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700",
                    input: "text-sm sm:text-base py-3 lg:py-3 px-3 lg:px-4"
                }}
            />
            <Button
                size="lg"
                className="h-12 rounded-xl bg-gradient-to-r from-[#003366] to-[#004488] text-white"
                onPress={onScan}
                startContent={<Plus className="w-8 h-8" />}
            >
                Add
            </Button>
            {onSearch && (
                <Button
                    size="lg"
                    variant="flat"
                    className="h-12 rounded-xl"
                    onPress={onSearch}
                    startContent={<Search className="w-4 h-4" />}
                >
                    Search
                </Button>
            )}
            <Button
                size="lg"
                variant="flat"
                className="h-12 rounded-xl"
                onPress={onClear}
                startContent={<Trash2 className="w-4 h-4" />}
            >
                Clear
            </Button>
        </div>
    );
};


