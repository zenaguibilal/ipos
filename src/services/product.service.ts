'use client';

import { db } from '@/lib/database';
import type { Product, Supplier, ProductImportAnalysis } from '@/lib/types';
import { format } from 'date-fns';
import Papa from 'papaparse';

export class ProductService {
    async getProductByBarcode(barcode: string): Promise<Product | undefined> {
        return await db.products.where('barcodes').equals(barcode).first();
    }
    
    async addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
        return db.transaction('rw', db.products, async () => {
            const now = new Date();
            const newProduct = {
                ...productData,
                createdAt: now,
                updatedAt: now,
                dateMajPrix: now,
            };
            const id = await db.products.add(newProduct as Product);
            return { ...newProduct, id } as Product;
        });
    }

    async updateProduct(id: number, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
         await db.transaction('rw', db.products, async () => {
            const dataToUpdate: any = { ...productData, updatedAt: new Date() };
            const oldProduct = await db.products.get(id);

            if (oldProduct && productData.purchasePrice && productData.purchasePrice !== oldProduct.purchasePrice) {
                 dataToUpdate.dateMajPrix = new Date();
            }
             
            await db.products.update(id, dataToUpdate);
        });
    }

    async deleteProduct(id: number): Promise<void> {
        return db.transaction('rw', db.sales, db.products, async () => {
            const saleWithProduct = await db.sales.filter(sale => 
                sale.items.some(item => item.id === id)
            ).first();

            if (saleWithProduct) {
                const product = await db.products.get(id);
                throw new Error(`Impossible de supprimer le produit "${product?.name || 'inconnu'}" car il a déjà été vendu.`);
            }
            await db.products.delete(id);
        });
    }

    async deleteProducts(ids: number[]): Promise<void> {
       return db.transaction('rw', db.products, db.sales, async () => {
            const sales = await db.sales.toArray();
            const soldProductIds = new Set<number>();
            for (const sale of sales) {
                for (const item of sale.items) {
                    if (typeof item.id === 'number') {
                        soldProductIds.add(item.id);
                    }
                }
            }

            const problemId = ids.find(id => soldProductIds.has(id));

            if (problemId) {
                const product = await db.products.get(problemId);
                throw new Error(`Impossible de supprimer "${product?.name || 'un produit'}" (ID: ${problemId}) car il a déjà été vendu. L'opération a été annulée.`);
            }
            
            await db.products.delete(ids);
        });
    }

    async getProducts(params: { query?: string, category?: string, supplier?: string, stockStatus?: string, sortBy?: string }): Promise<Product[]> {
        const [sortKey, sortOrder] = (params.sortBy || 'createdAt_desc').split('_');
        
        let collection = db.products.orderBy(sortKey);

        if (sortOrder === 'desc') {
            collection = collection.reverse();
        }

        if (params.query || (params.category && params.category !== 'all') || (params.stockStatus && params.stockStatus !== 'all') || (params.supplier && params.supplier !== 'all')) {
            collection = collection.filter(p => {
                let passes = true;
                if (params.query) {
                    const q = params.query.toLowerCase();
                    passes = passes && (p.name.toLowerCase().includes(q) || (p.barcodes && p.barcodes.some(b => b.includes(q))));
                }
                if (params.category && params.category !== 'all') {
                    passes = passes && (p.category === params.category);
                }
                if (params.supplier && params.supplier !== 'all') {
                    passes = passes && (p.fournisseurId === parseInt(params.supplier!));
                }
                if (params.stockStatus && params.stockStatus !== 'all') {
                    if (params.stockStatus === 'in_stock') passes = passes && p.quantity > 0;
                    if (params.stockStatus === 'low_stock') passes = passes && (p.quantity > 0 && p.quantity <= p.minStockLevel);
                    if (params.stockStatus === 'out_of_stock') passes = passes && p.quantity <= 0;
                }
                return passes;
            });
        }
        
        return await collection.toArray();
    }

    async getProductsByIds(ids: number[]): Promise<Product[]> {
        const products = await db.products.bulkGet(ids);
        return products.filter((p): p is Product => p !== undefined);
    }
    
    async getProductCategories(): Promise<string[]> {
        const products = await db.products.toArray();
        const categories = new Set(products.map(p => p.category).filter(Boolean) as string[]);
        return Array.from(categories).sort();
    }
    
    async getSuppliers(): Promise<Supplier[]> {
        return await db.suppliers.orderBy('name').toArray();
    }

    async analyzeProductImport(data: any[]): Promise<ProductImportAnalysis> {
        const analysis: ProductImportAnalysis = { productsToAdd: [], productsToUpdate: [], skippedRows: [], errorRows: [], totalRows: data.length };
        const existingProducts = await db.products.toArray();
        const existingBarcodes = new Map<string, number>();
        existingProducts.forEach(p => p.barcodes?.forEach(b => existingBarcodes.set(b, p.id as number)));

        for (const row of data) {
            const name = row.name?.trim();
            if (!name) {
                analysis.errorRows.push(row);
                continue;
            }
            
            const barcode = row.barcodes?.trim();
            const existingByBarcode = barcode ? existingProducts.find(p => p.barcodes?.includes(barcode)) : null;
            
            if (existingByBarcode) {
                analysis.productsToUpdate.push({ ...row, id: existingByBarcode.id });
            } else {
                analysis.productsToAdd.push(row);
            }
        }
        return analysis;
    }

    async processProductImport(toAdd: any[], toUpdate: any[]): Promise<void> {
        const parseRow = (row: any) => ({
            name: row.name || 'Sans nom',
            category: row.category || 'Non classé',
            price: parseFloat(row.price) || 0,
            purchasePrice: parseFloat(row.purchasePrice) || 0,
            quantity: parseInt(row.quantity) || 0,
            minStockLevel: parseInt(row.minStockLevel) || 10,
            barcodes: row.barcodes ? [row.barcodes.trim()] : [],
        });

        await db.transaction('rw', db.products, async () => {
            const productsToAdd = toAdd.map(parseRow);
            await db.products.bulkAdd(productsToAdd as any);

            for (const p of toUpdate) {
                await this.updateProduct(p.id, parseRow(p));
            }
        });
    }

    async exportProductsToCSV(): Promise<string> {
        const products = await db.products.toArray();
        const dataForCSV = products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            purchasePrice: p.purchasePrice,
            quantity: p.quantity,
            minStockLevel: p.minStockLevel,
            barcodes: p.barcodes?.join(','),
            fournisseurId: p.fournisseurId,
            dateExpiration: p.dateExpiration ? format(p.dateExpiration, 'yyyy-MM-dd') : '',
            unite: p.unite,
        }));
        return Papa.unparse(dataForCSV);
    }
}
