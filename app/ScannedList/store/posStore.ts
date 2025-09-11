"use client";

import { create } from "zustand";
import type { ScannedProduct } from "../components/ScannedProductsTable";

type POSState = {
    items: ScannedProduct[];
    addOrIncrement: (product: ScannedProduct) => void;
    increase: (id: string) => void;
    decrease: (id: string) => void;
    remove: (id: string) => void;
    clear: () => void;
};

export const usePOSStore = create<POSState>((set) => ({
    items: [],
    addOrIncrement: (product) => set((state) => {
        const existing = state.items.find(i => i.id === product.id);
        if (existing) {
            return { items: state.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + product.quantity } : i) };
        }
        return { items: [...state.items, product] };
    }),
    increase: (id) => set((state) => ({ items: state.items.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i) })),
    decrease: (id) => set((state) => ({ items: state.items.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i) })),
    remove: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
    clear: () => set({ items: [] }),
}));


