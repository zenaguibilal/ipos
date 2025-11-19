'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup, where, documentId, orderBy, limit, Timestamp, onSnapshot } from 'firebase/firestore';
import type { Product, Customer, Supplier, Sale, SaleLineItem, SaleWithDetails } from './types';
import { useState, useEffect, useMemo } from 'react';
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
    const { data: sales, isLoading: salesLoading, error: salesError } = useCollection<Sale>(salesQuery);

    const customerIds = useMemo(() => {
        if (!sales) return [];
        return Array.from(new Set(sales.map(s => s.customerId).filter(id => id)));
    }, [sales]);

    const customerQuery = useMemoFirebase(() => {
        if (!firestore || customerIds.length === 0) return null;
        return query(collection(firestore, 'customers'), where(documentId(), 'in', customerIds.slice(0, 30)));
    }, [firestore, customerIds]);

    const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customerQuery);

    const customersMap = useMemo(() => {
        if (!customers) return new Map();
        return new Map(customers.map(c => [c.id, c]));
    }, [customers]);

    const enrichedSales = useMemo(() => {
        if (!sales) return [];
        return sales.map(sale => ({
            ...sale,
            customer: customersMap.get(sale.customerId),
        }));
    }, [sales, customersMap]);

    return {
        sales: enrichedSales,
        isLoading: salesLoading || (customerIds.length > 0 && customersLoading),
        error: salesError,
    };
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
        const initialData = new Map<string, number>();
        // Initialize last 7 days with 0 sales
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const formattedDate = format(date, 'd MMM', { locale: fr });
            initialData.set(formattedDate, 0);
        }

        if (!sales) {
             return Array.from(initialData.entries()).map(([label, total]) => ({ label, total }));
        }

        // Populate with actual sales
        sales.forEach(sale => {
            const saleDate = new Date(sale.saleDate);
            const formattedDate = format(saleDate, 'd MMM', { locale: fr });
            if (initialData.has(formattedDate)) {
                initialData.set(formattedDate, (initialData.get(formattedDate) || 0) + sale.totalAmount);
            }
        });

        return Array.from(initialData.entries()).map(([label, total]) => ({ label, total }));

    }, [sales]);

    return {
        chartData,
        isLoading
    }
}


export function useDashboardData() {
    const firestore = useFirestore();

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
