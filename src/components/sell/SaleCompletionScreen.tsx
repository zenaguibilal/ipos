'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Receipt } from './Receipt';
import type { Sale, CompanyProfile } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface SaleCompletionScreenProps {
  sale: Sale;
  profile: CompanyProfile | null;
  onDone: () => void;
}

export function SaleCompletionScreen({ sale, profile, onDone }: SaleCompletionScreenProps) {
  const [useThermal, setUseThermal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printableContent = document.getElementById('receipt-for-print');
    const receiptElement = receiptRef.current;
    
    if (useThermal) {
        document.documentElement.classList.add('thermal');
    } else {
        document.documentElement.classList.remove('thermal');
    }

    if (printableContent && receiptElement) {
        printableContent.innerHTML = ''; // Clear previous
        const receiptClone = receiptElement.cloneNode(true) as HTMLDivElement;
        printableContent.appendChild(receiptClone);
        
        // Brief delay to ensure DOM is updated before printing
        setTimeout(() => {
            window.print();
        }, 100);
    }
  };

  useEffect(() => {
    // Cleanup thermal class when component unmounts
    return () => document.documentElement.classList.remove('thermal');
  }, []);

  const change = Math.abs(sale.remainingBalance);

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 flex items-center gap-4 bg-background border-b">
        <Button variant="outline" size="icon" onClick={onDone}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Vente Terminée</h1>
          <p className="text-muted-foreground">Facture #{sale.invoiceNumber}</p>
        </div>
      </header>

      <main className="flex-grow grid md:grid-cols-2 gap-8 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col items-center justify-center space-y-6 text-center bg-muted p-8 rounded-lg">
           {change > 0 && sale.paymentStatus !== 'unpaid' && (
             <>
                <p className="text-lg text-muted-foreground">
                    {sale.paymentStatus === 'paid' ? "Monnaie à rendre" : "Solde restant"}
                </p>
                <p className={`text-6xl font-bold ${sale.paymentStatus === 'paid' ? 'text-chart-secondary' : 'text-destructive'}`}>
                    {formatCurrency(change)}
                </p>
             </>
           )}
           <p className="text-lg text-muted-foreground">Total payé</p>
           <p className="text-6xl font-bold text-primary">{formatCurrency(sale.total)}</p>
           <div className="w-full pt-6 border-t">
                 <Button size="lg" className="w-full text-lg" onClick={onDone}>Nouvelle Vente</Button>
           </div>
        </div>
        
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                 <h2 className="text-lg font-semibold">Aperçu du reçu</h2>
                 <div className="flex items-center gap-2 print-hide">
                    <Label htmlFor="thermal-switch">80mm</Label>
                    <Switch id="thermal-switch" checked={useThermal} onCheckedChange={setUseThermal}/>
                     <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimer
                    </Button>
                </div>
            </div>
            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                <Receipt ref={receiptRef} sale={sale} profile={profile} thermal={useThermal}/>
            </div>
        </div>
      </main>
    </div>
  );
}
