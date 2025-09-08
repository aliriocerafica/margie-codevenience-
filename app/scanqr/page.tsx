"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Card, CardBody, CardHeader, Input, Chip } from "@heroui/react";
import { Camera, ScanLine, Package, AlertCircle, CheckCircle, X, RotateCcw } from "lucide-react";
import { usePageHighlight } from "@/hooks/usePageHighlight";
import { PageHeader } from "@/components/ui/PageHeader";
import { SAMPLE_PRODUCTS } from "@/lib/constants";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enable page highlighting for search results
  usePageHighlight();

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

  const startCamera = async () => {
    try {
      setError("");
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported on this device/browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error("Camera access denied:", err);
      let errorMessage = "Camera access failed";
      
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Camera not supported on this device/browser.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is being used by another app.";
      } else if (err.message && err.message.includes("not supported")) {
        errorMessage = "Camera API not supported. Try using HTTPS or a different browser.";
      } else if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errorMessage = "Camera requires HTTPS. Please use HTTPS or localhost.";
      }
      
      setError(errorMessage);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };


  const handleManualInput = (code: string) => {
    setScannedCode(code);
    if (code.trim()) {
      processScannedCode(code.trim());
    }
  };

  const processScannedCode = (code: string) => {
    // Simulate product lookup (replace with actual API call)
    const foundProduct = SAMPLE_PRODUCTS.find(p =>
      p.id.toString() === code ||
      p.name.toLowerCase().includes(code.toLowerCase()) ||
      code === `PROD${p.id}`
    );

    if (foundProduct) {
      const product: ScannedProduct = {
        id: foundProduct.id.toString(),
        name: foundProduct.name,
        price: parseFloat(foundProduct.price.replace('$', '')),
        stock: foundProduct.stock,
        category: foundProduct.category?.name || "Unknown",
        barcode: code,
        image: foundProduct.image
      };
      
      setScannedProduct(product);
      setRecentScans(prev => [product, ...prev.slice(0, 4)]); // Keep last 5 scans
      setError("");
    } else {
      setError(`Product not found for code: ${code}`);
      setScannedProduct(null);
    }
  };

  const resetScan = () => {
    setScannedCode("");
    setScannedProduct(null);
    setError("");
  };

  const handleAddToInventory = () => {
    if (scannedProduct) {
      // TODO: Implement add to inventory logic
      console.log("Adding to inventory:", scannedProduct);
      alert("Product would be added to inventory!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Camera Section */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#003366] dark:text-[#4A90E2]" />
                Camera Scanner
              </h3>
              {isScanning && (
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  onClick={stopCamera}
                  className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
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
                  className="w-full h-full object-cover"
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
              
              {hasPermission === false && (
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

        {/* Scanned Product Result */}
        {scannedProduct && (
          <Card className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Product Found
                </h3>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={resetScan}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
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

                <div className="flex gap-2 pt-2">
                  <Button
                    color="primary"
                    onClick={handleAddToInventory}
                    startContent={<Package className="h-4 w-4" />}
                    className="flex-1 bg-[#003366] hover:bg-[#004488]"
                  >
                    Add to Inventory
                  </Button>
                  <Button
                    variant="flat"
                    onClick={resetScan}
                    startContent={<RotateCcw className="h-4 w-4" />}
                  >
                    Scan Next
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <h3 className="text-lg font-semibold">Recent Scans</h3>
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
      </div>
    </div>
  );
};

export default ScanQR;
