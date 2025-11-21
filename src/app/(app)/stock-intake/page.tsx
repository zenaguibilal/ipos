'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { collection } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { StockIntakeForm } from '@/components/stock-intake/stock-intake-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { History } from 'lucide-react';

export default function StockIntakePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const productsCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'products');
    }, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const isLoading = isUserLoading || isLoadingProducts;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="flex justify-end mb-4">
                <Button asChild variant="outline">
                    <Link href="/stock-intake/history">
                        <History className="mr-2 h-4 w-4" />
                        Voir l'historique
                    </Link>
                </Button>
            </div>
            <StockIntakeForm
                userId={user.uid}
                products={products || []}
            />
        </main>
    );
}
