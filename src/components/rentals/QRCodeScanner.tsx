
"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertTriangle } from 'lucide-react';
import jsQR from '@/lib/jsqr';

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
          tick(); // Start scanning
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setScanError('Camera access denied. Please enable camera permissions in your browser settings.');
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
    
                if (code) {
                    onScan(code.data);
                    onOpenChange(false); // Close dialog on successful scan
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
