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
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import { Loader2, Camera, CameraOff } from 'lucide-react';

interface BarcodeScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (barcode: string) => void;
}

export function BarcodeScannerDialog({ isOpen, onOpenChange, onScanSuccess }: BarcodeScannerDialogProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "barcode-scanner-viewport";

  useEffect(() => {
    if (isOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          // Stop stream immediately, html5-qrcode will manage its own stream
          stream.getTracks().forEach(track => track.stop());
          startScanner();
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

  const startScanner = async () => {
    try {
      if (scannerRef.current) await scannerRef.current.stop();
      
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;
      
      const config = { fps: 10, qrbox: { width: 250, height: 150 } };
      
      await html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scanner un Code-barres
          </DialogTitle>
          <DialogDescription>
            Placez le code-barres du produit au centre du cadre pour le scanner automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
          <div id={scannerId} className="w-full h-full"></div>
          
          {!isScannerReady && hasCameraPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Initialisation de la caméra...</p>
            </div>
          )}

          {hasCameraPermission === false && (
            <div className="absolute inset-0 p-4 flex items-center justify-center">
              <Alert variant="destructive">
                <CameraOff className="h-4 w-4" />
                <AlertTitle>Accès Caméra Requis</AlertTitle>
                <AlertDescription>
                  Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
