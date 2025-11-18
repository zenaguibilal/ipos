import { getCustomers } from "@/lib/data";
import { CustomerList } from "@/components/customers/customer-list";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Customers | iPOS',
};

export default async function CustomersPage() {
    const customers = await getCustomers();

    return (
        <CustomerList initialCustomers={customers} />
    );
}
