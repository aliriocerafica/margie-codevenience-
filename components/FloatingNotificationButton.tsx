"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@heroui/button';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

export default function FloatingNotificationButton() {
  const [isMounted, setIsMounted] = useState(false);
  const { unreadCount, isNotificationOpen, openNotification, closeNotification } = useNotifications();
  const isPointerDownRef = useRef(false);
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const movedRef = useRef(false);

  // Draggable position (left/top in pixels)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // Always reset to default bottom-right position on page load/refresh
    if (typeof window !== 'undefined') {
      const gap = 24; // Increased gap for better spacing
      const btnSize = 56;
      const initialX = Math.max(gap, window.innerWidth - gap - btnSize);
      const initialY = Math.max(gap, window.innerHeight - gap - btnSize);
      setPosition({ x: initialX, y: initialY });
    }
  }, []);

  // Reset position when viewport changes (desktop to mobile or vice versa)
  useEffect(() => {
    if (!isMounted) return;

    const handleResize = () => {
      const gap = 24; // Increased gap for better spacing
      const btnSize = 56;
      const newX = Math.max(gap, window.innerWidth - gap - btnSize);
      const newY = Math.max(gap, window.innerHeight - gap - btnSize);
      setPosition({ x: newX, y: newY });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMounted]);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null;
  }

  // Guard until mounted and position known
  if (!isMounted || !position) {
    return null;
  }

  const clampToViewport = (x: number, y: number) => {
    const btnSize = 56;
    const margin = 24; // Same gap as default position
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const maxX = Math.max(0, viewportWidth - btnSize - margin);
    const maxY = Math.max(0, viewportHeight - btnSize - margin);
    return {
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(margin, y), maxY),
    };
  };

  const beginPointer = (clientX: number, clientY: number) => {
    isPointerDownRef.current = true;
    movedRef.current = false;
    startRef.current = { x: clientX - position.x, y: clientY - position.y };
  };

  const movePointer = (clientX: number, clientY: number) => {
    if (!isPointerDownRef.current) return;
    const next = clampToViewport(clientX - startRef.current.x, clientY - startRef.current.y);
    setPosition(next);
    movedRef.current = true;
  };

  const endPointer = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    // Don't persist position - it will reset on page refresh
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Enable drag on mobile/desktop; ignore right-click
    if (e.button !== 0) return;
    beginPointer(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => movePointer(e.clientX, e.clientY);
  const handleMouseUp = () => endPointer();

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    beginPointer(t.clientX, t.clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    movePointer(t.clientX, t.clientY);
  };
  const handleTouchEnd = () => endPointer();

  const onClickButton = () => {
    // If user was dragging, do not open
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    openNotification();
  };

  return (
    <>
      {/* Floating Notification Button */}
      <div
        className="fixed z-50 pointer-events-auto"
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          transform: 'translateZ(0)' // Force hardware acceleration
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative">
          <Button
            variant="shadow"
            isIconOnly
            onClick={onClickButton}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
              unreadCount > 0 ? 'animate-pulse' : ''
            }`}
            size="lg"
            title="Notifications"
          >
            <Bell className={`h-6 w-6 transition-transform duration-200 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center min-w-6 text-[11px] font-bold z-10 shadow-md animate-in slide-in-from-top-1 fade-in-0 duration-300 hover:scale-110 transition-transform">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
      
      {/* Notification Dropdown */}
      <NotificationDropdown 
        isOpen={isNotificationOpen} 
        onClose={closeNotification}
        anchor={position}
      />
    </>
  );
}
