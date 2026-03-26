
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Supplier } from '@/lib/types';
import { supplierRepository } from '@/repositories/supplier.repository';
import { useAppStore } from '@/stores/appStore';

class SupplierService {

    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async getSuppliers(): Promise<Supplier[]> {
        try {
            return await supplierRepository.getAll();
        } catch (error) {
            throw error;
        }
    }

    async getSupplierByUuid(uuid: string): Promise<Supplier | undefined> {
        try {
            return await supplierRepository.findByUuid(uuid);
        } catch (error) {
            throw error;
        }
    }

    async findOrCreateSupplier(name: string, uuid?: string): Promise<Supplier> {
        try {
            if (uuid) {
                const existing = await supplierRepository.findByUuid(uuid);
                if (existing) return existing;
            }

            const existingByName = await supplierRepository.findByName(name);
            if (existingByName) return existingByName;

            const newSupplier: Supplier = {
                uuid: uuidv4(),
                user_id: this.getUserId(),
                name: name,
                balance: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            return await supplierRepository.add(newSupplier);
        } catch (error) {
            throw error;
        }
    }

    async updateSupplier(uuid: string, data: Partial<Supplier>): Promise<Supplier> {
        try {
            return await supplierRepository.update(uuid, data);
        } catch (error) {
            throw error;
        }
    }

    async deleteSupplier(uuid: string): Promise<void> {
        try {
            // Add business logic check here if needed (e.g. check if supplier has linked products or intakes)
            await supplierRepository.delete(uuid);
        } catch (error) {
            throw error;
        }
    }

    async updateSupplierBalance(uuid: string, amountChange: number): Promise<void> {
        try {
            const supplier = await this.getSupplierByUuid(uuid);
            if (!supplier) throw new Error("Fournisseur non trouvé.");
            
            const newBalance = supplier.balance + amountChange;
            await supplierRepository.update(uuid, { balance: newBalance, updatedAt: new Date() });
        } catch (error) {
            throw error;
        }
    }
}

export const supplierService = new SupplierService();
