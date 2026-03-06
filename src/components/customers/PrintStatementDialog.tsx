'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import type { Customer, Sale } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { CustomerStatement } from './CustomerStatement';
import { Skeleton } from '../ui/skeleton';

interface PrintStatementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customer: Customer | null;
}

export function PrintStatementDialog({ isOpen, onOpenChange, customer }: PrintStatementDialogProps) {
    const [statementData, setStatementData] = useState<{ customer: Customer; unpaidSales: Sale[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && customer?.id) {
            setIsLoading(true);
            dataService.getCustomerStatementData(customer.id)
                .then(data => {
                    setStatementData(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to load statement data:", err);
                    setIsLoading(false);
                });
        }
    }, [isOpen, customer]);

  const handlePrint = () => {
    window.print();
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
            <div id="label-print-area" className="bg-white mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '1cm' }}>
                {isLoading ? (
                    <div className="space-y-8">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : statementData ? (
                    <CustomerStatement customer={statementData.customer} unpaidSales={statementData.unpaidSales} />
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
