"use client";

import React from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Barcode, Trash2, Plus } from "lucide-react";

export type ScannerBarProps = {
	value: string;
	onChange: (value: string) => void;
	onScan: () => void;
	onClear?: () => void;
	onSelect?: (product: { id: string; name: string; barcode?: string; price: string | number; status?: string }) => void;
};

export const ScannerBar: React.FC<ScannerBarProps> = ({ value, onChange, onScan, onClear, onSelect }) => {
	const [allProducts, setAllProducts] = React.useState<any[] | null>(null);
	const [open, setOpen] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement | null>(null);

	React.useEffect(() => {
		const onClickOutside = (e: MouseEvent) => {
			if (!containerRef.current) return;
			if (!containerRef.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", onClickOutside);
		return () => document.removeEventListener("mousedown", onClickOutside);
	}, []);

	const ensureProductsLoaded = React.useCallback(async () => {
		if (allProducts) return;
		try {
			const res = await fetch("/api/product");
			if (!res.ok) return;
			const data = await res.json();
			if (Array.isArray(data)) setAllProducts(data);
		} catch {
			// ignore
		}
	}, [allProducts]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			onScan();
			setOpen(false);
		}
	};

	const suggestions = React.useMemo(() => {
		const q = value.trim().toLowerCase();
		if (!q || !allProducts) return [] as any[];
		return allProducts.filter((p: any) => {
			const idStr = String(p.id).toLowerCase();
			const nameStr = String(p.name ?? "").toLowerCase();
			const categoryStr = String(p.category?.name ?? "").toLowerCase();
			const barcodeStr = String(p.barcode ?? idStr).toLowerCase();
			return idStr === q || barcodeStr === q || nameStr.includes(q) || categoryStr.includes(q);
		}).slice(0, 8);
	}, [value, allProducts]);

	const handleFocus = async () => {
		await ensureProductsLoaded();
		setOpen(true);
	};

	const handleSelect = (p: any) => {
		if (!onSelect) return;
		onSelect({
			id: String(p.id),
			name: p.name,
			barcode: p.barcode ?? String(p.id).padStart(12, "0"),
			price: p.price,
			status: p.status,
		});
		setOpen(false);
	};

	return (
		<div className="relative" ref={containerRef}>
			<div className="flex items-center gap-3">
				<Input
					value={value}
					onChange={(e) => onChange((e.target as HTMLInputElement).value)}
					onKeyDown={handleKeyDown}
					onFocus={handleFocus}
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
					onPress={() => { onScan(); setOpen(false); }}
					startContent={<Plus className="w-8 h-8" />}
				>
					Add
				</Button>
				{onClear && (
					<Button
						size="lg"
						variant="flat"
						className="h-12 rounded-xl"
						onPress={onClear}
						startContent={<Trash2 className="w-4 h-4" />}
					>
						Clear
					</Button>
				)}
			</div>
			{open && suggestions.length > 0 && (
				<div className="absolute z-10 mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-72 overflow-auto">
					<ul className="divide-y divide-gray-100 dark:divide-gray-800">
						{suggestions.map((p: any) => (
							<li key={String(p.id)}>
								<button
									type="button"
									onClick={() => handleSelect(p)}
									className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
								>
									<div className="flex items-center justify-between">
										<div className="min-w-0">
											<p className="truncate font-medium text-gray-900 dark:text-white">{p.name}</p>
											<p className="truncate text-xs text-gray-500 dark:text-gray-400">{p.category?.name ?? "Unknown"} • {String(p.barcode ?? p.id).padStart(12, "0")}</p>
										</div>
										<div className="text-sm font-semibold text-[#003366] dark:text-[#4488cc]">{p.price}</div>
									</div>
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};


