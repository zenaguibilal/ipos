'use client';

import { POSClient } from "@/components/sell/pos-client";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Loader } from "lucide-react";
import type { Product, Customer } from "@/lib/types";

export default function SellPage() {
    const firestore = useFirestore();
    
    // A real app would scope this to the logged in supplier
    const productsRef = useMemoFirebase(() => query(collection(firestore, 'suppliers/supp_1/products'), where('quantity', '>', 0)), [firestore]);
    const { data: products, isLoading: productsLoading } = useCollection<Product>(productsRef);

    const customersRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
    const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersRef);
    
    if (productsLoading || customersLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
    }
    
    return (
        <POSClient products={products || []} customers={customers || []} />
    );
}
