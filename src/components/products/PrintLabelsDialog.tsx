
'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Loader2, Tag, Trash2, Plus, Minus, Hash } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import JsBarcode from 'jsbarcode';

interface PrintLabelsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    products: Product[];
}

interface LabelToPrint {
    product: Product;
    quantity: number;
}

export function PrintLabelsDialog({ isOpen, onOpenChange, products }: PrintLabelsDialogProps) {
    const [labels, setLabels] = useState<LabelToPrint[]>([]);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLabels(products.map(p => ({ product: p, quantity: 1 })));
        }
    }, [isOpen, products]);

    const handleQuantityChange = (uuid: string, delta: number) => {
        setLabels(prev => prev.map(l => 
            l.product.uuid === uuid 
                ? { ...l, quantity: Math.max(1, l.quantity + delta) } 
                : l
        ));
    };

    const handleRemove = (uuid: string) => {
        setLabels(prev => prev.filter(l => l.product.uuid !== uuid));
    };

    const handlePrint = () => {
        setIsPrinting(true);
        const printableContent = document.getElementById('receipt-for-print');
        if (!printableContent) {
            setIsPrinting(false);
            return;
        }

        const container = document.createElement('div');
        container.className = 'label-print-grid p-4 bg-white text-black font-sans';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(3, 1fr)';
        container.style.gap = '15px';

        labels.forEach(l => {
            for (let i = 0; i < l.quantity; i++) {
                const labelWrapper = document.createElement('div');
                labelWrapper.className = 'label-wrapper border border-black p-3 text-center break-inside-avoid bg-white';
                
                const title = document.createElement('div');
                title.style.fontSize = '12px';
                title.style.fontWeight = 'bold';
                title.style.textTransform = 'uppercase';
                title.style.marginBottom = '2px';
                title.style.whiteSpace = 'nowrap';
                title.style.overflow = 'hidden';
                title.style.textOverflow = 'ellipsis';
                title.textContent = l.product.name;
                
                const price = document.createElement('div');
                price.style.fontSize = '16px';
                price.style.fontWeight = '900';
                price.style.marginBottom = '5px';
                price.textContent = `${l.product.price.toFixed(1)} DA`;
                
                labelWrapper.appendChild(title);
                labelWrapper.appendChild(price);

                if (l.product.barcodes && l.product.barcodes.length > 0) {
                    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    labelWrapper.appendChild(svg);
                    try {
                        JsBarcode(svg, l.product.barcodes[0], {
                            format: "CODE128",
                            width: 1.2,
                            height: 35,
                            displayValue: true,
                            fontSize: 10,
                            margin: 0
                        });
                    } catch (e) {
                        const err = document.createElement('div');
                        err.style.fontSize = '8px';
                        err.textContent = l.product.barcodes[0];
                        labelWrapper.appendChild(err);
                    }
                } else {
                    const noBarcode = document.createElement('div');
                    noBarcode.style.fontSize = '8px';
                    noBarcode.style.color = '#666';
                    noBarcode.style.height = '45px';
                    noBarcode.style.display = 'flex';
                    noBarcode.style.alignItems = 'center';
                    noBarcode.style.justifyContent = 'center';
                    noBarcode.textContent = 'SANS BARCODE';
                    labelWrapper.appendChild(noBarcode);
                }

                container.appendChild(labelWrapper);
            }
        });

        printableContent.innerHTML = '';
        printableContent.appendChild(container);

        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col luxury-glass border-primary/20 p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-primary/5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Tag className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight">Impression d'Étiquettes</DialogTitle>
                            <DialogDescription className="text-xs font-bold uppercase opacity-60">Préparez vos planches de prix و Barcodes.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow overflow-hidden flex flex-col p-6 space-y-4">
                    {labels.length === 0 ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center opacity-30 grayscale space-y-4">
                            <Tag className="h-16 w-16" />
                            <p className="font-black uppercase text-xs tracking-widest">Aucun produit sélectionné</p>
                        </div>
                    ) : (
                        <ScrollArea className="flex-grow border rounded-2xl bg-background/40 p-4 shadow-inner">
                            <div className="space-y-3">
                                {labels.map((l) => (
                                    <div key={l.product.uuid} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/30 transition-all">
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm uppercase tracking-tight">{l.product.name}</p>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] font-black text-primary border-primary/20">
                                                    {formatCurrency(l.product.price)}
                                                </Badge>
                                                {l.product.barcodes?.[0] && (
                                                    <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                                                        <Hash className="h-2 w-2" />
                                                        {l.product.barcodes[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 p-1 bg-background rounded-lg border border-white/10 shadow-sm">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-md" onClick={() => handleQuantityChange(l.product.uuid, -1)}><Minus className="h-3 w-3"/></Button>
                                                <span className="w-8 text-center font-black text-sm">{l.quantity}</span>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-md" onClick={() => handleQuantityChange(l.product.uuid, 1)}><Plus className="h-3 w-3"/></Button>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleRemove(l.product.uuid)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter className="p-6 bg-white/5 border-t border-white/5 gap-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12 flex-1">Annuler</Button>
                    <Button onClick={handlePrint} disabled={labels.length === 0 || isPrinting} className="bg-primary hover:bg-primary/90 px-10 rounded-xl shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-[0.2em] h-12 flex-[2] gap-3">
                        {isPrinting ? <Loader2 className="animate-spin h-4 w-4"/> : <Printer className="h-4 w-4" />}
                        Générer {labels.reduce((a,b) => a + b.quantity, 0)} étiquette(s)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
