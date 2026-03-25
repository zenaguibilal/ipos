'use client';

import { db } from '@/lib/database';
import type { Product, Supplier, ProductImportAnalysis } from '@/lib/types';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './sync.service';

export class ProductService {
    async getProductByBarcode(barcode: string): Promise<Product | undefined> {
        return await db.products.where('barcodes').equals(barcode).and(p => p.sync_status !== 'pending_delete').first();
    }
    
    async addProduct(productData: Omit<Product, 'id' | 'uuid'>): Promise<Product> {
        const now = new Date();
        const uuid = uuidv4();
        const newProduct = {
            ...productData,
            uuid,
            createdAt: now,
            updatedAt: now,
            dateMajPrix: now,
            sync_status: 'pending_create' as const,
            last_modified_by: syncService.getLocalDeviceId(),
        };

        const id = await db.products.add(newProduct as Product);
        await syncService.queueSyncOperation('products', uuid, 'create', { ...newProduct, id: undefined });
        return { ...newProduct, id } as Product;
    }

    async updateProduct(id: number, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
         await db.transaction('rw', db.products, db.sync_queue, async () => {
            const now = new Date();
            const product = await db.products.get(id);
            if (!product || !product.uuid) return;

            const dataToUpdate: any = { ...productData, updatedAt: now, last_modified_by: syncService.getLocalDeviceId() };
            if (productData.purchasePrice && productData.purchasePrice !== product.purchasePrice) {
                 dataToUpdate.dateMajPrix = now;
            }
            if (product.sync_status !== 'pending_create') {
                dataToUpdate.sync_status = 'pending_update';
            }
             
            await db.products.update(id, dataToUpdate);
            await syncService.queueSyncOperation('products', product.uuid, 'update', dataToUpdate);
        });
    }

    async deleteProduct(id: number): Promise<void> {
        return db.transaction('rw', db.sales, db.products, db.sync_queue, async () => {
            const product = await db.products.get(id);
            if (!product || !product.uuid) return;

            const saleWithProduct = await db.sales.filter(sale => 
                sale.items.some(item => item.id === id) && sale.sync_status !== 'pending_delete'
            ).first();


            if (saleWithProduct) {
                throw new Error(`Impossible de supprimer le produit "${product.name}" car il a déjà été vendu.`);
            }
            
            await db.products.update(id, { sync_status: 'pending_delete', updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
            await syncService.queueSyncOperation('products', product.uuid, 'delete', {});
        });
    }

    async deleteProducts(ids: number[]): Promise<void> {
       return db.transaction('rw', db.products, db.sales, db.sync_queue, async () => {
            const sales = await db.sales.where('sync_status').notEqual('pending_delete').toArray();
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
            
            const productsToDelete = await db.products.bulkGet(ids);
            for (const product of productsToDelete) {
                if (product && product.uuid) {
                    await db.products.update(product.id!, { sync_status: 'pending_delete', updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
                    await syncService.queueSyncOperation('products', product.uuid, 'delete', {});
                }
            }
        });
    }

    async getProducts(params: { query?: string, category?: string, supplierUuid?: string, stockStatus?: string, sortBy?: string } = {}): Promise<Product[]> {
        const [sortKey, sortOrder] = (params.sortBy || 'createdAt_desc').split('_');
        
        let collection = db.products.where('sync_status').notEqual('pending_delete');

        // Apply most selective filters first
        if (params.category && params.category !== 'all') {
            collection = db.products.where({ category: params.category }).and(p => p.sync_status !== 'pending_delete');
        }
        if (params.supplierUuid && params.supplierUuid !== 'all') {
            collection = collection.where({ supplierUuid: params.supplierUuid });
        }
        
        // Apply less selective filters
        collection = collection.filter(p => {
            let passes = true;
            if (params.query) {
                const q = params.query.toLowerCase();
                passes = passes && (p.name.toLowerCase().includes(q) || (p.barcodes && p.barcodes.some(b => b.includes(q))));
            }
            if (params.stockStatus && params.stockStatus !== 'all') {
                if (params.stockStatus === 'in_stock') passes = passes && p.quantity > 0;
                if (params.stockStatus === 'low_stock') passes = passes && (p.quantity > 0 && p.quantity <= p.minStockLevel);
                if (params.stockStatus === 'out_of_stock') passes = passes && p.quantity <= 0;
            }
            return passes;
        });

        const sortedCollection = sortOrder === 'desc' ? collection.reverse() : collection;
        return await sortedCollection.sortBy(sortKey);
    }

    async getProductsByIds(ids: number[]): Promise<Product[]> {
        const products = await db.products.bulkGet(ids);
        return products.filter((p): p is Product => p !== undefined && p.sync_status !== 'pending_delete');
    }
    
    async getProductCategories(): Promise<string[]> {
        const products = await db.products.where('sync_status').notEqual('pending_delete').toArray();
        const categories = new Set(products.map(p => p.category).filter(Boolean) as string[]);
        return Array.from(categories).sort();
    }
    
    async getSuppliers(): Promise<Supplier[]> {
        return await db.suppliers.where('sync_status').notEqual('pending_delete').sortBy('name');
    }

    async analyzeProductImport(data: any[]): Promise<ProductImportAnalysis> {
        const analysis: ProductImportAnalysis = { productsToAdd: [], productsToUpdate: [], skippedRows: [], errorRows: [], totalRows: data.length };
        const existingProducts = await db.products.where('sync_status').notEqual('pending_delete').toArray();
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

        await db.transaction('rw', db.products, db.sync_queue, async () => {
            const productsToAdd = toAdd.map(parseRow);
            for(const p of productsToAdd) {
                await this.addProduct(p);
            }

            for (const p of toUpdate) {
                await this.updateProduct(p.id, parseRow(p));
            }
        });
    }

    async exportProductsToCSV(): Promise<string> {
        const products = await db.products.where('sync_status').notEqual('pending_delete').toArray();
        const dataForCSV = products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            purchasePrice: p.purchasePrice,
            quantity: p.quantity,
            minStockLevel: p.minStockLevel,
            barcodes: p.barcodes?.join(','),
            supplierUuid: p.supplierUuid,
            dateExpiration: p.dateExpiration ? format(new Date(p.dateExpiration), 'yyyy-MM-dd') : '',
            unite: p.unite,
        }));
        return Papa.unparse(dataForCSV);
    }
}
