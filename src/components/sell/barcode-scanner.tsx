'use client';

import { useState } from 'react';
import { Barcode, CheckCircle, XCircle, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useZxing } from 'react-zxing';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
}

export function BarcodeScanner({ onScan, onCancel }: BarcodeScannerProps) {
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined);

  const { ref } = useZxing({
    onResult: (result) => {
      const scannedText = result.getText();
      setLastResult(scannedText);
      onScan(scannedText);
    },
    onError: (error) => {
      console.error("Barcode scanner error:", error);
      if (error.name === 'NotAllowedError') {
        setHasPermission(false);
      }
    },
    onDecodeStream: (stream) => {
      if (stream && hasPermission === undefined) {
          setHasPermission(true);
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Barcode /> Scanner le Code-barres
        </CardTitle>
        <CardDescription>
          Pointez la caméra vers un code-barres pour l'ajouter au panier.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
          <video ref={ref} className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-4 border-primary/50 rounded-md" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 25% 100%, 25% 25%, 75% 25%, 75% 75%, 25% 75%, 25% 100%, 100% 100%, 100% 0%)' }}></div>
        </div>

        {hasPermission === false && (
          <Alert variant="destructive">
            <CameraOff className="h-4 w-4" />
            <AlertTitle>Accès à la caméra refusé</AlertTitle>
            <AlertDescription>
              Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour utiliser cette fonctionnalité.
            </AlertDescription>
          </Alert>
        )}
        
        {lastResult && (
            <Alert variant="default">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Dernier Scan</AlertTitle>
                <AlertDescription>
                    Code-barres scanné : <strong>{lastResult}</strong>
                </AlertDescription>
            </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            <XCircle className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
