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

export function useSalesDashboard() {
    const firestore = useFirestore();

    const salesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();
        return query(
            collectionGroup(firestore, 'sales'),
            where('saleDate', '>=', sevenDaysAgo),
            orderBy('saleDate', 'desc')
        );
    }, [firestore]);
    
    const { data: sales, isLoading: salesLoading } = useCollection<Sale>(salesQuery);

    const recentSalesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collectionGroup(firestore, 'sales'),
            orderBy('saleDate', 'desc'),
            limit(5)
        );
    }, [firestore]);
    const { data: recentSales, isLoading: recentSalesLoading } = useCollection<SaleWithDetails>(recentSalesQuery);

    const { customers, isLoading: customersLoading } = useCustomers();

    const salesLast7Days = useMemo(() => {
        if (!sales) return [];
        const dailySales = new Map<string, number>();

        for (let i = 0; i < 7; i++) {
            const date = subDays(new Date(), i);
            const formattedDate = format(date, 'd MMM', { locale: fr });
            dailySales.set(formattedDate, 0);
        }

        sales.forEach(sale => {
            const saleDate = new Date(sale.saleDate);
            const formattedDate = format(saleDate, 'd MMM', { locale: fr });
            if (dailySales.has(formattedDate)) {
                dailySales.set(formattedDate, (dailySales.get(formattedDate) || 0) + sale.totalAmount);
            }
        });
        
        return Array.from(dailySales.entries())
            .map(([name, total]) => ({ name, total }))
            .reverse();

    }, [sales]);
    
    const totalRevenue = useMemo(() => sales?.reduce((sum, sale) => sum + sale.totalAmount, 0) || 0, [sales]);
    const totalSales = sales?.length || 0;

    const customersWithSales = useMemo(() => new Set(sales?.map(s => s.customerId)), [sales]);
    const activeCustomers = customers.filter(c => customersWithSales.has(c.id)).length;
    
    const isLoading = salesLoading || recentSalesLoading || customersLoading;

    return { 
        salesLast7Days, 
        totalRevenue, 
        totalSales,
        activeCustomers, 
        recentSales: recentSales || [], 
        customers,
        isLoading 
    };
}
