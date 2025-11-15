"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Types for searchable content
export interface SearchableItem {
  id: string;
  title: string;
  description?: string;
  type: 'page' | 'product' | 'category' | 'user' | 'order';
  url?: string;
  metadata?: Record<string, any>;
}

// Base static items (pages)
const staticPages: SearchableItem[] = [
  // Pages
  { id: 'dashboard', title: 'Dashboard', description: 'Main dashboard overview', type: 'page', url: '/dashboard' },
  { id: 'products', title: 'Products', description: 'Product management', type: 'page', url: '/product' },
  { id: 'categories', title: 'Categories', description: 'Category management', type: 'page', url: '/category' },
  { id: 'users', title: 'Users', description: 'Manage application users', type: 'page', url: '/users' },
  { id: 'scan-qr', title: 'Scan QR', description: 'Scan product QR codes', type: 'page', url: '/scanqr' },
  { id: 'scanned-list', title: 'Scanned List', description: 'Point of Sale scanned items', type: 'page', url: '/ScannedList' },
  { id: 'calendar', title: 'Calendar', description: 'Schedule and events', type: 'page', url: '/calendar' },
  { id: 'suppliers', title: 'Suppliers', description: 'Manage suppliers', type: 'page', url: '/suppliers' },
  { id: 'reports', title: 'Reports', description: 'View business reports', type: 'page', url: '/reports' },
  { id: 'profile', title: 'Profile', description: 'User profile and settings', type: 'page', url: '/profile' },
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
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const debounceRef = useRef<number | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const performSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce 300ms
    debounceRef.current = window.setTimeout(async () => {
      const q = query.trim().toLowerCase();
      if (!q) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      // cancel in-flight
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Get current user role (may have changed)
      const currentUserRole = (session as any)?.user?.role;
      const currentIsStaff = currentUserRole === 'Staff';

      try {
        // Only fetch products, categories, and users for Admin users
        const fetchPromises: Promise<Response>[] = [];
        if (!currentIsStaff) {
          fetchPromises.push(
            fetch('/api/product', { signal: controller.signal }),
            fetch('/api/category', { signal: controller.signal }),
            fetch('/api/users', { signal: controller.signal })
          );
        }
        
        const settledResults = await Promise.allSettled(fetchPromises);
        const [productsRes, categoriesRes, usersRes] = currentIsStaff 
          ? [null, null, null] 
          : [
              settledResults[0] || null,
              settledResults[1] || null,
              settledResults[2] || null,
            ];

        // Filter static pages based on user role
        const allowedStaticPages = currentIsStaff
          ? staticPages.filter(page => 
              ['scan-qr', 'scanned-list'].includes(page.id)
            )
          : currentUserRole === 'Admin'
          ? staticPages // Admins see all pages
          : staticPages.filter(page => 
              !['dashboard', 'products', 'categories', 'users', 'reports'].includes(page.id)
            );

        const results: SearchableItem[] = [...allowedStaticPages];

        // Only add products, categories, and users for Admin users
        if (!currentIsStaff) {
          if (productsRes && productsRes.status === 'fulfilled' && productsRes.value.ok) {
            const products = await productsRes.value.json();
            if (Array.isArray(products)) {
              for (const p of products) {
                const title = String(p.name ?? '').trim();
                const category = String(p.category?.name ?? '').trim();
                if (!title) continue;
                results.push({
                  id: String(p.id ?? title),
                  title,
                  description: category ? `Category: ${category}` : undefined,
                  type: 'product',
                  url: '/product',
                  metadata: { price: p.price, category },
                });
              }
            }
          }

          if (categoriesRes && categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
            const categories = await categoriesRes.value.json();
            if (Array.isArray(categories)) {
              for (const c of categories) {
                const title = String(c.name ?? '').trim();
                if (!title) continue;
                results.push({
                  id: String(c.id ?? title),
                  title,
                  description: `Products: ${c.productCount ?? 0}`,
                  type: 'category',
                  url: '/category',
                });
              }
            }
          }

          if (usersRes && usersRes.status === 'fulfilled' && usersRes.value.ok) {
            const users = await usersRes.value.json();
            if (Array.isArray(users)) {
              for (const u of users) {
                const title = String(u.email ?? '').trim();
                if (!title) continue;
                results.push({
                  id: String(u.id ?? title),
                  title,
                  description: `Role: ${u.role ?? ''}`,
                  type: 'user',
                  url: '/users',
                });
              }
            }
          }
        }

        // filter by query across title/description/type
        const filtered = results.filter(item =>
          item.title.toLowerCase().includes(q) ||
          (item.description?.toLowerCase() ?? '').includes(q) ||
          item.type.toLowerCase().includes(q)
        );

        setSearchResults(filtered);
      } catch (_) {
        // ignore errors on abort or fetch failures; show no results
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [session]);

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
