
'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { LowStockAlerts } from '@/components/notifications/low-stock-alerts';
import type { Product, Sale, CompanyProfile } from '@/lib/types';


export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // --- DATA FETCHING ---
  const productsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const companyDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // --- ALERTS CALCULATION ---
  const { lowStockProducts } = useMemo(() => {
    if (!products) {
      return { lowStockProducts: [] };
    }

    // --- Low stock alerts ---
    const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);

    return { lowStockProducts };

  }, [products]);

  const isLoading = isUserLoading || isLoadingProducts;

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Chargement des alertes...</p>
      </div>
    );
  }

  const totalAlerts = lowStockProducts.length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      
      {totalAlerts === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
          <p className="text-muted-foreground">Aucune alerte pour le moment. Tout est en ordre !</p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-8">
          <LowStockAlerts products={lowStockProducts} />
        </div>
      )}
    </div>
  );
}
