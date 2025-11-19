'use client';

import { SupplierList } from "@/components/suppliers/supplier-list";
import { useSuppliers } from "@/lib/data";
import { Loader } from "lucide-react";

export default function SuppliersPage() {
    const { suppliers, isLoading } = useSuppliers();

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
    }

    return (
        <SupplierList initialSuppliers={suppliers || []} />
    );
}
