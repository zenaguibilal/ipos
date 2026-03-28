
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
 * @fileOverview Barcode Scanner (Dynamic Import Protection)
 * يضمن تشغيل ماسح الأكواد في بيئة العميل فقط مع الحماية من أخطاء الـ SSR.
 */

export function BarcodeScannerDialog({ isOpen, onOpenChange, onScanSuccess }: BarcodeScannerDialogProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerId = "barcode-scanner-viewport";

  useEffect(() => {
    if (isOpen) {
      const initScanner = async () => {
        try {
          // Request permissions first
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          stream.getTracks().forEach(track => track.stop());
          
          // Dynamically import library to ensure client-side only
          const { Html5Qrcode } = await import('html5-qrcode');
          startScanner(Html5Qrcode);
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast.error('Accès caméra refusé', {
            description: 'Veuillez autoriser l\'accès à la caméra pour scanner les articles.'
          });
        }
      };
      initScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async (Html5QrcodeClass: any) => {
    try {
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch(e) {}
      }
      
      const html5QrCode = new Html5QrcodeClass(scannerId);
      scannerRef.current = html5QrCode;
      
      const config = { 
        fps: 15, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.777778
      };
      
      await html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText: string) => {
          onScanSuccess(decodedText);
          onOpenChange(false);
        },
        () => {} // Silent catch scan misses
      );
      setIsScannerReady(true);
    } catch (err) {
      console.error("Scanner start error:", err);
      setIsScannerReady(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
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
          <DialogTitle className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-primary" />
            Scanner iPOS
          </DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase opacity-60">
            Reconnaissance optique des codes-barres articles.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video bg-black/40 flex items-center justify-center">
          <div id={scannerId} className="w-full h-full"></div>
          
          {!isScannerReady && hasCameraPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Activation du Capteur...</p>
            </div>
          )}

          {hasCameraPermission === false && (
            <div className="absolute inset-0 p-8 flex items-center justify-center bg-background/90 backdrop-blur-xl">
              <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5 max-w-xs">
                <CameraOff className="h-5 w-5" />
                <AlertTitle className="font-black uppercase text-xs">Accès Bloqué</AlertTitle>
                <AlertDescription className="text-[10px] uppercase font-bold opacity-70">
                  La caméra est indispensable pour la reconnaissance optique.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-white/5 border-t border-white/5">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-10 w-full sm:w-auto">
            Fermer
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
