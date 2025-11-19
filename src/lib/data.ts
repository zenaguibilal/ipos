'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup, where, documentId, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Product, Customer, Supplier, Sale, SaleLineItem, SaleWithDetails } from './types';
import { useMemo } from 'react';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { fr } from 'date-fns/locale';


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
        // This is a collection group query to get all products regardless of supplier
        return query(collectionGroup(firestore, 'products'));
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

export function useSales(max?: number) {
    const firestore = useFirestore();
    const salesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        let q = query(collectionGroup(firestore, 'sales'), orderBy('saleDate', 'desc'));
        if (max) {
            q = query(q, limit(max));
        }
        return q;
    }, [firestore, max]);
    const { data: sales, isLoading: salesLoading } = useCollection<Sale>(salesQuery);
    
    const customerIds = useMemo(() => {
        if (!sales) return [];
        return Array.from(new Set(sales.map(s => s.customerId)));
    }, [sales]);

    const customersQuery = useMemoFirebase(() => {
        if (!firestore || customerIds.length === 0) return null;
        return query(collection(firestore, 'customers'), where(documentId(), 'in', customerIds.slice(0, 30)));
    }, [firestore, customerIds]);
    const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);

    const enrichedSales = useMemo(() => {
        if (!sales || !customers) return [];
        const customerMap = new Map(customers.map(c => [c.id, c]));
        return sales.map(sale => ({
            ...sale,
            customer: customerMap.get(sale.customerId)
        }));
    }, [sales, customers]);

    return {
        sales: enrichedSales,
        isLoading: salesLoading || (customerIds.length > 0 && customersLoading)
    }
}

export function useSalesChartData() {
    const firestore = useFirestore();
    const sevenDaysAgo = subDays(new Date(), 7);
    
    const salesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collectionGroup(firestore, 'sales'), 
            where('saleDate', '>=', sevenDaysAgo.toISOString()),
            orderBy('saleDate', 'asc')
        );
    }, [firestore]);

    const { data: sales, isLoading } = useCollection<Sale>(salesQuery);

    const chartData = useMemo(() => {
        if (!sales) return [];

        const dailySales = new Map<string, number>();

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
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

        return Array.from(dailySales.entries()).map(([label, total]) => ({ label, total }));

    }, [sales]);

    return {
        chartData,
        isLoading
    }
}


export function useDashboardData() {
    const firestore = useFirestore();

    if (!firestore) {
        return {
            productsValue: 0,
            totalCustomers: 0,
            totalSuppliers: 0,
            lowStockItems: 0,
            dailyRevenue: 0,
            isLoading: true
        }
    }

    const { customers, isLoading: customersLoading } = useCustomers();
    const { suppliers, isLoading: suppliersLoading } = useSuppliers();
    const { products, isLoading: productsLoading } = useProducts();

    const todayStart = startOfDay(new Date());

    const todaysSalesQuery = useMemoFirebase(() => {
         if (!firestore) return null;
         return query(
            collectionGroup(firestore, 'sales'),
            where('saleDate', '>=', todayStart.toISOString())
         );
    }, [firestore]);

    const { data: todaysSales, isLoading: salesLoading } = useCollection<Sale>(todaysSalesQuery);
    
    const isLoading = customersLoading || suppliersLoading || productsLoading || salesLoading;
    
    const lowStockItems = useMemo(() => products?.filter(p => p.quantity <= p.minStock).length || 0, [products]);
    const productsValue = useMemo(() => products?.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0) || 0, [products]);
    const dailyRevenue = useMemo(() => todaysSales?.reduce((acc, sale) => acc + sale.totalAmount, 0) || 0, [todaysSales]);

    return {
        productsValue,
        totalCustomers: customers?.length || 0,
        totalSuppliers: suppliers?.length || 0,
        lowStockItems,
        dailyRevenue,
        isLoading
    }
}
