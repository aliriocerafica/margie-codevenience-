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
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Camera access denied. Please allow camera permission.");
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
          <CardBody>
            {!isScanning ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <ScanLine className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start camera to scan QR codes or barcodes
                </p>
                <Button
                  color="primary"
                  onClick={startCamera}
                  startContent={<Camera className="h-4 w-4" />}
                  className="bg-[#003366] hover:bg-[#004488]"
                >
                  Start Camera
                </Button>
                {hasPermission === false && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                    Camera permission required
                  </p>
                )}
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover rounded-lg bg-black"
                />
                <div className="absolute inset-0 border-2 border-[#003366] rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                    <div className="w-full h-full border-2 border-[#003366] rounded-lg animate-pulse opacity-75"></div>
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#003366]"></div>
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#003366]"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#003366]"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#003366]"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  Position code within frame
                </div>
              </div>
            )}
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
