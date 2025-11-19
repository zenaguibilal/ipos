'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Product, Customer, Supplier } from './types';
import { useMemo } from 'react';


export function useCustomers() {
    const firestore = useFirestore();
    const customersRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'customers');
    }, [firestore]);
    const { data: customers, isLoading } = useCollection<Customer>(customersRef);
    return { customers: customers || [], isLoading };
}

export function useProducts() {
    const firestore = useFirestore();
    const productsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'suppliers/supp_1/products');
    }, [firestore]);
    const { data: products, isLoading } = useCollection<Product>(productsRef);
    return { products: products || [], isLoading };
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

export function useDashboardData() {
    const { customers, isLoading: customersLoading } = useCustomers();
    const { suppliers, isLoading: suppliersLoading } = useSuppliers();
    const { products, isLoading: productsLoading } = useProducts();
    const firestore = useFirestore();

    const isLoading = !firestore || customersLoading || suppliersLoading || productsLoading;
    
    const lowStockItems = useMemo(() => products?.filter(p => p.quantity <= p.minStock).length || 0, [products]);
    const productsValue = useMemo(() => products?.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0) || 0, [products]);

    return {
        productsValue,
        totalCustomers: customers?.length || 0,
        totalSuppliers: suppliers?.length || 0,
        lowStockItems,
        products: products || [],
        customers: customers || [],
        isLoading: isLoading
    }
}
