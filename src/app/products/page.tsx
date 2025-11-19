'use client';
import { ProductList } from "@/components/products/product-list";
import { useProducts } from "@/lib/data";
import { Loader } from "lucide-react";

export default function ProductsPage() {
    const { products, isLoading } = useProducts();

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
    }

    return (
        <ProductList initialProducts={products || []} />
    );
}
