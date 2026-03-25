'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Product } from '@/lib/types';
import { productRepository, inventoryRepository } from '@/repositories';
import { calculateStockStatus } from '@/lib/utils';

class ProductService {
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
            user_id: 'user_id_placeholder', // This will be set by the repository layer
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
        const product = await productRepository.findByUuid(uuid);
        if (!product) return;

        const hasLogs = await inventoryRepository.hasLogs(product.uuid);
        if (hasLogs) {
            throw new Error("Suppression impossible: ce produit a un historique de transactions (ventes, stocks...).");
        }
        await productRepository.delete(uuid);
    }
    
    async deleteProducts(uuids: string[]): Promise<void> {
        for (const uuid of uuids) {
            const hasLogs = await inventoryRepository.hasLogs(uuid);
            if (hasLogs) {
                const product = await productRepository.findByUuid(uuid);
                throw new Error(`Suppression impossible: Le produit "${product?.name || 'inconnu'}" a un historique de transactions.`);
            }
        }
        
        await productRepository.bulkDelete(uuids);
    }
}

export const productService = new ProductService();
