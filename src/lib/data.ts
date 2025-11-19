'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, limit, getDocs, where, collectionGroup, documentId, orderBy } from 'firebase/firestore';
import type { Product, Customer, Supplier, Sale, SaleLineItem, SaleWithDetails } from './types';
import { useEffect, useState, useMemo } from 'react';
import { format, getMonth, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';


// Server-side data fetching functions (can be adapted for client-side with hooks)
export async function getProducts(db: any): Promise<Product[]> {
  const productsCol = collection(db, 'suppliers/supp_1/products');
  const productSnapshot = await getDocs(productsCol);
  return productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getCustomers(db: any): Promise<Customer[]> {
  const customersCol = collection(db, 'customers');
  const customerSnapshot = await getDocs(customersCol);
  return customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
}

export async function getSuppliers(db: any): Promise<Supplier[]> {
    const suppliersCol = collection(db, 'suppliers');
    const supplierSnapshot = await getDocs(suppliersCol);
    return supplierSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
}

export function useSales(salesLimit?: number) {
    const firestore = useFirestore();

    const salesRef = useMemoFirebase(() => {
        if (!firestore) return null;
        let q: any = query(collectionGroup(firestore, 'sales'), orderBy('saleDate', 'desc'));
        if (salesLimit) {
            q = query(q, limit(salesLimit));
        }
        return q;
    }, [firestore, salesLimit]);

    const { data: salesData, isLoading: salesLoading, error: salesError } = useCollection<Sale>(salesRef);

    const customerIds = useMemo(() => {
        if (!salesData) return [];
        return Array.from(new Set(salesData.map(s => s.customerId)));
    }, [salesData]);

    const customersRef = useMemoFirebase(() => {
        if (!firestore || customerIds.length === 0) return null;
        return query(collection(firestore, 'customers'), where(documentId(), 'in', customerIds.slice(0, 30)));
    }, [firestore, customerIds]);
    const { data: customersData, isLoading: customersLoading, error: customersError } = useCollection<Customer>(customersRef);

    // Fetch line items and products to calculate net profit.
    const lineItemIds = useMemo(() => salesData?.flatMap(s => s.saleLineItemIds) || [], [salesData]);

    const lineItemsRef = useMemoFirebase(() => {
        if (!firestore || lineItemIds.length === 0) return null;
        return query(collection(firestore, 'sales_line_items'), where(documentId(), 'in', lineItemIds.slice(0, 30)));
    }, [firestore, lineItemIds]);
    const { data: lineItemsData, isLoading: lineItemsLoading, error: lineItemsError } = useCollection<SaleLineItem>(lineItemsRef);

    const productIds = useMemo(() => {
        if (!lineItemsData) return [];
        return Array.from(new Set(lineItemsData.map(item => item.productId)));
    }, [lineItemsData]);

    const productsRef = useMemoFirebase(() => {
        if (!firestore || productIds.length === 0) return null;
        return query(collection(firestore, 'suppliers/supp_1/products'), where(documentId(), 'in', productIds.slice(0, 30)));
    }, [firestore, productIds]);
    const { data: productsData, isLoading: productsLoading, error: productsError } = useCollection<Product>(productsRef);

    const enrichedSales = useMemo(() => {
        if (!salesData) return [];

        const customerMap = customersData ? new Map(customersData.map(c => [c.id, c])) : new Map();
        const productMap = productsData ? new Map(productsData.map(p => [p.id, p])) : new Map();
        const lineItemMap = lineItemsData ? new Map(lineItemsData.map(li => [li.id, { ...li, product: productMap.get(li.productId) }])) : new Map();

        return salesData.map(sale => ({
            ...sale,
            customer: customerMap.get(sale.customerId),
            lineItems: sale.saleLineItemIds.map(id => lineItemMap.get(id)).filter(Boolean) as SaleLineItemWithProduct[],
        }));
    }, [salesData, customersData, lineItemsData, productsData]);


    const isLoading = salesLoading || 
                      (customerIds.length > 0 && customersLoading) || 
                      (lineItemIds.length > 0 && lineItemsLoading) || 
                      (productIds.length > 0 && productsLoading);
                      
    const error = salesError || customersError || lineItemsError || productsError;

    return { sales: enrichedSales, isLoading, error };
}

export type TimeRange = 'daily' | 'monthly' | 'yearly';

export function useDashboardData(timeRange: TimeRange = 'monthly') {
    const firestore = useFirestore();

    const { sales, isLoading: salesLoading } = useSales();
    
    const customersRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
    const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersRef);

    const suppliersRef = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
    const { data: suppliers, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersRef);

    const productsRef = useMemoFirebase(() => collection(firestore, 'suppliers/supp_1/products'), [firestore]);
    const { data: products, isLoading: productsLoading } = useCollection<Product>(productsRef);

    const totalRevenue = useMemo(() => sales.reduce((acc, sale) => acc + sale.totalAmount, 0), [sales]);
    const lowStockItems = useMemo(() => products?.filter(p => p.quantity <= p.minStock).length || 0, [products]);

    const totalCostOfGoods = useMemo(() => {
        return sales.reduce((acc, sale) => {
            const saleCost = sale.lineItems?.reduce((itemAcc, item) => {
                const cost = item.product?.purchasePrice || 0;
                return itemAcc + (cost * item.quantity);
            }, 0) || 0;
            return acc + saleCost;
        }, 0);
    }, [sales]);
    
    const netProfit = totalRevenue - totalCostOfGoods;

    const productsValue = useMemo(() => products?.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0) || 0, [products]);

    const salesChartData = useMemo(() => {
        const now = new Date();
        if (!sales || sales.length === 0) return [];

        if (timeRange === 'daily') {
             const last7Days = eachDayOfInterval({ start: new Date(new Date().setDate(now.getDate() - 6)), end: now });
             const dailyData = last7Days.map(day => ({
                label: format(day, 'EEE', { locale: fr }),
                total: 0
             }));

            sales.forEach(sale => {
                const saleDate = new Date(sale.saleDate);
                if (saleDate >= last7Days[0] && saleDate <= last7Days[last7Days.length - 1]) {
                    const dayStr = format(saleDate, 'EEE', { locale: fr });
                    const dayData = dailyData.find(d => d.label === dayStr);
                    if (dayData) {
                        dayData.total += sale.totalAmount / 100;
                    }
                }
            });
            return dailyData;
        }

        if (timeRange === 'yearly') {
            const year = getYear(now);
            const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) });
            const yearlyData = months.map(month => ({
                label: format(month, 'MMM', { locale: fr }),
                total: 0
            }));
            
            sales.forEach(sale => {
                const saleDate = new Date(sale.saleDate);
                if (getYear(saleDate) === year) {
                    const monthIndex = getMonth(saleDate);
                    yearlyData[monthIndex].total += sale.totalAmount / 100;
                }
            });
            return yearlyData;
        }

        // Default to monthly
        const currentYear = getYear(now);
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            label: format(new Date(currentYear, i), 'MMM', { locale: fr }),
            total: 0
        }));

        sales.forEach(sale => {
            const saleDate = new Date(sale.saleDate);
            if (getYear(saleDate) === currentYear) {
                const monthIndex = getMonth(saleDate);
                monthlyData[monthIndex].total += sale.totalAmount / 100;
            }
        });
        return monthlyData;

    }, [sales, timeRange]);


    return {
        totalRevenue,
        netProfit,
        productsValue,
        totalSales: sales?.length || 0,
        totalCustomers: customers?.length || 0,
        totalSuppliers: suppliers?.length || 0,
        lowStockItems,
        salesChartData,
        products: products || [],
        customers: customers || [],
        isLoading: salesLoading || customersLoading || suppliersLoading || productsLoading
    }
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
