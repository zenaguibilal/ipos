import { getSuppliers } from "@/lib/data";
import { SupplierList } from "@/components/suppliers/supplier-list";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Suppliers | iPOS',
};

export default async function SuppliersPage() {
    const suppliers = await getSuppliers();

    return (
        <SupplierList initialSuppliers={suppliers} />
    );
}
