'use client';

import { POSClient } from "@/components/sell/pos-client";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Loader } from "lucide-react";

export default function SellPage() {
    const firestore = useFirestore();
    // A real app would scope this to the logged in supplier
    const productsRef = useMemoFirebase(() => query(collection(firestore, 'suppliers/supp_1/products'), where('stock', '>', 0)), [firestore]);
    const { data: products, isLoading } = useCollection(productsRef);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
    }
    
    return (
        <POSClient products={products || []} />
    );
}
