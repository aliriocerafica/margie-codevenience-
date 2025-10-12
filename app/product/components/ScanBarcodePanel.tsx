"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { ScanLine } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

interface ScanBarcodePanelProps {
  onResult: (payload: { code: string }) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export default function ScanBarcodePanel({ onResult, onClose, isProcessing = false }: ScanBarcodePanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<any>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const hasScannedRef = useRef(false); // Track if already scanned

  useEffect(() => {
    let controls: any;
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.UPC_A, BarcodeFormat.EAN_8]);
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150, delayBetweenScanSuccess: 800 });

    setRunning(true);
    reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, err, c) => {
      if (c && !controls) {
        controls = c;
        controlsRef.current = c;
      }
      // Only process if not already processing AND haven't scanned yet
      if (result && !isProcessing && !hasScannedRef.current) {
        const text = result.getText();
        if (text) {
          hasScannedRef.current = true; // Mark as scanned immediately
          onResult({ code: text });
          // Stop scanner immediately after successful scan
          try { controls?.stop(); } catch {}
        }
      }
    }).catch(e => {
      console.error(e);
      setError("Unable to start scanner");
      setRunning(false);
    });

    return () => {
      try { controls?.stop(); } catch {}
      setRunning(false);
    };
  }, [onResult, isProcessing]);

  // Stop scanner when processing starts
  useEffect(() => {
    if (isProcessing && controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch {}
    }
  }, [isProcessing]);

  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <CardHeader className="flex items-center gap-2">
        <ScanLine className="h-5 w-5 text-[#003366] dark:text-[#4A90E2]" />
        <span className="font-semibold">Scan barcode</span>
      </CardHeader>
      <CardBody>
        <div className="relative h-64 bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-white rounded" />
          </div>
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white/90 dark:bg-gray-800 rounded-lg p-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#003366]"></div>
                <span className="text-sm font-medium">Processing barcode...</span>
              </div>
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </CardBody>
    </Card>
  );
}


