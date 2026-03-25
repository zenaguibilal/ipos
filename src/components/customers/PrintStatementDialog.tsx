'use client';

import { useRef, useState, useEffect } from 'react';
import type { Customer, Sale, CompanyProfile } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { CustomerStatement } from './CustomerStatement';
import { Skeleton } from '../ui/skeleton';
import { useAppStore } from '@/stores/appStore';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';

interface PrintStatementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customer: Customer | null;
}

export function PrintStatementDialog({ isOpen, onOpenChange, customer }: PrintStatementDialogProps) {
    const profile = useAppStore((state) => state.profile);
    const printRef = useRef<HTMLDivElement>(null);

    const [statementData, setStatementData] = useState<{ customer: Customer, unpaidSales: Sale[]}| undefined>(undefined);
    const isLoading = isOpen && statementData === undefined;
    
    useEffect(() => {
        if (!isOpen || !customer) {
            setStatementData(undefined);
            return;
        };

        const fetchStatement = async () => {
            try {
                const data = await customerService.getCustomerStatementData(customer.id);
                setStatementData(data);
            } catch (error) {
                toast.error("Impossible de charger les données du relevé.");
            }
        };

        fetchStatement();
    }, [isOpen, customer]);

  const handlePrint = () => {
    const printableContent = document.getElementById('receipt-for-print');
    const statementElement = printRef.current;
    if (!printableContent || !statementElement) return;
    
    const contentClone = statementElement.cloneNode(true) as HTMLDivElement;
    contentClone.classList.add('a4-receipt');

    printableContent.innerHTML = '';
    printableContent.appendChild(contentClone);
    
    setTimeout(() => window.print(), 100);
  };
  
  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col print-dialog-content">
        <DialogHeader className="print-hide">
          <DialogTitle>Relevé de Compte Client</DialogTitle>
          <DialogDescription>
            Aperçu du relevé de compte pour {customer.firstName} {customer.lastName}.
          </DialogDescription>
        </DialogHeader>
        
        <div id="label-print-area-wrapper" className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-md">
            <div id="label-print-area" className="bg-white mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
                {isLoading ? (
                    <div className="space-y-8 p-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : statementData ? (
                    <CustomerStatement ref={printRef} customer={statementData.customer} unpaidSales={statementData.unpaidSales} profile={profile || null} />
                ) : (
                    <p>Impossible de charger les données du relevé.</p>
                )}
            </div>
        </div>

        <DialogFooter className="print-hide pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={handlePrint} disabled={isLoading || !statementData}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer le Relevé
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
