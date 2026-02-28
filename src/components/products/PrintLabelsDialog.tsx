'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import type { Product } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer } from 'lucide-react';
import { BarcodeLabel } from './BarcodeLabel';

interface PrintLabelsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productIds: number[];
}

export function PrintLabelsDialog({ isOpen, onOpenChange, productIds }: PrintLabelsDialogProps) {
  const products = useLiveQuery(() => db.products.where('id').anyOf(productIds).toArray(), [productIds]);
  const [labelQuantities, setLabelQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    if (isOpen && products) {
      const initialQuantities: Record<number, number> = {};
      products.forEach(p => {
        initialQuantities[p.id!] = 1;
      });
      setLabelQuantities(initialQuantities);
    }
  }, [isOpen, products]);

  const handleQuantityChange = (productId: number, quantity: string) => {
    const num = parseInt(quantity, 10);
    setLabelQuantities(prev => ({ ...prev, [productId]: Math.max(0, isNaN(num) ? 0 : num) }));
  };

  const labelsToPrint = useMemo(() => {
    if (!products) return [];
    const labels: React.ReactElement[] = [];
    // Sort products to maintain a consistent order
    const sortedProducts = [...products].sort((a,b) => a.name.localeCompare(b.name));
    sortedProducts.forEach(product => {
      const quantity = labelQuantities[product.id!] || 0;
      for (let i = 0; i < quantity; i++) {
        labels.push(<BarcodeLabel key={`${product.id}-${i}`} product={product} />);
      }
    });
    return labels;
  }, [products, labelQuantities]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col print-dialog-content">
        <DialogHeader className="print-hide">
          <DialogTitle>Impression d'étiquettes</DialogTitle>
          <DialogDescription>
            Ajustez les quantités puis cliquez sur "Imprimer". Seules les étiquettes seront imprimées sur une feuille A4.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-12 gap-6 flex-grow overflow-hidden">
            <div className="col-span-3 overflow-y-auto pr-4 border-r print-hide">
                <h3 className="font-semibold mb-4">Produits sélectionnés</h3>
                <div className="space-y-4">
                    {products?.sort((a,b) => a.name.localeCompare(b.name)).map(product => (
                        <div key={product.id} className="flex items-center justify-between gap-2">
                            <Label htmlFor={`qty-${product.id}`} className="flex-grow truncate" title={product.name}>{product.name}</Label>
                            <Input
                                id={`qty-${product.id}`}
                                type="number"
                                min="0"
                                value={labelQuantities[product.id!] ?? 0}
                                onChange={(e) => handleQuantityChange(product.id!, e.target.value)}
                                className="w-20 h-8 text-center"
                            />
                        </div>
                    ))}
                </div>
            </div>
            
            <div id="label-print-area-wrapper" className="col-span-9 overflow-y-auto bg-muted/50 p-4 rounded-md">
                <div id="label-print-area" className="label-sheet grid grid-cols-5 gap-0">
                    {labelsToPrint}
                </div>
            </div>
        </div>

        <DialogFooter className="print-hide">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={handlePrint} disabled={labelsToPrint.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer ({labelsToPrint.length} étiquettes)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
