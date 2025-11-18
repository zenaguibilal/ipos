import { getProducts } from "@/lib/data";
import { ProductList } from "@/components/products/product-list";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Products | iPOS',
};

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <ProductList initialProducts={products} />
    );
}
