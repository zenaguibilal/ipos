'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, limit, getDocs, where, collectionGroup, documentId } from 'firebase/firestore';
import type { Product, Customer, Supplier, Sale } from './types';
import { useEffect, useState, useMemo } from 'react';
import { format, getMonth } from 'date-fns';
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
    let q = collectionGroup(firestore, 'sales');
    if (salesLimit) {
      q = query(q, limit(salesLimit));
    }
    return q;
  }, [firestore, salesLimit]);

  const { data: salesData, isLoading: isSalesLoading, error: salesError } = useCollection<Sale>(salesRef);

  const customerIds = useMemo(() => {
      if (!salesData) return [];
      const ids = new Set(salesData.map(s => s.customerId));
      return Array.from(ids);
  }, [salesData]);

  const customersRef = useMemoFirebase(() => {
      if (!firestore || customerIds.length === 0) return null;
      return query(collection(firestore, 'customers'), where(documentId(), 'in', customerIds.slice(0, 30)))
  }, [firestore, customerIds]);

  const { data: customersData, isLoading: areCustomersLoading, error: customersError } = useCollection<Customer>(customersRef);

  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    if (salesData && customersData) {
      const customerMap = new Map(customersData.map(c => [c.id, c]));
      const salesWithCustomerData = salesData.map(sale => ({
        ...sale,
        customer: customerMap.get(sale.customerId) || null
      }));
      setSales(salesWithCustomerData);
    } else if (salesData) {
        // If customers are still loading, just show sales data without customer info
        setSales(salesData.map(sale => ({ ...sale, customer: null })));
    }
  }, [salesData, customersData]);

  return { sales, isLoading: isSalesLoading || areCustomersLoading, error: salesError || customersError };
}

export function useDashboardData() {
    const firestore = useFirestore();

    const salesRef = useMemoFirebase(() => collectionGroup(firestore, 'sales'), [firestore]);
    const { data: sales, isLoading: salesLoading } = useCollection(salesRef);
    
    const customersRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
    const { data: customers, isLoading: customersLoading } = useCollection(customersRef);

    const suppliersRef = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
    const { data: suppliers, isLoading: suppliersLoading } = useCollection(suppliersRef);

    const productsRef = useMemoFirebase(() => collection(firestore, 'suppliers/supp_1/products'), [firestore]);
    const { data: products, isLoading: productsLoading } = useCollection(productsRef);

    const totalRevenue = sales?.reduce((acc, sale) => acc + sale.totalAmount, 0) || 0;
    const lowStockItems = products?.filter(p => p.quantity < p.minStock).length || 0;

    const monthlySales = useMemo(() => {
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
        const monthlyData = monthNames.map(month => ({ month, total: 0 }));

        if (sales) {
            sales.forEach(sale => {
                const monthIndex = getMonth(new Date(sale.saleDate));
                monthlyData[monthIndex].total += sale.totalAmount;
            });
        }
        // Return data for the current year, could be adapted for other ranges
        return monthlyData.map(m => ({ ...m, total: m.total / 100 }));
    }, [sales]);


    return {
        totalRevenue: totalRevenue,
        totalSales: sales?.length || 0,
        totalCustomers: customers?.length || 0,
        totalSuppliers: suppliers?.length || 0,
        lowStockItems: lowStockItems,
        monthlySales,
        isLoading: salesLoading || customersLoading || suppliersLoading || productsLoading
    }
}

export function useProducts() {
    const firestore = useFirestore();
    const productsRef = useMemoFirebase(() => collection(firestore, 'suppliers/supp_1/products'), [firestore]);
    const { data: products, isLoading } = useCollection<Product>(productsRef);

    return { products: products || [], isLoading };
}
