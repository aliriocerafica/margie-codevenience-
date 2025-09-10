"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card } from '@heroui/card';
import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeSwitch } from './ThemeSwitch';

export default function FloatingTopNav() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Trigger a soft refresh first (Next.js router refresh)
      router.refresh();
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Dispatch a custom refresh event for components to listen to
      window.dispatchEvent(new CustomEvent('pageRefresh'));
      
      // For SWR-based components, trigger a global revalidation
      if (typeof window !== 'undefined' && (window as any).swr) {
        // If SWR is available, revalidate all data
        (window as any).swr.mutate();
      }
      
    } catch (error) {
      console.log('Refresh completed');
    } finally {
      // Reset the refreshing state
      setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }
  };

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null;
  }

  // Only render on desktop
  if (!isDesktop) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-visible">
        <div className="flex items-center gap-1 p-2">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-center w-8 h-8">
            <ThemeSwitch />
          </div>

          {/* Refresh Button */}
          <Button
            variant="flat"
            isIconOnly
            onClick={(e) => {
              // Ctrl+Click or Cmd+Click for hard refresh
              if (e.ctrlKey || e.metaKey) {
                window.location.reload();
              } else {
                handleRefresh();
              }
            }}
            isLoading={isRefreshing}
            className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 w-8 h-8 min-w-8"
            size="sm"
            title="Refresh page (Ctrl+Click for hard refresh)"
          >
            {!isRefreshing && <RotateCcw className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
