"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Types for searchable content
export interface SearchableItem {
  id: string;
  title: string;
  description?: string;
  type: 'page' | 'product' | 'category' | 'user' | 'order';
  url?: string;
  metadata?: Record<string, any>;
}

// Sample searchable data - this would typically come from your database
const searchableData: SearchableItem[] = [
  // Pages
  { id: 'dashboard', title: 'Dashboard', description: 'Main dashboard overview', type: 'page', url: '/dashboard' },
  { id: 'products', title: 'Products', description: 'Product management', type: 'page', url: '/product' },
  { id: 'categories', title: 'Categories', description: 'Category management', type: 'page', url: '/category' },
  
  // Sample Products
  { id: 'product-1', title: 'Wireless Headphones', description: 'Premium wireless headphones with noise cancellation', type: 'product', url: '/product?id=1', metadata: { price: '$299.99', category: 'Electronics' } },
  { id: 'product-2', title: 'Smartphone Case', description: 'Protective case for latest smartphones', type: 'product', url: '/product?id=2', metadata: { price: '$29.99', category: 'Accessories' } },
  { id: 'product-3', title: 'Laptop Stand', description: 'Adjustable aluminum laptop stand', type: 'product', url: '/product?id=3', metadata: { price: '$59.99', category: 'Office' } },
  { id: 'product-4', title: 'Coffee Mug', description: 'Ceramic coffee mug with company logo', type: 'product', url: '/product?id=4', metadata: { price: '$15.99', category: 'Merchandise' } },
  
  // Sample Categories
  { id: 'category-1', title: 'Electronics', description: 'Electronic devices and gadgets', type: 'category', url: '/category?id=1' },
  { id: 'category-2', title: 'Accessories', description: 'Phone and computer accessories', type: 'category', url: '/category?id=2' },
  { id: 'category-3', title: 'Office', description: 'Office supplies and equipment', type: 'category', url: '/category?id=3' },
];

interface SearchContextType {
  searchQuery: string;
  searchResults: SearchableItem[];
  isSearching: boolean;
  isSearchModalOpen: boolean;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  navigateToResult: (item: SearchableItem) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const performSearch = useCallback((query: string) => {
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      if (query.trim() === '') {
        setSearchResults([]);
      } else {
        const filtered = searchableData.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()) ||
          item.type.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      }
      setIsSearching(false);
    }, 300);
  }, []);

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    performSearch(query);
  }, [performSearch]);

  const openSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
  }, []);

  const closeSearchModal = useCallback(() => {
    setIsSearchModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const navigateToResult = useCallback((item: SearchableItem) => {
    if (item.url) {
      // Add search query as URL parameter to highlight on destination page
      const url = new URL(item.url, window.location.origin);
      if (searchQuery.trim()) {
        url.searchParams.set('highlight', searchQuery.trim());
      }
      router.push(url.pathname + url.search);
      closeSearchModal();
    }
  }, [router, closeSearchModal, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const value: SearchContextType = {
    searchQuery,
    searchResults,
    isSearching,
    isSearchModalOpen,
    setSearchQuery: handleSetSearchQuery,
    performSearch,
    openSearchModal,
    closeSearchModal,
    navigateToResult,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
