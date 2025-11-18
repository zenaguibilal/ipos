'use client';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { SupplierList } from "@/components/suppliers/supplier-list";
import { collection } from "firebase/firestore";
import { Loader } from "lucide-react";


export default function SuppliersPage() {
    const firestore = useFirestore();
    const suppliersRef = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
    const { data: suppliers, isLoading } = useCollection(suppliersRef);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
    }

    return (
        <SupplierList initialSuppliers={suppliers || []} />
    );
}
