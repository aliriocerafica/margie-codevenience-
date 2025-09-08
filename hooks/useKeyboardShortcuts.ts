"use client";

import { useEffect } from 'react';
import { useSearch } from '@/contexts/SearchContext';

export function useKeyboardShortcuts() {
  const { openSearchModal } = useSearch();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        openSearchModal();
      }

      // Cmd/Ctrl + / to open search (alternative)
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        openSearchModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openSearchModal]);
}
