'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import type { Sale, CompanyProfile } from '@/lib/types';
import { Receipt } from './Receipt';
import { dataService } from '@/services/data-service';

interface SaleCompletionScreenProps {
  sale: Sale & { change?: number };
  onClose: () => void;
}

export function SaleCompletionScreen({ sale, onClose }: SaleCompletionScreenProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  const loadProfile = useCallback(async () => {
    setProfile(await dataService.getCompanyProfile());
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handlePrint = (thermal: boolean) => {
    const printableContent = document.getElementById('receipt-for-print');
    const receiptElement = receiptRef.current;

    if (!printableContent || !receiptElement) {
      toast.error("Erreur: Impossible de préparer le reçu pour l'impression.");
      return;
    }

    const receiptClone = receiptElement.cloneNode(true) as HTMLDivElement;
    
    document.documentElement.classList.toggle('thermal', thermal);
    receiptClone.classList.add(thermal ? 'thermal-receipt' : 'a4-receipt');
    
    printableContent.innerHTML = '';
    printableContent.appendChild(receiptClone);
    
    setTimeout(() => {
        window.print();
        document.documentElement.classList.remove('thermal');
    }, 100);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Vente Réussie</DialogTitle>
        <DialogDescription>
          Imprimez le reçu pour le client ou fermez pour commencer une nouvelle vente.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 my-4 max-h-[50vh] overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Receipt sale={sale} profile={profile} ref={receiptRef} />
      </div>
      <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handlePrint(true)}>
            <Printer className="mr-2 h-4 w-4"/> Thermique
          </Button>
          <Button variant="outline" onClick={() => handlePrint(false)}>
            <Printer className="mr-2 h-4 w-4"/> A4
          </Button>
        </div>
        <Button onClick={onClose}>Fermer</Button>
      </DialogFooter>
    </>
  );
}
