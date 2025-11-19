'use client';

import { CustomerList } from "@/components/customers/customer-list";
import { useCustomers } from "@/lib/data";
import { Loader } from "lucide-react";

export default function CustomersPage() {
    const { customers, isLoading } = useCustomers();

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
    }

    return (
        <CustomerList initialCustomers={customers || []} />
    );
}
