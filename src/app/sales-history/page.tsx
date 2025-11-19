'use client';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup, query, where, documentId } from "firebase/firestore";
import { Loader } from "lucide-react";
import { SalesHistoryList } from "@/components/sales/sales-history-list";
import type { Sale, Customer, SaleWithDetails } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";

// Helper function to split an array into chunks
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export default function SalesHistoryPage() {
    const firestore = useFirestore();

    const salesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'sales'));
    }, [firestore]);

    const { data: salesData, isLoading: salesLoading, error: salesError } = useCollection<Sale>(salesQuery);

    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [customersLoading, setCustomersLoading] = useState(true);
    const [customersError, setCustomersError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore || !salesData) {
            if (!salesLoading) {
                setCustomersLoading(false);
            }
            return;
        }

        const customerIds = Array.from(new Set(salesData.map(s => s.customerId)));

        if (customerIds.length === 0) {
            setAllCustomers([]);
            setCustomersLoading(false);
            return;
        }

        setCustomersLoading(true);
        setCustomersError(null);

        // Firestore 'in' query supports a maximum of 30 elements in the array.
        const idChunks = chunkArray(customerIds, 30);

        const fetchCustomers = async () => {
            try {
                const customerPromises = idChunks.map(chunk => {
                    const customersQuery = query(collection(firestore, 'customers'), where(documentId(), 'in', chunk));
                    // This is not a hook, so we can't use useCollection. We'll fetch it directly.
                    // This part is tricky inside a hook-based component. A better approach
                    // would be a more advanced data fetching library or a dedicated hook
                    // that can handle multiple queries. For now, we'll keep it simple
                    // and just fetch once. A full implementation would use onSnapshot.
                    return new Promise<Customer[]>((resolve, reject) => {
                         const { getDocs } = require("firebase/firestore");
                         getDocs(customersQuery).then(snapshot => {
                             resolve(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
                         }).catch(reject);
                    });
                });
                
                const customerChunks = await Promise.all(customerPromises);
                const flattenedCustomers = customerChunks.flat();
                setAllCustomers(flattenedCustomers);
                
            } catch (err: any) {
                setCustomersError(err);
            } finally {
                setCustomersLoading(false);
            }
        };

        fetchCustomers();

    }, [firestore, salesData, salesLoading]);


    const enrichedSales = useMemo(() => {
        if (!salesData) return [];
        
        const customerMap = new Map(allCustomers.map(c => [c.id, c]));
        return salesData.map(sale => ({
            ...sale,
            customer: customerMap.get(sale.customerId),
        }));
    }, [salesData, allCustomers]);


    if (salesLoading || customersLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
    }

    if (salesError || customersError) {
        const errorMessage = [salesError?.message, customersError?.message].filter(Boolean).join('; ');
        return <div className="text-destructive">Erreur lors du chargement des données: {errorMessage}</div>
    }

    return (
        <SalesHistoryList sales={enrichedSales} />
    );
}
