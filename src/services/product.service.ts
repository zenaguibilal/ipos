
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Product, ProductImportAnalysis } from '@/lib/types';
import { productRepository } from '@/repositories/product.repository';
import { calculateStockStatus } from '@/lib/utils';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { useAppStore } from '@/stores/appStore';
import Papa from 'papaparse';
import { supplierService } from './supplier.service';

class ProductService {

    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async getProducts(options?: { sortBy?: string }): Promise<Product[]> {
        try {
            return await productRepository.getAll(options);
        } catch (error) {
            throw error;
        }
    }
    
    async getProductsByUuids(uuids: string[]): Promise<Product[]> {
        try {
            if (uuids.length === 0) return [];
            return await productRepository.getManyByUuids(uuids);
        } catch (error) {
            throw error;
        }
    }

    async filterProducts(filters: {
        query?: string;
        category?: string;
        supplierUuid?: string;
        stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';
        sortBy?: string;
    }): Promise<Product[]> {
        try {
            return await productRepository.filter(filters);
        } catch (error) {
            throw error;
        }
    }

    async getProductByUuid(uuid: string): Promise<Product | undefined> {
        try {
            return await productRepository.findByUuid(uuid);
        } catch (error) {
            throw error;
        }
    }

    async getProductByBarcode(barcode: string): Promise<Product | undefined> {
        try {
            return await productRepository.findByBarcode(barcode);
        } catch (error) {
            throw error;
        }
    }

    async getCategories(): Promise<string[]> {
        try {
            return await productRepository.getUniqueCategories();
        } catch (error) {
            throw error;
        }
    }

    async addProduct(productData: Omit<Product, 'uuid' | 'user_id'> & { supplierName?: string }): Promise<Product> {
        try {
            let finalSupplierUuid = productData.supplierUuid;
            if (productData.supplierName) {
                const supplier = await supplierService.findOrCreateSupplier(productData.supplierName);
                finalSupplierUuid = supplier.uuid;
            }

            const dataForRepo = { ...productData };
            delete (dataForRepo as any).supplierName;

            const newProduct: Product = {
                ...(dataForRepo as Omit<Product, 'uuid' | 'user_id'>),
                uuid: uuidv4(),
                user_id: this.getUserId(),
                supplierUuid: finalSupplierUuid,
                createdAt: new Date(),
                updatedAt: new Date(),
                stockStatus: calculateStockStatus(productData.quantity, productData.minStockLevel),
            };
            return await productRepository.add(newProduct);
        } catch (error) {
            throw error;
        }
    }

    async updateProduct(uuid: string, productData: Partial<Product> & { supplierName?: string }): Promise<Product> {
        try {
            const existingProduct = await this.getProductByUuid(uuid);
            if (!existingProduct) {
                throw new Error("Produit non trouvé.");
            }

            let finalSupplierUuid = productData.supplierUuid;
            if (productData.supplierName) {
                const supplier = await supplierService.findOrCreateSupplier(productData.supplierName, productData.supplierUuid);
                finalSupplierUuid = supplier.uuid;
            } else if (productData.hasOwnProperty('supplierName') && !productData.supplierName) {
                finalSupplierUuid = undefined;
            }

            const dataToUpdate: Partial<Product> = { ...productData };
            delete (dataToUpdate as any).supplierName;
            dataToUpdate.supplierUuid = finalSupplierUuid;
            dataToUpdate.updatedAt = new Date();

            const newQuantity = productData.quantity ?? existingProduct.quantity;
            const newMinStock = productData.minStockLevel ?? existingProduct.minStockLevel;
            if (productData.quantity !== undefined || productData.minStockLevel !== undefined) {
                dataToUpdate.stockStatus = calculateStockStatus(newQuantity, newMinStock);
            }
            
            return await productRepository.update(uuid, dataToUpdate);
        } catch (error) {
            throw error;
        }
    }

    async deleteProduct(uuid: string): Promise<void> {
        try {
            const hasLogs = await inventoryRepository.hasLogs(uuid);
            if (hasLogs) {
                throw new Error("Suppression impossible: ce produit a un historique de transactions (ventes, stocks...).");
            }
            await productRepository.delete(uuid);
        } catch (error) {
            throw error;
        }
    }
    
    async bulkDelete(uuids: string[]): Promise<void> {
        try {
            for (const uuid of uuids) {
                const hasLogs = await inventoryRepository.hasLogs(uuid);
                if (hasLogs) {
                    const product = await productRepository.findByUuid(uuid);
                    throw new Error(`Suppression impossible: Le produit "${product?.name || 'inconnu'}" a un historique de transactions.`);
                }
            }
            await productRepository.bulkDelete(uuids);
        } catch (error) {
            throw error;
        }
    }

    async analyzeImport(file: File): Promise<ProductImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const analysis = await this._analyzeImportData(results.data);
                        resolve(analysis);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    }

    private async _analyzeImportData(csvData: any[]): Promise<ProductImportAnalysis> {
        try {
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
                    purchasePrice: row.purchasePrice || row.prix_achat ? parseFloat(row.purchasePrice || row.prix_achat) : 0,
                    quantity: row.quantity || row.stock ? parseInt(row.quantity || row.stock) : 0,
                    minStockLevel: row.minStockLevel || row.stock_minimum ? parseInt(row.minStockLevel || row.stock_minimum) : 10,
                    barcodes: row.barcodes || row.codes_barres ? String(row.barcodes || row.codes_barres).split(',').map(b => b.trim()).filter(Boolean) : [],
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
        } catch (error) {
            throw error;
        }
    }

    async executeImport(confirmedData: { toAdd: any[], toUpdate: any[] }): Promise<void> {
        try {
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
        } catch (error) {
            throw error;
        }
    }
}

export const productService = new ProductService();
