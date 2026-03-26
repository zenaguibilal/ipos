
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Supplier, SupplierPayment, StockIntake } from '@/lib/types';
import { supplierRepository } from '@/repositories/supplier.repository';
import { supplierPaymentRepository } from '@/repositories/supplierPayment.repository';
import { stockRepository } from '@/repositories/stock.repository';
import { useAppStore } from '@/stores/appStore';
import Papa from 'papaparse';

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
            // Check if supplier has intakes or payments
            const intakes = await stockRepository.filter({ query: uuid });
            const payments = await supplierPaymentRepository.findBySupplierUuid(uuid);
            
            if (intakes.length > 0 || payments.length > 0) {
                throw new Error("Impossible de supprimer un fournisseur avec un historique de transactions (réceptions ou paiements).");
            }
            
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

    // --- Activities and Payments ---

    async getSupplierActivity(supplierUuid: string): Promise<any[]> {
        try {
            const [intakes, payments] = await Promise.all([
                stockRepository.filter({ query: supplierUuid }),
                supplierPaymentRepository.findBySupplierUuid(supplierUuid)
            ]);

            const activity = [
                ...intakes.map(i => ({ ...i, type: 'intake', date: i.createdAt })),
                ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate })),
            ];

            return activity.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
        } catch (error) {
            throw error;
        }
    }

    async addPayment(paymentData: Omit<SupplierPayment, 'uuid' | 'user_id' | 'createdAt' | 'updatedAt'>): Promise<SupplierPayment> {
        try {
            const newPayment: SupplierPayment = {
                ...paymentData,
                uuid: uuidv4(),
                user_id: this.getUserId(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const saved = await supplierPaymentRepository.add(newPayment);
            // Reduce supplier balance
            await this.updateSupplierBalance(paymentData.supplierUuid, -paymentData.amount);
            
            return saved;
        } catch (error) {
            throw error;
        }
    }

    async exportToCSV(suppliers: Supplier[]) {
        const data = suppliers.map(s => ({
            'Nom': s.name,
            'Contact': s.contactPerson || '',
            'Téléphone': s.phone || '',
            'E-mail': s.email || '',
            'Adresse': s.address || '',
            'Solde Dû (DA)': s.balance.toFixed(1),
            'Inscrit le': s.createdAt ? new Date(s.createdAt).toLocaleDateString('fr-FR') : 'N/A'
        }));

        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `fournisseurs-ipos-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const supplierService = new SupplierService();
