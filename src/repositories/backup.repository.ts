
import { createClient } from "@/utils/supabase/server";

/**
 * @fileOverview Backup Repository (Comprehensive Authority)
 * Phase 12: Absolute data capturing for all sovereign entities.
 */
export class BackupRepository {
    private supabase = createClient();

    async list(): Promise<any[]> {
        const { data, error } = await this.supabase.storage.from('backups').list();
        if (error) throw new Error(`STORAGE_ACCESS_FAILED: ${error.message}`);
        return data;
    }

    async create(): Promise<string> {
        // Precise data capturing across the board
        const [
            products, customers, suppliers, sales, saleItems, 
            expenses, returns, returnItems, breadOrders, 
            zakatLogs, supplierPayments, payments
        ] = await Promise.all([
            this.supabase.from('products').select('*'),
            this.supabase.from('customers').select('*'),
            this.supabase.from('suppliers').select('*'),
            this.supabase.from('sales').select('*'),
            this.supabase.from('sale_items').select('*'),
            this.supabase.from('expenses').select('*'),
            this.supabase.from('product_returns').select('*'),
            this.supabase.from('return_items').select('*'),
            this.supabase.from('bread_orders').select('*'),
            this.supabase.from('zakat_logs').select('*'),
            this.supabase.from('supplier_payments').select('*'),
            this.supabase.from('payments').select('*'),
        ]);

        const backupData = {
            version: "1.2.0",
            timestamp: new Date().toISOString(),
            data: {
                products: products.data,
                customers: customers.data,
                suppliers: suppliers.data,
                sales: sales.data,
                sale_items: saleItems.data,
                expenses: expenses.data,
                product_returns: returns.data,
                return_items: returnItems.data,
                bread_orders: breadOrders.data,
                zakat_logs: zakatLogs.data,
                supplier_payments: supplierPayments.data,
                payments: payments.data,
            }
        };

        const fileName = `iPOS_SOVEREIGN_BACKUP_${new Date().getTime()}.json`;
        const { error } = await this.supabase.storage
            .from('backups')
            .upload(fileName, JSON.stringify(backupData), { contentType: 'application/json' });

        if (error) throw new Error(`BACKUP_UPLOAD_FAILED: ${error.message}`);
        return fileName;
    }

    async getDetails(name: string): Promise<any> {
        const { data, error } = await this.supabase.storage.from('backups').download(name);
        if (error) throw error;
        const text = await data.text();
        const backup = JSON.parse(text);
        return backup.data || backup; // Compat with older versions
    }

    async restore(name: string): Promise<void> {
        const backup = await this.getDetails(name);
        
        // Transactional Purge & Reconstruction would be implemented here 
        // using RPC or sequential deletes/inserts.
        // For security, only Admin can trigger this via API.
        if (backup.products) {
            await this.supabase.from('products').delete().neq('uuid', '00000000-0000-0000-0000-000000000000');
            await this.supabase.from('products').insert(backup.products.map(({ id, ...rest }: any) => rest));
        }
    }

    async delete(name: string): Promise<void> {
        const { error } = await this.supabase.storage.from('backups').remove([name]);
        if (error) throw new Error(`BACKUP_DELETE_FAILED: ${error.message}`);
    }
}
