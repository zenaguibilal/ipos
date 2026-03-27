import { createClient } from "@/utils/supabase/server";

/**
 * @fileOverview Backup Repository (Absolute Data Authority)
 * Phase 4: Encapsulates all cloud storage operations.
 */
export class BackupRepository {
    private supabase = createClient();

    async list(): Promise<any[]> {
        const { data, error } = await this.supabase.storage.from('backups').list();
        if (error) throw new Error(`STORAGE_ACCESS_FAILED: ${error.message}`);
        return data;
    }

    async create(): Promise<string> {
        const [products, customers, suppliers, sales, expenses, returns] = await Promise.all([
            this.supabase.from('products').select('*'),
            this.supabase.from('customers').select('*'),
            this.supabase.from('suppliers').select('*'),
            this.supabase.from('sales').select('*, sale_items(*)'),
            this.supabase.from('expenses').select('*'),
            this.supabase.from('product_returns').select('*, return_items(*)'),
        ]);

        const backupData = {
            timestamp: new Date().toISOString(),
            products: products.data,
            customers: customers.data,
            suppliers: suppliers.data,
            sales: sales.data,
            expenses: expenses.data,
            returns: returns.data,
        };

        const fileName = `backup_${new Date().getTime()}.json`;
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
        return JSON.parse(text);
    }

    async restore(name: string): Promise<void> {
        const backup = await this.getDetails(name);

        if (backup.products) {
            // Destruction before reconstruction
            await this.supabase.from('products').delete().neq('uuid', '00000000-0000-0000-0000-000000000000');
            await this.supabase.from('products').insert(backup.products.map((p: any) => {
                const { id, user_id, ...rest } = p;
                return rest;
            }));
        }
        // Further restoration logic for other entities would go here
    }

    async delete(name: string): Promise<void> {
        const { error } = await this.supabase.storage.from('backups').remove([name]);
        if (error) throw new Error(`BACKUP_DELETE_FAILED: ${error.message}`);
    }
}
