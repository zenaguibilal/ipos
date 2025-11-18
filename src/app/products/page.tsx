'use client';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { ProductList } from "@/components/products/product-list";
import { collection } from "firebase/firestore";
import { Loader } from "lucide-react";

export default function ProductsPage() {
    const firestore = useFirestore();
    // A real app would scope this to the logged in supplier
    const productsRef = useMemoFirebase(() => collection(firestore, 'suppliers/supp_1/products'), [firestore]);
    const { data: products, isLoading } = useCollection(productsRef);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
    }

    return (
        <ProductList initialProducts={products || []} />
    );
}
