
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
 * @fileOverview Barcode Scanner (Sovereign Guarded Edition)
 * يضمن تشغيل ماسح الأكواد في بيئة العميل فقط مع الحماية القصوى من أخطاء الـ SSR.
 */

export function BarcodeScannerDialog({ isOpen, onOpenChange, onScanSuccess }: BarcodeScannerDialogProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerId = "barcode-scanner-viewport";

  useEffect(() => {
    let html5QrCode: any = null;

    if (isOpen) {
      const initScanner = async () => {
        try {
          // Request permissions
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          stream.getTracks().forEach(track => track.stop());
          
          // Dynamic import to avoid SSR errors with library
          const { Html5Qrcode } = await import('html5-qrcode');
          
          html5QrCode = new Html5Qrcode(scannerId);
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
            () => {} // Silent catch for frame misses
          );
          setIsScannerReady(true);
        } catch (error) {
          console.error('Scanner initialization failed:', error);
          setHasCameraPermission(false);
          toast.error('Échec du capteur optique', {
            description: 'Vérifiez les permissions de votre caméra dans le navigateur.'
          });
        }
      };
      initScanner();
    }

    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
        } catch (err) {
          console.warn("Scanner cleanup warning:", err);
        }
      }
    };
  }, [isOpen, onOpenChange, onScanSuccess]);

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
              <p className="text-[10px] font-black uppercase tracking-widest animate-pulse text-primary">Initialisation du Capteur...</p>
            </div>
          )}

          {hasCameraPermission === false && (
            <div className="absolute inset-0 p-8 flex items-center justify-center bg-background/90 backdrop-blur-xl">
              <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5 max-w-xs shadow-2xl">
                <CameraOff className="h-5 w-5" />
                <AlertTitle className="font-black uppercase text-xs">Accès Refusé</AlertTitle>
                <AlertDescription className="text-[10px] uppercase font-bold opacity-70">
                  Le système requiert l'accès à la caméra pour la lecture optique.
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
