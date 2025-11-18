import { getSuppliers } from "@/lib/data";
import { SupplierList } from "@/components/suppliers/supplier-list";

export default async function SuppliersPage() {
    const suppliers = await getSuppliers();

    return (
        <SupplierList initialSuppliers={suppliers} />
    );
}
