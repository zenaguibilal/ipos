'use client';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { CustomerList } from "@/components/customers/customer-list";
import { collection } from "firebase/firestore";
import { Loader } from "lucide-react";

export default function CustomersPage() {
    const firestore = useFirestore();
    const customersRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
    const { data: customers, isLoading } = useCollection(customersRef);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
    }

    return (
        <CustomerList initialCustomers={customers || []} />
    );
}
