'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, limit, getDocs, where, collectionGroup, documentId, orderBy } from 'firebase/firestore';
import type { Product, Customer, Supplier, Sale, SaleLineItem, SaleWithDetails } from './types';
import { useEffect, useState, useMemo } from 'react';
import { format, getMonth, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SaleLineItemWithProduct extends SaleLineItem {
    product?: Product;
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


export function useSales(salesLimit?: number) {
    const firestore = useFirestore();
    const { customers, isLoading: customersLoading } = useCustomers();
    const { products, isLoading: productsLoading } = useProducts();

    const salesRef = useMemoFirebase(() => {
        if (!firestore) return null;
        let q = query(collectionGroup(firestore, 'sales'), orderBy('saleDate', 'desc'));
        if (salesLimit) {
            q = query(q, limit(salesLimit));
        }
        return q;
    }, [firestore, salesLimit]);
    const { data: salesData, isLoading: salesLoading } = useCollection<Sale>(salesRef);

    const lineItemIds = useMemo(() => salesData?.flatMap(s => s.saleLineItemIds) || [], [salesData]);

    const lineItemsRef = useMemoFirebase(() => {
        if (!firestore || lineItemIds.length === 0) return null;
        return query(collection(firestore, 'sales_line_items'), where(documentId(), 'in', lineItemIds.slice(0, 30)));
    }, [firestore, lineItemIds]);
    const { data: lineItemsData, isLoading: lineItemsLoading } = useCollection<SaleLineItem>(lineItemsRef);

    const enrichedSales = useMemo(() => {
        if (!salesData || !customers || !products || !lineItemsData) return [];

        const customerMap = new Map(customers.map(c => [c.id, c]));
        const productMap = new Map(products.map(p => [p.id, p]));
        const lineItemMap = new Map(lineItemsData.map(li => [li.id, { ...li, product: productMap.get(li.productId) }]));

        return salesData.map(sale => ({
            ...sale,
            customer: customerMap.get(sale.customerId),
            lineItems: sale.saleLineItemIds.map(id => lineItemMap.get(id)).filter(Boolean) as SaleLineItemWithProduct[],
        }));
    }, [salesData, customers, products, lineItemsData]);
    
    const isLoading = salesLoading || customersLoading || productsLoading || (lineItemIds.length > 0 && lineItemsLoading);

    return { sales: enrichedSales, isLoading };
}

export type TimeRange = 'daily' | 'monthly' | 'yearly';

export function useDashboardData(timeRange: TimeRange = 'monthly') {
    const { sales, isLoading: salesLoading } = useSales();
    const { customers, isLoading: customersLoading } = useCustomers();
    const { suppliers, isLoading: suppliersLoading } = useSuppliers();
    const { products, isLoading: productsLoading } = useProducts();
    const firestore = useFirestore();

    const isLoading = !firestore || salesLoading || customersLoading || suppliersLoading || productsLoading;
    
    const totalRevenue = useMemo(() => sales?.reduce((acc, sale) => acc + sale.totalAmount, 0) || 0, [sales]);
    const lowStockItems = useMemo(() => products?.filter(p => p.quantity <= p.minStock).length || 0, [products]);

    const totalCostOfGoods = useMemo(() => {
        return sales?.reduce((acc, sale) => {
            const saleCost = sale.lineItems?.reduce((itemAcc, item) => {
                const cost = item.product?.purchasePrice || 0;
                return itemAcc + (cost * item.quantity);
            }, 0) || 0;
            return acc + saleCost;
        }, 0) || 0;
    }, [sales]);
    
    const netProfit = totalRevenue - totalCostOfGoods;
    const productsValue = useMemo(() => products?.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0) || 0, [products]);

    const salesChartData = useMemo(() => {
        if (!sales || sales.length === 0) return [];
        const now = new Date();

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
        isLoading: isLoading
    }
}