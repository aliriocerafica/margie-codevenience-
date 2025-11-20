"use client";

import React, { useState, useEffect } from "react";
import { Spinner } from "@heroui/react";

interface SplashScreenProps {
  autoHide?: boolean;
  minDisplayTime?: number;
}

export default function SplashScreen({ 
  autoHide = true, 
  minDisplayTime = 1500 
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    if (!autoHide) {
      // If autoHide is false, keep it visible (for login loading state)
      return;
    }

    // Check if splash screen has already been shown in this session
    const splashShown = sessionStorage.getItem("splashShown");
    
    if (splashShown === "true") {
      // Already shown, don't show again
      setIsMounted(false);
      return;
    }

    // Mark as shown
    sessionStorage.setItem("splashShown", "true");

    // Hide splash screen after minimum display time
    const minDisplayTimeOut = setTimeout(() => {
      setIsVisible(false);
    }, minDisplayTime);

    // Remove from DOM after fade out animation
    const removeTimeout = setTimeout(() => {
      setIsMounted(false);
    }, minDisplayTime + 500);

    return () => {
      clearTimeout(minDisplayTimeOut);
      clearTimeout(removeTimeout);
    };
  }, [autoHide, minDisplayTime]);

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-[#003366] via-[#004488] to-[#003366] flex flex-col items-center justify-center transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Logo */}
      <div className="mb-8 animate-pulse">
        <img
          src="/LogoWhite.png"
          alt="Margie CodeVenience Logo"
          className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain drop-shadow-2xl"
        />
      </div>

      {/* Company Name */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg font-poppins animate-fade-in">
        Margie CodeVenience
      </h1>

      {/* Tagline */}
      <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-medium text-white/90 drop-shadow-sm font-poppins mb-8">
        <span>Scan</span>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <span>Track</span>
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span>Control</span>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      </div>

      {/* Loading Spinner */}
      <div className="flex flex-col items-center gap-4">
        <Spinner 
          size="lg" 
          color="primary"
          classNames={{
            circle1: "border-b-white",
            circle2: "border-b-white",
            wrapper: "w-12 h-12",
          }}
        />
        <p className="text-white/80 text-sm sm:text-base font-medium animate-pulse">
          Loading...
        </p>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}

