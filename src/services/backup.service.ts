'use client';

import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { productRepository } from '@/repositories/product.repository';
import { customerRepository } from '@/repositories/customer.repository';
import { saleRepository } from '@/repositories/sale.repository';
import { expenseRepository } from '@/repositories/expense.repository';
import { supplierRepository } from '@/repositories/supplier.repository';
import { stockRepository } from '@/repositories/stock.repository';
import { paymentRepository } from '@/repositories/payment.repository';
import { returnRepository } from '@/repositories/return.repository';
import { breadOrderRepository } from '@/repositories/breadOrder.repository';
import { companyRepository } from "@/services/company.repository";
import { useAppStore } from "@/stores/appStore";

class BackupService {
    private supabase = createClient();
    
    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated for backup operation.");
        }
        return session.user.id;
    }

    private async exportData(): Promise<Record<string, any[]>> {
        try {
            const [
                products,
                customers,
                sales,
                expenses,
                suppliers,
                stockIntakes,
                payments,
                returns,
                breadOrders,
                profile,
            ] = await Promise.all([
                productRepository.getAll(),
                customerRepository.getAll(),
                saleRepository.getAll(),
                expenseRepository.getAll(),
                supplierRepository.getAll(),
                stockRepository.getAll(),
                paymentRepository.getAll(),
                returnRepository.getAll(),
                breadOrderRepository.getAllForUser(),
                companyRepository.get().then(p => p ? [p] : []),
            ]);
            
            return { 
                suppliers, customers, products, expenses, 
                stock_intakes: stockIntakes, 
                sales,
                product_returns: returns, 
                payments,
                bread_orders: breadOrders,
                company_profile: profile,
            };
        } catch (error) {
            throw error;
        }
    }
    
    async createBackup(): Promise<string> {
        try {
            const data = await this.exportData();
            const userId = this.getUserId();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `backup-${timestamp}.json`;
            const filePath = `${userId}/${fileName}`;
            
            const { error } = await this.supabase.storage
                .from('backups')
                .upload(filePath, new Blob([JSON.stringify(data)], { type: 'application/json' }));
                
            if (error) {
                throw new Error(`Supabase storage error: ${error.message}`);
            }
            
            return filePath;
        } catch (error) {
            throw error;
        }
    }

    async listBackups() {
        try {
            const userId = this.getUserId();
            const { data, error } = await this.supabase.storage
                .from('backups')
                .list(userId, {
                    limit: 100,
                    sortBy: { column: 'created_at', order: 'desc' },
                });
                
            if (error) {
                throw new Error(`Supabase storage error: ${error.message}`);
            }
            return data;
        } catch (error) {
            throw error;
        }
    }
    
    async deleteBackup(backupName: string) {
        try {
            const userId = this.getUserId();
            const filePath = `${userId}/${backupName}`;
            const { error } = await this.supabase.storage
                .from('backups')
                .remove([filePath]);
            
            if (error) {
                throw new Error(`Supabase storage error: ${error.message}`);
            }
        } catch (error) {
            throw error;
        }
    }

    async restoreBackup(backupName: string) {
        try {
            const userId = this.getUserId();
            const filePath = `${userId}/${backupName}`;

            // 1. Download file
            const { data: blob, error: downloadError } = await this.supabase.storage
                .from('backups')
                .download(filePath);
            
            if (downloadError) throw new Error(`Download error: ${downloadError.message}`);
            
            const data = JSON.parse(await blob.text());

            // 2. Delete all existing data in order
            toast.info("Clearing existing data...");
            await saleRepository.deleteAllForUser(userId); // Deletes sale_items via cascade
            await returnRepository.deleteAllForUser(userId);
            await paymentRepository.deleteAllForUser(userId);
            await stockRepository.deleteAllForUser(userId);
            await productRepository.deleteAllForUser(userId); // Deletes inventory_logs via cascade
            await breadOrderRepository.deleteAllForUser(userId);
            await customerRepository.deleteAllForUser(userId);
            await supplierRepository.deleteAllForUser(userId);
            await expenseRepository.deleteAllForUser(userId);
            await companyRepository.deleteAllForUser(userId);
            
            // 3. Insert new data in reverse order of deletion
            toast.info("Restoring data...");
            if (data.company_profile?.length) await companyRepository.bulkUpsert(data.company_profile);
            if (data.suppliers?.length) await supplierRepository.bulkUpsert(data.suppliers);
            if (data.customers?.length) await customerRepository.bulkUpsert(data.customers);
            if (data.products?.length) await productRepository.bulkUpsert(data.products);
            if (data.expenses?.length) await expenseRepository.bulkUpsert(data.expenses);
            if (data.stock_intakes?.length) await stockRepository.bulkUpsert(data.stock_intakes);
            if (data.sales?.length) await saleRepository.bulkUpsert(data.sales);
            if (data.product_returns?.length) await returnRepository.bulkUpsert(data.product_returns);
            if (data.payments?.length) await paymentRepository.bulkUpsert(data.payments);
            if (data.bread_orders?.length) await breadOrderRepository.bulkUpsert(data.bread_orders);
        } catch (error) {
            throw error;
        }
    }
}

export const backupService = new BackupService();
