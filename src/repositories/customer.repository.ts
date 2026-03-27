import { createClient } from "@/utils/supabase/server";
import type { Customer } from "@/lib/types";

/**
 * @fileOverview Customer Repository (Absolute Data Authority)
 */
export class CustomerRepository {
    private supabase = createClient();

    async getAll(): Promise<Customer[]> {
        const { data, error } = await this.supabase
            .from('customers')
            .select('*')
            .order('last_name', { ascending: true });
        if (error) throw new Error(`CUSTOMER_FETCH_ERROR: ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async getCategories(): Promise<string[]> {
        const { data, error } = await this.supabase
            .from('customers')
            .select('category')
            .not('category', 'is', null);
        
        if (error) throw new Error(`CUSTOMER_CATEGORIES_FETCH_ERROR: ${error.message}`);
        const cats = Array.from(new Set(data.map(i => i.category)));
        return cats.sort();
    }

    async findByUuid(uuid: string): Promise<Customer | null> {
        const { data, error } = await this.supabase
            .from('customers')
            .select('*')
            .eq('uuid', uuid)
            .single();
        if (error) return null;
        return this.mapFromDb(data);
    }

    async getActivity(uuid: string): Promise<any[]> {
        const [salesRes, paymentsRes, returnsRes] = await Promise.all([
            this.supabase.from('sales').select('*').eq('customer_uuid', uuid).order('created_at', { ascending: false }),
            this.supabase.from('payments').select('*').eq('customer_uuid', uuid).order('created_at', { ascending: false }),
            this.supabase.from('product_returns').select('*').eq('customer_uuid', uuid).order('created_at', { ascending: false })
        ]);

        return [
            ...(salesRes.data || []).map(s => ({ ...s, type: 'sale', date: s.created_at })),
            ...(paymentsRes.data || []).map(p => ({ ...p, type: 'payment', date: p.created_at })),
            ...(returnsRes.data || []).map(r => ({ ...r, type: 'return', date: r.created_at }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    async getStats(uuid: string): Promise<any> {
        const { data: sales } = await this.supabase.from('sales').select('*, sale_items(*)').eq('customer_uuid', uuid);
        if (!sales) return { financialSummary: { totalSalesCount: 0, totalRevenue: 0, averageBasketValue: 0 }, topProducts: [] };

        const totalSalesCount = sales.length;
        const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
        const averageBasketValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

        const productMap = new Map();
        sales.forEach(s => {
            s.sale_items?.forEach((item: any) => {
                const current = productMap.get(item.product_uuid) || { name: item.name, quantity: 0, productUuid: item.product_uuid };
                current.quantity += item.quantity;
                productMap.set(item.product_uuid, current);
            });
        });

        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return { financialSummary: { totalSalesCount, totalRevenue, averageBasketValue }, topProducts };
    }

    async recalculateBalance(uuid: string): Promise<void> {
        const [
            { data: sales },
            { data: payments },
            { data: returns }
        ] = await Promise.all([
            this.supabase.from('sales').select('total, amount_paid').eq('customer_uuid', uuid),
            this.supabase.from('payments').select('amount').eq('customer_uuid', uuid),
            this.supabase.from('product_returns').select('total_return_value, amount_refunded').eq('customer_uuid', uuid)
        ]);

        const totalInvoiced = sales?.reduce((sum, s) => sum + s.total, 0) || 0;
        const totalPaidAtSales = sales?.reduce((sum, s) => sum + s.amount_paid, 0) || 0;
        const totalManualPayments = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const totalReturnsValue = returns?.reduce((sum, r) => sum + r.total_return_value, 0) || 0;
        const totalRefunds = returns?.reduce((sum, r) => sum + r.amount_refunded, 0) || 0;

        const creditFromReturns = totalReturnsValue - totalRefunds;
        const currentBalance = totalInvoiced - totalPaidAtSales - totalManualPayments - creditFromReturns;

        const { data: customer } = await this.supabase.from('customers').select('credit_limit').eq('uuid', uuid).single();
        const isOverLimit = customer?.credit_limit > 0 && currentBalance > customer.credit_limit;

        await this.supabase.from('customers').update({
            outstanding_balance: Math.max(0, currentBalance),
            total_spent: totalInvoiced,
            is_over_limit: isOverLimit,
            last_activity_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }).eq('uuid', uuid);
    }

    async create(customer: Partial<Customer>): Promise<Customer> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error("UNAUTHENTICATED");

        const searchName = `${customer.firstName} ${customer.lastName}`.toLowerCase().trim();
        const { data, error } = await this.supabase
            .from('customers')
            .insert([{ 
                ...this.mapToDb(customer), 
                user_id: user.id,
                search_name: searchName,
                outstanding_balance: 0,
                total_spent: 0,
                debt_status: 'none'
            }])
            .select()
            .single();
        if (error) throw new Error(`CUSTOMER_CREATE_FAILURE: ${error.message}`);
        return this.mapFromDb(data);
    }

    async bulkSync(toAdd: any[], toUpdate: any[]): Promise<void> {
        for (const c of toAdd) { await this.create(c); }
        for (const c of toUpdate) { if (c.uuid) await this.update(c.uuid, c); }
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        const { error } = await this.supabase.from('customers').delete().in('uuid', uuids);
        if (error) throw new Error(`CUSTOMER_BULK_DELETE_FAILURE: ${error.message}`);
    }

    async update(uuid: string, customer: Partial<Customer>): Promise<Customer> {
        const searchName = (customer.firstName || customer.lastName) 
            ? `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase().trim()
            : undefined;

        const { data, error } = await this.supabase
            .from('customers')
            .update({
                ...this.mapToDb(customer),
                ...(searchName && { search_name: searchName }),
                updated_at: new Date().toISOString()
            })
            .eq('uuid', uuid)
            .select()
            .single();
        if (error) throw new Error(`CUSTOMER_UPDATE_FAILURE: ${error.message}`);
        return this.mapFromDb(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('customers').delete().eq('uuid', uuid);
        if (error) throw new Error(`CUSTOMER_DELETE_FAILURE: ${error.message}`);
    }

    private mapFromDb(c: any): Customer {
        return {
            uuid: c.uuid,
            user_id: c.user_id,
            firstName: c.first_name,
            lastName: c.last_name,
            searchName: c.search_name,
            phone: c.phone,
            address: c.address,
            category: c.category || 'Standard',
            creditLimit: c.credit_limit || 0,
            totalSpent: c.total_spent || 0,
            outstandingBalance: c.outstanding_balance || 0,
            lastActivityDate: c.last_activity_date,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            debtStatus: c.debt_status,
            isOverLimit: c.is_over_limit,
            isBreadClient: c.is_bread_client,
            bread_type_recurrence: c.bread_type_recurrence,
            bread_quantite_defaut: c.bread_quantite_defaut,
            bread_jours_semaine: c.bread_jours_semaine,
        };
    }

    private mapToDb(c: Partial<Customer>) {
        return {
            first_name: c.firstName,
            last_name: c.lastName,
            phone: c.phone,
            address: c.address,
            category: c.category,
            credit_limit: c.creditLimit,
            is_bread_client: c.isBreadClient,
            bread_type_recurrence: c.bread_type_recurrence,
            bread_quantite_defaut: c.bread_quantite_defaut,
            bread_jours_semaine: c.bread_jours_semaine,
        };
    }
}
