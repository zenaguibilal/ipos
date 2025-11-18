'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';
import type { Product, Customer, Supplier, Sale } from './types';
import { useEffect, useState, useMemo } from 'react';

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
    let q = collection(firestore, 'customers/test-customer/sales');
    if (salesLimit) {
      q = query(q, limit(salesLimit));
    }
    return q;
  }, [firestore, salesLimit]);

  const { data: salesData, isLoading: isSalesLoading, error: salesError } = useCollection<Sale>(salesRef);
  
  const customerIds = useMemo(() => salesData?.map(s => s.customerId), [salesData]);
  const customersRef = useMemoFirebase(() => customerIds && customerIds.length > 0 ? query(collection(firestore, 'customers'), where('id', 'in', customerIds)) : null, [firestore, customerIds]);
  const { data: customersData, isLoading: areCustomersLoading, error: customersError } = useCollection<Customer>(customersRef);
  
  const [sales, setSales] = useState<any[]>([]);
  
  useEffect(() => {
    if (salesData && customersData) {
      const salesWithCustomerData = salesData.map(sale => {
        const customer = customersData.find(c => c.id === sale.customerId);
        return {
          ...sale,
          customer: customer || null
        }
      });
      setSales(salesWithCustomerData);
    } else if (salesData) {
        setSales(salesData);
    }
  }, [salesData, customersData]);

  return { sales, isLoading: isSalesLoading || areCustomersLoading, error: salesError || customersError };
}

export function useDashboardData() {
    const firestore = useFirestore();

    const salesRef = useMemoFirebase(() => collection(firestore, 'customers/test-customer/sales'), [firestore]);
    const { data: sales, isLoading: salesLoading } = useCollection(salesRef);
    
    const customersRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
    const { data: customers, isLoading: customersLoading } = useCollection(customersRef);

    const suppliersRef = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
    const { data: suppliers, isLoading: suppliersLoading } = useCollection(suppliersRef);

    const productsRef = useMemoFirebase(() => collection(firestore, 'suppliers/supp_1/products'), [firestore]);
    const { data: products, isLoading: productsLoading } = useCollection(productsRef);

    const totalRevenue = sales?.reduce((acc, sale) => acc + sale.totalAmount, 0) || 0;
    const lowStockItems = products?.filter(p => p.quantity < 10).length || 0;

    return {
        totalRevenue: totalRevenue,
        totalSales: sales?.length || 0,
        totalCustomers: customers?.length || 0,
        totalSuppliers: suppliers?.length || 0,
        lowStockItems: lowStockItems,
        isLoading: salesLoading || customersLoading || suppliersLoading || productsLoading
    }
}

export function useProducts() {
    const firestore = useFirestore();
    const productsRef = useMemoFirebase(() => collection(firestore, 'suppliers/supp_1/products'), [firestore]);
    const { data: products, isLoading } = useCollection<Product>(productsRef);

    return { products: products || [], isLoading };
}
