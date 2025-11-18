import { POSClient } from "@/components/sell/pos-client";
import { getProducts } from "@/lib/data";

export default async function SellPage() {
    const products = await getProducts();
    
    return (
        <POSClient products={products} />
    );
}
