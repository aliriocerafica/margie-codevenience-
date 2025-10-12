"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Card, CardBody, CardHeader, Input, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Camera, ScanLine, Package, AlertCircle, CheckCircle, X, RotateCcw } from "lucide-react";
import { usePageHighlight } from "@/hooks/usePageHighlight";
import { PageHeader } from "@/components/ui/PageHeader";
import { SAMPLE_PRODUCTS } from "@/lib/constants";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

interface ScannedProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode?: string;
  image?: string;
}

const ScanQR = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedCode, setScannedCode] = useState("");
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [error, setError] = useState("");
  const [recentScans, setRecentScans] = useState<ScannedProduct[]>([]);
  const [lastDecoded, setLastDecoded] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const lastResultRef = useRef<string>("");
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const hasScannedRef = useRef(false); // Prevent duplicate scans
  const isProcessingRef = useRef(false); // Track processing state

  // Enable page highlighting for search results
  usePageHighlight();

  // Load recent scans from localStorage on mount
  useEffect(() => {
    const savedRecentScans = localStorage.getItem('recentScans');
    if (savedRecentScans) {
      try {
        const parsed = JSON.parse(savedRecentScans);
        if (Array.isArray(parsed)) {
          setRecentScans(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved recent scans:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Check if device supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera not supported on this device");
      setHasPermission(false);
    }

    return () => {
      stopCamera();
    };
  }, []);

  // No extra play() here to avoid race conditions with stream assignment

  // Start ZXing decode when camera is running
  useEffect(() => {
    if (!isScanning || !videoRef.current) {
      return;
    }

    // Initialize reader with hints (optimize for grocery barcodes + QR)
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
      BarcodeFormat.EAN_8,
    ]);

    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 150,
      delayBetweenScanSuccess: 800,
    });
    zxingReaderRef.current = reader;

    lastResultRef.current = "";
    hasScannedRef.current = false; // Reset scan flag
    isProcessingRef.current = false;

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
      if (controls && !zxingControlsRef.current) {
        zxingControlsRef.current = controls;
      }
      // Only process if not already scanned and not processing
      if (result && !hasScannedRef.current && !isProcessingRef.current) {
        const text = result.getText();
        if (text && text !== lastResultRef.current) {
          lastResultRef.current = text;
          hasScannedRef.current = true; // Mark as scanned immediately
          isProcessingRef.current = true;
          console.log("[ZXING] Decoded:", text);
          setLastDecoded(text);
          
          // Stop scanner immediately after successful scan
          try {
            controls?.stop();
          } catch {}
          
          processScannedCode(text);
          // Fire-and-forget server log so it appears in dev terminal
          try {
            fetch("/api/scan-log", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: text, meta: { ts: Date.now() } })
            }).catch(() => {});
          } catch {}
        }
      }
      // Ignore decode errors; library will continue scanning
    }).catch(e => {
      console.error("ZXing init failed:", e);
      setError("Scanner failed to start. Try again.");
    });

    return () => {
      try {
        zxingControlsRef.current?.stop();
      } catch {}
      zxingControlsRef.current = null;
      zxingReaderRef.current = null;
    };
  }, [isScanning]);

  const startCamera = async () => {
    try {
      setError("");
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported on this device/browser");
      }

      // iOS Safari specific constraints
      const constraints = {
        video: {
          facingMode: "environment", // Use back camera
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          // iOS Safari sometimes needs these
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30, max: 30 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Store the stream first
      streamRef.current = stream;
      setHasPermission(true);
      setIsScanning(true);
      
      // Wait for video element to be ready and assign stream
      const assignStreamToVideo = () => {
        if (videoRef.current) {
          const video = videoRef.current;
          try { video.pause(); } catch {}
          if (video.srcObject !== stream) {
            video.srcObject = stream;
          }
          
          // Add essential error handling
          video.onerror = (e) => {
            console.error("Video error:", e);
            setError("Video display error. Please try again.");
          };
          
          // Play once metadata is ready
          video.onloadedmetadata = () => {
            video.play().catch(e => {
              console.error("Video play failed:", e);
              setError("Could not start video playback. Please try again.");
            });
          };
        } else {
          // Retry after a short delay
          setTimeout(assignStreamToVideo, 100);
        }
      };
      
      // Start the assignment process
      assignStreamToVideo();
    } catch (err: any) {
      console.error("Camera access failed:", err);
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        constraint: err.constraint
      });
      
      let errorMessage = "Camera access failed";
      
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access in Safari settings and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found. Make sure your device has a camera.";
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Camera not supported on this browser. Try using Safari or Chrome.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is being used by another app. Close other camera apps and try again.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Camera constraints not supported. Trying with basic settings...";
        // Try with simpler constraints
        setTimeout(() => startCameraFallback(), 1000);
        return;
      } else if (err.message && err.message.includes("not supported")) {
        errorMessage = "Camera API not supported. Make sure you're using HTTPS.";
      } else if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errorMessage = "Camera requires HTTPS. Please use https:// in the URL.";
      }
      
      setError(errorMessage);
      setHasPermission(false);
    }
  };

  const startCameraFallback = async () => {
    try {
      // Very basic constraints for maximum compatibility
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true // Just request any camera
      });
      
      if (videoRef.current) {
        const video = videoRef.current;
        try { video.pause(); } catch {}
        video.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setIsScanning(true);
        setError("");
        
        video.onloadedmetadata = () => {
          video.play().catch(e => {
            console.error("Fallback video play failed:", e);
            setError("Could not start video playback. Please try again.");
          });
        };
      }
    } catch (err: any) {
      console.error("Fallback camera also failed:", err);
      setError("Camera not available. Please check permissions and try again.");
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    try {
      zxingControlsRef.current?.stop();
    } catch {}
    zxingControlsRef.current = null;
    zxingReaderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    // Reset scan flags
    hasScannedRef.current = false;
    isProcessingRef.current = false;
    lastResultRef.current = "";
    setIsScanning(false);
  };


  const handleManualInput = (code: string) => {
    setScannedCode(code);
    if (code.trim()) {
      processScannedCode(code.trim());
    }
  };

  const processScannedCode = async (code: string) => {
    console.log("[SCAN] Processing code:", code);
    try {
      const res = await fetch(`/api/products/by-barcode?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Lookup failed ${res.status}`);
      const data = await res.json();
      if (data?.found && data.product) {
        const p = data.product;
        const product: ScannedProduct = {
          id: p.id,
          name: p.name,
          price: parseFloat(String(p.price).replace('$','')),
          stock: parseInt(String(p.stock), 10) || 0,
          category: p.category?.name || 'Unknown',
          barcode: p.barcode || code,
          image: p.imageUrl || undefined,
        };
        setScannedProduct(product);
        const newRecentScans = [product, ...recentScans.slice(0, 4)];
        setRecentScans(newRecentScans);
        localStorage.setItem('recentScans', JSON.stringify(newRecentScans));
        setError("");
        setIsProductModalOpen(true);
        
        // Stop scanner to prevent duplicate scans
        try {
          zxingControlsRef.current?.stop();
        } catch {}
      } else {
        setError(`Product not found for code: ${code}`);
        setScannedProduct(null);
        // Reset processing flag to allow retry
        isProcessingRef.current = false;
        hasScannedRef.current = false;
      }
    } catch (e) {
      console.error(e);
      setError('Lookup failed. Please try again.');
      setScannedProduct(null);
      // Reset processing flag to allow retry
      isProcessingRef.current = false;
      hasScannedRef.current = false;
    }
  };

  const clearRecentScans = () => {
    setRecentScans([]);
    localStorage.removeItem('recentScans');
  };

  const resetScan = () => {
    setScannedCode("");
    setScannedProduct(null);
    setError("");
    setIsProductModalOpen(false);
    
    // Reset scan flags
    hasScannedRef.current = false;
    isProcessingRef.current = false;
    lastResultRef.current = "";
    
    // Restart scanner if it was running
    if (isScanning) {
      // Small delay to ensure scanner is properly reset
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          try {
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [
              BarcodeFormat.QR_CODE,
              BarcodeFormat.EAN_13,
              BarcodeFormat.UPC_A,
              BarcodeFormat.EAN_8,
            ]);
            const newReader = new BrowserMultiFormatReader(hints, {
              delayBetweenScanAttempts: 150,
              delayBetweenScanSuccess: 800,
            });
            zxingReaderRef.current = newReader;
            hasScannedRef.current = false;
            isProcessingRef.current = false;
            lastResultRef.current = "";
            
            newReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
              if (controls && !zxingControlsRef.current) {
                zxingControlsRef.current = controls;
              }
              // Only process if not already scanned and not processing
              if (result && !hasScannedRef.current && !isProcessingRef.current) {
                const text = result.getText();
                if (text && text !== lastResultRef.current) {
                  lastResultRef.current = text;
                  hasScannedRef.current = true;
                  isProcessingRef.current = true;
                  console.log("[ZXING] Decoded:", text);
                  setLastDecoded(text);
                  
                  // Stop scanner immediately after successful scan
                  try {
                    controls?.stop();
                  } catch {}
                  
                  processScannedCode(text);
                  try {
                    fetch("/api/scan-log", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ code: text, meta: { ts: Date.now() } })
                    }).catch(() => {});
                  } catch {}
                }
              }
            }).catch(e => {
              console.error("ZXing restart failed:", e);
            });
          } catch (e) {
            console.error("Failed to restart scanner:", e);
          }
        }
      }, 100);
    }
  };

  const showNotification = ({ title, description, type }: { title: string; description: string; type: 'success' | 'error' }) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${type === 'success'
      ? 'bg-green-50 border border-green-200 text-green-800'
      : 'bg-red-50 border border-red-200 text-red-800'
      }`;

    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          ${type === 'success'
        ? '<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
        : '<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
      }
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-sm">${title}</h4>
          <p class="text-sm mt-1">${description}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  };

  const handleAddToInventory = () => {
    if (scannedProduct) {
      // Add to ScannedList via localStorage
      const existingItems = JSON.parse(localStorage.getItem('scannedItems') || '[]');
      const existingItem = existingItems.find((item: any) => item.id === scannedProduct.id);
      
      let newItems;
      if (existingItem) {
        // Increment quantity if item already exists
        newItems = existingItems.map((item: any) => 
          item.id === scannedProduct.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        newItems = [
          ...existingItems,
          {
            id: scannedProduct.id,
            name: scannedProduct.name,
            barcode: scannedProduct.barcode || scannedProduct.id,
            price: scannedProduct.price,
            quantity: 1,
            status: scannedProduct.stock > 0 ? 'available' : 'out_of_stock'
          }
        ];
      }
      
      localStorage.setItem('scannedItems', JSON.stringify(newItems));
      
      // Close modal and reset scan
      setIsProductModalOpen(false);
      resetScan();
      
      // Show success notification
      showNotification({
        title: "Product Added to Checkout",
        description: `"${scannedProduct.name}" has been added to your checkout list.`,
        type: "success"
      });
    }
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Camera Section */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5 text-[#003366] dark:text-[#4A90E2]" />
              Camera Scanner
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            {/* Always show the scanner frame with camera or placeholder */}
            <div className="relative h-80 bg-black rounded-lg overflow-hidden">
              {/* Camera Video or Placeholder */}
              {isScanning ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: '#000'
                  }}
                  className="w-full h-full object-cover bg-black"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <ScanLine className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-300 text-lg font-medium">Camera View</p>
                    <p className="text-gray-400 text-sm mt-1">Press start to begin scanning</p>
                  </div>
                </div>
              )}
              
              {/* Scanner Overlay Frame - Always Visible */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Scanner Target Frame */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56">
                  <div className="w-full h-full border-2 border-white rounded-lg relative">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#4A90E2] rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#4A90E2] rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#4A90E2] rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#4A90E2] rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    {isScanning && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#4A90E2] to-transparent animate-pulse"></div>
                    )}
                  </div>
                </div>
                
                {/* Status text */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                    {isScanning ? "🎯 Scanning for codes..." : "📱 Ready to scan"}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Camera Controls */}
            <div className="p-4 space-y-3">
              {typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Camera requires HTTPS. For mobile testing, use <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">https://</code> or localhost.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  {!isScanning ? (
                    <Button
                      color="primary"
                      onClick={startCamera}
                      startContent={<Camera className="h-4 w-4" />}
                      className="flex-1 bg-[#003366] hover:bg-[#004488]"
                    >
                      Start Camera
                    </Button>
                  ) : (
                    <Button
                      variant="flat"
                      onClick={stopCamera}
                      startContent={<X className="h-4 w-4" />}
                      className="flex-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                    >
                      Stop Camera
                    </Button>
                  )}
                  
                  <Button
                    isIconOnly
                    variant="flat"
                    onClick={resetScan}
                    title="Reset scan"
                    className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-2">
                    ❌ {error}
                  </p>
                  {error.includes("permission") && (
                    <div className="text-red-700 dark:text-red-300 text-xs space-y-1">
                      <p><strong>iPhone/Safari:</strong></p>
                      <p>• Allow camera permission when prompted</p>
                      <p>• Check Settings → Safari → Camera</p>
                      <p>• Make sure URL starts with https://</p>
                    </div>
                  )}
                </div>
              )}
              
              {hasPermission === false && !error && (
                <div className="text-center">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    Camera permission required to scan codes
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Manual Input */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold">Manual Entry</h3>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2">
              <Input
                placeholder="Enter barcode or product ID"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualInput(scannedCode)}
                className="flex-1"
              />
              <Button
                color="primary"
                onClick={() => handleManualInput(scannedCode)}
                className="bg-[#003366] hover:bg-[#004488]"
              >
                Search
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <CardBody>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={resetScan}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        )}


        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-semibold">Recent Scans</h3>
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  onClick={clearRecentScans}
                  className="text-gray-500 hover:text-gray-700"
                  title="Clear recent scans"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {recentScans.map((product, index) => (
                  <div 
                    key={`${product.id}-${index}`}
                    className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded border border-gray-200 dark:border-gray-700"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        ${product.price.toFixed(2)} • Stock: {product.stock}
                      </p>
                    </div>
                    <Chip size="sm" variant="flat" color="default" className="text-xs">
                      {product.category}
                    </Chip>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Product Found Modal */}
        <Modal 
          isOpen={isProductModalOpen} 
          onClose={() => setIsProductModalOpen(false)} 
          size="md"
          backdrop="blur"
          classNames={{
            backdrop: "bg-black/50 backdrop-blur-sm",
            base: "border-none",
            header: "border-b border-gray-200 dark:border-gray-700",
            footer: "border-t border-gray-200 dark:border-gray-700",
            closeButton: "hover:bg-gray-100 dark:hover:bg-gray-800",
          }}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold text-green-700 dark:text-green-300">Product Found</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                Scanned product details and actions
              </p>
            </ModalHeader>
            <ModalBody className="py-6">
              {scannedProduct && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    {scannedProduct.image && (
                      <img 
                        src={scannedProduct.image} 
                        alt={scannedProduct.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {scannedProduct.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {scannedProduct.id}
                      </p>
                      <Chip size="sm" variant="flat" color="primary">
                        {scannedProduct.category}
                      </Chip>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Price:</span>
                      <p className="font-semibold">${scannedProduct.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                      <p className="font-semibold">{scannedProduct.stock} units</p>
                    </div>
                  </div>

                </div>
              )}
            </ModalBody>
            <ModalFooter className="flex gap-2">
              <Button
                variant="flat"
                onClick={resetScan}
                startContent={<RotateCcw className="h-4 w-4" />}
                className="flex-1"
              >
                Scan Next
              </Button>
              <Button
                color="primary"
                onClick={handleAddToInventory}
                startContent={<Package className="h-4 w-4" />}
                className="flex-1 bg-[#003366] hover:bg-[#004488]"
              >
                Add to Checkout
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default ScanQR;
