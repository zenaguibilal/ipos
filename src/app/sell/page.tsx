import { POSClient } from "@/components/sell/pos-client";
import { getProducts } from "@/lib/data";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sell | iPOS',
};

export default async function SellPage() {
    const products = await getProducts();
    
    return (
        <POSClient products={products} />
    );
}
