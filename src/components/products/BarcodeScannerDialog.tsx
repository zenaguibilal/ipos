
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Camera, CameraOff } from 'lucide-react';

/**
 * @fileOverview Barcode Scanner (Fix: html5-qrcode dependency handling)
 */

export function BarcodeScannerDialog({ isOpen, onOpenChange, onScanSuccess }: BarcodeScannerDialogProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const scannerRef = useRef<any>(null); // Type 'any' used to avoid build-time issues if module not yet fully loaded
  const scannerId = "barcode-scanner-viewport";

  useEffect(() => {
    if (isOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          stream.getTracks().forEach(track => track.stop());
          
          // Dynamic import to avoid SSR errors and ensure package presence
          const { Html5Qrcode } = await import('html5-qrcode');
          startScanner(Html5Qrcode);
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast.error('Accès caméra refusé', {
            description: 'Veuillez autoriser l\'accès à la caméra dans les réglages de votre navigateur.'
          });
        }
      };
      getCameraPermission();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async (Html5QrcodeClass: any) => {
    try {
      if (scannerRef.current) await scannerRef.current.stop();
      
      const html5QrCode = new Html5QrcodeClass(scannerId);
      scannerRef.current = html5QrCode;
      
      const config = { fps: 10, qrbox: { width: 250, height: 150 } };
      
      await html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText: string) => {
          onScanSuccess(decodedText);
          onOpenChange(false);
        },
        () => {} // silent ignore scan failures
      );
      setIsScannerReady(true);
    } catch (err) {
      console.error("Scanner start error:", err);
      setIsScannerReady(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Scanner stop error:", err);
      }
    }
    setIsScannerReady(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md luxury-glass border-primary/20 p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-primary/5 border-b border-white/5">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scanner un Code-barres
          </DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase opacity-60">
            Interface de reconnaissance optique iPOS.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video bg-black/40 flex items-center justify-center">
          <div id={scannerId} className="w-full h-full"></div>
          
          {!isScannerReady && hasCameraPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Initialisation Optique...</p>
            </div>
          )}

          {hasCameraPermission === false && (
            <div className="absolute inset-0 p-8 flex items-center justify-center bg-background/90 backdrop-blur-xl">
              <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5">
                <CameraOff className="h-5 w-5" />
                <AlertTitle className="font-black uppercase text-xs tracking-tighter">Accès Caméra Requis</AlertTitle>
                <AlertDescription className="text-[10px] uppercase font-bold opacity-70">
                  Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité souveraine.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-white/5 border-t border-white/5">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-10 w-full sm:w-auto">
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BarcodeScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (barcode: string) => void;
}
