
"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertTriangle } from 'lucide-react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';

interface QRCodeScannerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onScan: (result: string) => void;
}

export function QRCodeScanner({ isOpen, onOpenChange, onScan }: QRCodeScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const warmupStartRef = useRef<number | null>(null);
  const lastDataRef = useRef<string | null>(null);
  const stableCountRef = useRef<number>(0);
  const lastAcceptedDataRef = useRef<string | null>(null);
  const lastAcceptTsRef = useRef<number>(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const getCameraPermission = async () => {
      if (!isOpen) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          // reset detection stability state each time modal opens
          warmupStartRef.current = performance.now();
          lastDataRef.current = null;
          stableCountRef.current = 0;
          lastAcceptedDataRef.current = null;
          lastAcceptTsRef.current = 0;
          tick(); // Start scanning
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setScanError('Camera access denied. Please enable camera permissions in your browser settings.');
      }
    };
    
    const isLikelyEquipmentUrl = (value: string) => {
        try {
            const url = new URL(value);
            // Only accept URLs from the same origin and with expected path pattern
            if (typeof window !== 'undefined') {
                if (url.origin !== window.location.origin) return false;
            }
            const segments = url.pathname.split('/').filter(Boolean);
            // Expect: /equipment/{id}/edit
            if (segments.length !== 3) return false;
            if (segments[0] !== 'equipment') return false;
            if (segments[2] !== 'edit') return false;
            return true;
        } catch {
            return false;
        }
    };

    const tick = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                // Apply warm-up and stability validation to avoid false positives
                const now = performance.now();
                const warmedUp = warmupStartRef.current !== null && (now - warmupStartRef.current) > 800; // ~0.8s warm-up

                if (code && warmedUp && isLikelyEquipmentUrl(code.data)) {
                    if (lastDataRef.current === code.data) {
                        stableCountRef.current += 1;
                    } else {
                        lastDataRef.current = code.data;
                        stableCountRef.current = 1;
                    }

                    // Require the same content in a few consecutive frames to confirm
                    if (stableCountRef.current >= 3) {
                        const acceptCooldownMs = 1200;
                        const elapsedSinceAccept = now - lastAcceptTsRef.current;
                        const isNewData = lastAcceptedDataRef.current !== code.data;
                        const cooldownPassed = elapsedSinceAccept > acceptCooldownMs;
                        if (isNewData || cooldownPassed) {
                            onScan(code.data);
                            lastAcceptedDataRef.current = code.data;
                            lastAcceptTsRef.current = now;
                        }
                        // reset frame stability so we don't immediately trigger again
                        lastDataRef.current = null;
                        stableCountRef.current = 0;
                    }
                } else if (!code) {
                    // reset stability if nothing detected in this frame
                    lastDataRef.current = null;
                    stableCountRef.current = 0;
                }
            }
        }
        animationFrameId = requestAnimationFrame(tick);
    }

    if (isOpen) {
      getCameraPermission();
    }

    return () => {
      // Cleanup
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, onScan, onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Equipment QR Code</DialogTitle>
          <DialogDescription>
            Point your camera at the QR code on the equipment.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" muted autoPlay playsInline />
            {hasCameraPermission === false && (
               <Alert variant="destructive">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Camera Access Required</AlertTitle>
                 <AlertDescription>
                    {scanError || "Please allow camera access to use this feature."}
                 </AlertDescription>
               </Alert>
            )}
             {hasCameraPermission === null && (
                 <div className="text-center text-muted-foreground">
                    <Camera className="h-10 w-10 mx-auto mb-2" />
                    <p>Requesting camera permission...</p>
                 </div>
             )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
