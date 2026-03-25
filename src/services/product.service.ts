'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Product, ProductImportAnalysis } from '@/lib/types';
import { productRepository } from '@/repositories/product.repository';
import { calculateStockStatus } from '@/lib/utils';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { useAppStore } from '@/stores/appStore';

class ProductService {

    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async getProducts(options?: { sortBy?: string }): Promise<Product[]> {
        return productRepository.getAll(options);
    }
    
    async filterProducts(filters: {
        query?: string;
        category?: string;
        supplierUuid?: string;
        stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
        sortBy?: string;
    }): Promise<Product[]> {
        return productRepository.filter(filters);
    }

    async getProductByUuid(uuid: string): Promise<Product | undefined> {
        return productRepository.findByUuid(uuid);
    }

    async getProductByBarcode(barcode: string): Promise<Product | undefined> {
        return productRepository.findByBarcode(barcode);
    }

    async getCategories(): Promise<string[]> {
        return productRepository.getUniqueCategories();
    }

    async addProduct(productData: Omit<Product, 'uuid' | 'user_id'>): Promise<Product> {
        const newProduct: Product = {
            ...productData,
            uuid: uuidv4(),
            user_id: this.getUserId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            stockStatus: calculateStockStatus(productData.quantity, productData.minStockLevel),
        };
        return productRepository.add(newProduct);
    }

    async updateProduct(uuid: string, productData: Partial<Product>): Promise<Product> {
        const existingProduct = await this.getProductByUuid(uuid);
        if (!existingProduct) {
            throw new Error("Produit non trouvé.");
        }

        const dataToUpdate: Partial<Product> = {
            ...productData,
            updatedAt: new Date(),
        };

        const newQuantity = productData.quantity ?? existingProduct.quantity;
        const newMinStock = productData.minStockLevel ?? existingProduct.minStockLevel;
        if (productData.quantity !== undefined || productData.minStockLevel !== undefined) {
            dataToUpdate.stockStatus = calculateStockStatus(newQuantity, newMinStock);
        }
        
        return await productRepository.update(uuid, dataToUpdate);
    }

    async deleteProduct(uuid: string): Promise<void> {
        const hasLogs = await inventoryRepository.hasLogs(uuid);
        if (hasLogs) {
            throw new Error("Suppression impossible: ce produit a un historique de transactions (ventes, stocks...).");
        }
        await productRepository.delete(uuid);
    }
    
    async bulkDelete(uuids: string[]): Promise<void> {
        for (const uuid of uuids) {
            const hasLogs = await inventoryRepository.hasLogs(uuid);
            if (hasLogs) {
                const product = await productRepository.findByUuid(uuid);
                throw new Error(`Suppression impossible: Le produit "${product?.name || 'inconnu'}" a un historique de transactions.`);
            }
        }
        await productRepository.bulkDelete(uuids);
    }

    async analyzeImport(csvData: any[]): Promise<ProductImportAnalysis> {
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
            const name = row.name || row.nom;
            const price = row.price || row.prix_vente;
            
            if (!name || !price) {
                analysis.errorRows.push({ ...row, error: "Nom ou prix manquant" });
                continue;
            }
            
            const existingProduct = existingNames.get(name.toLowerCase().trim());

            const productData = {
                name,
                category: row.category || row.categorie || 'Non classé',
                price: parseFloat(price),
                purchasePrice: row.purchasePrice ? parseFloat(row.purchasePrice) : 0,
                quantity: row.quantity ? parseInt(row.quantity) : 0,
                minStockLevel: row.minStockLevel ? parseInt(row.minStockLevel) : 10,
                barcodes: row.barcodes ? String(row.barcodes).split(',').map(b => b.trim()) : [],
            };

            if (isNaN(productData.price)) {
                 analysis.errorRows.push({ ...row, error: "Prix de vente invalide" });
                continue;
            }

            if (existingProduct) {
                analysis.productsToUpdate.push({ ...productData, uuid: existingProduct.uuid });
            } else {
                analysis.productsToAdd.push(productData);
            }
        }
        return analysis;
    }

    async executeImport(confirmedData: { toAdd: any[], toUpdate: any[] }): Promise<void> {
        const userId = this.getUserId();
        const now = new Date();

        const toAdd = confirmedData.toAdd.map(p => ({
            ...p,
            uuid: uuidv4(),
            user_id: userId,
            createdAt: now,
            updatedAt: now,
            stockStatus: calculateStockStatus(p.quantity, p.minStockLevel),
        }));

         const toUpdate = confirmedData.toUpdate.map(p => ({
            ...p,
            updatedAt: now,
            stockStatus: calculateStockStatus(p.quantity, p.minStockLevel),
        }));
        
        const upsertData = [...toAdd, ...toUpdate];
        
        if (upsertData.length > 0) {
            await productRepository.bulkUpsert(upsertData);
        }
    }
}

export const productService = new ProductService();
