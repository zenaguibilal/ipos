import { getCustomers } from "@/lib/data";
import { CustomerList } from "@/components/customers/customer-list";

export default async function CustomersPage() {
    const customers = await getCustomers();

    return (
        <CustomerList initialCustomers={customers} />
    );
}
