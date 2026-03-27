'use client';
/**
 * @fileOverview Product Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { Product, ProductImportAnalysis } from '@/lib/types';
import Papa from 'papaparse';

class ProductService {
    async getProducts(options?: any): Promise<Product[]> {
        const query = options ? `?${new URLSearchParams(options).toString()}` : '';
        return api.get<Product[]>(`products${query}`);
    }
    
    async getProductsByUuids(uuids: string[]): Promise<Product[]> {
        return api.post<Product[]>('products/bulk-get', { uuids });
    }

    async filterProducts(filters: any): Promise<Product[]> {
        const query = new URLSearchParams(filters).toString();
        return api.get<Product[]>(`products?${query}`);
    }

    async getProductByUuid(uuid: string): Promise<Product | undefined> {
        return api.get<Product>(`products/${uuid}`);
    }

    async getProductByBarcode(barcode: string): Promise<Product | undefined> {
        return api.get<Product>(`products/barcode?q=${barcode}`);
    }

    async getCategories(): Promise<string[]> {
        return api.get<string[]>('products/categories');
    }

    async addProduct(productData: any): Promise<Product> {
        return api.post<Product>('products', productData);
    }

    async updateProduct(uuid: string, productData: Partial<Product>): Promise<Product> {
        return api.put<Product>(`products/${uuid}`, productData);
    }

    async deleteProduct(uuid: string): Promise<void> {
        return api.delete(`products/${uuid}`);
    }
    
    async bulkDelete(uuids: string[]): Promise<void> {
        return api.post('products/bulk-delete', { uuids });
    }

    async analyzeImport(file: File): Promise<ProductImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const analysis = await this._analyzeImportData(results.data);
                    resolve(analysis);
                },
                error: reject
            });
        });
    }

    private async _analyzeImportData(csvData: any[]): Promise<ProductImportAnalysis> {
        const existingProducts = await this.getProducts();
        const existingNames = new Map(existingProducts.map(p => [p.name.toLowerCase().trim(), p]));

        const analysis: ProductImportAnalysis = {
            productsToAdd: [],
            productsToUpdate: [],
            skippedRows: [],
            errorRows: [],
            totalRows: csvData.length,
        };

        for (const row of csvData) {
            if (!row.name || !row.price) {
                analysis.errorRows.push({ ...row, error: "Missing name or price" });
                continue;
            }
            const existing = existingNames.get(row.name.toLowerCase().trim());
            if (existing) analysis.productsToUpdate.push({ ...row, uuid: existing.uuid });
            else analysis.productsToAdd.push(row);
        }
        return analysis;
    }

    async executeImport(confirmedData: { toAdd: any[], toUpdate: any[] }): Promise<void> {
        return api.post('products/bulk-import', confirmedData);
    }

    async exportToCSV(products: Product[]) {
        const csv = Papa.unparse(products.map(p => ({ 'Nom': p.name, 'Prix': p.price, 'Stock': p.quantity })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

export const productService = new ProductService();
