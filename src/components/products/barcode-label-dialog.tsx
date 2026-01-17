'use client';

import { useRef, useEffect, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer } from 'lucide-react';
import type { Product } from '@/lib/types';

interface BarcodeLabelDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product & { barcode?: string };
}

export function BarcodeLabelDialog({ isOpen, onOpenChange, product }: BarcodeLabelDialogProps) {
    const labelRef = useRef<HTMLDivElement>(null);
    const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
    const [quantity, setQuantity] = useState(1);

    const barcodeValue = product.barcodes?.[0] || product.barcode || product.id;

    useEffect(() => {
        if (isOpen && barcodeCanvasRef.current && barcodeValue) {
            try {
                JsBarcode(barcodeCanvasRef.current, barcodeValue, {
                    format: "CODE128",
                    width: 1.5,
                    height: 40,
                    displayValue: true,
                    fontSize: 14,
                    margin: 5,
                });
            } catch (e) {
                console.error("Failed to generate barcode:", e);
            }
        }
    }, [isOpen, barcodeValue]);

    const handlePrint = () => {
        const printContainer = document.getElementById('receipt-for-print');
        const labelElement = labelRef.current;

        if (!printContainer || !labelElement) return;

        // Ensure we're not using thermal printer page styles
        document.documentElement.classList.remove('thermal');

        const printJobContainer = document.createElement('div');
        printJobContainer.style.display = 'flex';
        printJobContainer.style.flexWrap = 'wrap';
        printJobContainer.style.gap = '5px';
        printJobContainer.style.padding = '10mm';

        for (let i = 0; i < quantity; i++) {
            const labelClone = labelElement.cloneNode(true) as HTMLElement;
            labelClone.style.border = '1px dotted #999';
            labelClone.style.padding = '5mm';
            labelClone.style.display = 'inline-block';
            labelClone.style.breakInside = 'avoid';
            
            const clonedCanvas = labelClone.querySelector('canvas');
            if (clonedCanvas) {
                try {
                    JsBarcode(clonedCanvas, barcodeValue, {
                        format: "CODE128", width: 1.5, height: 40, displayValue: true, fontSize: 14, margin: 5,
                    });
                } catch (e) { console.error(e); }
            }
            printJobContainer.appendChild(labelClone);
        }

        printContainer.innerHTML = '';
        printContainer.appendChild(printJobContainer);

        window.print();
        
        printContainer.innerHTML = '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Générer Étiquettes</DialogTitle>
                    <DialogDescription>
                        Imprimez des étiquettes avec code-barres pour "{product.name}".
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="text-center">
                        <Label>Aperçu de l'étiquette</Label>
                        <div ref={labelRef} className="mt-2 py-2 flex flex-col items-center gap-1 bg-white text-black rounded-md">
                            <p className="font-bold text-base text-center break-words max-w-[150px]">{product.name}</p>
                            <p className="font-black text-xl">{product.price.toFixed(2)} DA</p>
                            <canvas ref={barcodeCanvasRef} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="label-quantity">Nombre d'étiquettes à imprimer</Label>
                        <Input
                            id="label-quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                        />
                    </div>
                </div>
                
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Fermer
                    </Button>
                     <Button type="button" onClick={handlePrint} disabled={quantity < 1}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer {quantity} étiquette(s)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
