
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import type { Product, PurchaseOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { History, FileText, Plus } from 'lucide-react';
import { StockIntakeForm } from '@/components/stock-intake/stock-intake-form';
import { StockReceptionFromPOForm } from '@/components/stock-intake/stock-reception-from-po-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function StockIntakePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [view, setView] = useState<'manual' | 'po-select' | 'po-reception'>('po-select');

    // Fetch products to pass to the forms
    const productsCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'products');
    }, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
    
    // Fetch pending purchase orders
    const pendingPOsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'purchaseOrders'),
            where('status', '==', 'pending')
        );
    }, [user, firestore]);
    const { data: pendingPOs, isLoading: isLoadingPOs } = useCollection<PurchaseOrder>(pendingPOsQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);
    
    const handlePOSelect = (poId: string) => {
        const po = pendingPOs?.find(p => p.id === poId);
        if (po) {
            setSelectedPO(po);
            setView('po-reception');
        }
    };
    
    const handleFinishReception = () => {
        setSelectedPO(null);
        setView('po-select');
    };

    const isLoading = isUserLoading || isLoadingProducts || isLoadingPOs;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }
    
    const renderContent = () => {
        if (view === 'manual') {
            return <StockIntakeForm userId={user.uid} products={products || []} />;
        }
        
        if (view === 'po-reception' && selectedPO) {
             return <StockReceptionFromPOForm userId={user.uid} products={products || []} purchaseOrder={selectedPO} onFinished={handleFinishReception} />;
        }

        // Default to 'po-select' view
        return (
             <Card className="w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle>Démarrer une nouvelle réception</CardTitle>
                    <CardDescription>Choisissez comment vous souhaitez enregistrer cette entrée de stock.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                         <label className="font-medium">À partir d'un bon de commande</label>
                        <Select onValueChange={handlePOSelect} disabled={!pendingPOs || pendingPOs.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingPOs ? "Chargement des BCs..." : "Sélectionner un bon de commande"} />
                            </SelectTrigger>
                            <SelectContent>
                                {pendingPOs && pendingPOs.map(po => (
                                    <SelectItem key={po.id} value={po.id}>
                                        {po.poNumber} - {po.supplier}
                                    </SelectItem>
                                ))}
                                {(!pendingPOs || pendingPOs.length === 0) && !isLoadingPOs && <p className="p-4 text-sm text-muted-foreground">Aucun bon de commande en attente.</p>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                            Ou
                            </span>
                        </div>
                    </div>
                    
                    <Button variant="secondary" className="w-full" onClick={() => setView('manual')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Démarrer une réception manuelle
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="flex justify-end mb-4">
                <Button asChild variant="outline">
                    <Link href="/stock-intake/history">
                        <History className="mr-2 h-4 w-4" />
                        Voir l'historique des réceptions
                    </Link>
                </Button>
            </div>
            {renderContent()}
        </main>
    );
}
