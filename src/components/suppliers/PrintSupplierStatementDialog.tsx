
'use client';

import { useRef, useState } from 'react';
import type { Supplier, CompanyProfile } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { SupplierStatement } from './SupplierStatement';
import { useAppStore } from '@/stores/appStore';

interface PrintSupplierStatementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  supplier: Supplier | null;
  activity: any[];
}

export function PrintSupplierStatementDialog({ isOpen, onOpenChange, supplier, activity }: PrintSupplierStatementDialogProps) {
    const profile = useAppStore((state) => state.profile);
    const printRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = () => {
        setIsPrinting(true);
        const printableContent = document.getElementById('receipt-for-print');
        const statementElement = printRef.current;
        if (!printableContent || !statementElement) {
            setIsPrinting(false);
            return;
        }
        
        const contentClone = statementElement.cloneNode(true) as HTMLDivElement;
        contentClone.classList.add('a4-receipt');

        printableContent.innerHTML = '';
        printableContent.appendChild(contentClone);
        
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 150);
    };
  
    if (!supplier) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col print-dialog-content luxury-glass">
                <DialogHeader className="print-hide">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Printer className="h-5 w-5 text-primary" />
                        Relevé de Compte : {supplier.name}
                    </DialogTitle>
                    <DialogDescription>
                        Aperçu du relevé de compte fournisseur optimisé pour une impression A4.
                    </DialogDescription>
                </DialogHeader>
                
                <div id="label-print-area-wrapper" className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-3xl border border-white/5 print-hide">
                    <div id="label-print-area" className="bg-white mx-auto shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
                        <SupplierStatement ref={printRef} supplier={supplier} activity={activity} profile={profile || null} />
                    </div>
                </div>

                <DialogFooter className="print-hide pt-4 border-t border-white/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
                    <Button onClick={handlePrint} disabled={isPrinting} className="bg-primary hover:bg-primary/90 rounded-xl px-8">
                        {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                        Lancer l'impression
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
