import { getProducts } from "@/lib/data";
import { ProductList } from "@/components/products/product-list";

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <ProductList initialProducts={products} />
    );
}
