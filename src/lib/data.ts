'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup, where, documentId, orderBy, limit } from 'firebase/firestore';
import type { Product, Customer, Sale, SaleWithDetails, Supplier } from './types';
import { useMemo } from 'react';
import { subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function useProducts() {
    const firestore = useFirestore();
    const productsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'products'));
    }, [firestore]);
    const { data: products, isLoading } = useCollection<Product>(productsRef);
    return { products: products || [], isLoading };
}

export function useCustomers() {
    const firestore = useFirestore();
    const customersRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'customers');
    }, [firestore]);
    const { data: customers, isLoading } = useCollection<Customer>(customersRef);
    return { customers: customers || [], isLoading };
}

export function useSuppliers() {
    const firestore = useFirestore();
    const suppliersRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'suppliers');
    }, [firestore]);
    const { data: suppliers, isLoading } = useCollection<Supplier>(suppliersRef);
    return { suppliers: suppliers || [], isLoading };
}

export function useSales() {
    const firestore = useFirestore();
    const salesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'sales'), orderBy('saleDate', 'desc'));
    }, [firestore]);

    const { data: sales, isLoading, error } = useCollection<SaleWithDetails>(salesQuery);
    return { sales: sales || [], isLoading, error };
}
