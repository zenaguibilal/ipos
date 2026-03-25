'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Customer, Sale } from '@/lib/types';
import { customerRepository } from '@/repositories/customer.repository';
import { saleRepository } from '@/repositories/sale.repository';
import { returnRepository } from '@/repositories/return.repository';
import { paymentRepository } from '@/repositories/payment.repository';
import { useAppStore } from '@/stores/appStore';

class CustomerService {
    
    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async getCustomers(): Promise<Customer[]> {
        return customerRepository.getAll();
    }
    
    async getCustomerByUuid(uuid: string): Promise<Customer | undefined> {
        return customerRepository.findByUuid(uuid);
    }

    async filterCustomers(filters: { query?: string; status?: string }): Promise<Customer[]> {
        return customerRepository.filter(filters);
    }
    
    async addCustomer(customerData: Partial<Omit<Customer, 'uuid' | 'user_id'>>): Promise<Customer> {
        if (!customerData.firstName || !customerData.lastName) {
            throw new Error("Le prénom et le nom sont requis.");
        }

        const now = new Date();
        const searchName = `${customerData.firstName} ${customerData.lastName}`.toLowerCase();
        
        const existing = await customerRepository.findByName(searchName);
        if (existing) {
            throw new Error("Un client avec ce nom et prénom existe déjà.");
        }
        
        const newCustomer: Customer = {
            uuid: uuidv4(),
            user_id: this.getUserId(),
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            searchName,
            phone: customerData.phone,
            address: customerData.address,
            settlementDay: customerData.settlementDay,
            creditLimit: customerData.creditLimit,
            totalSpent: 0,
            outstandingBalance: 0,
            createdAt: now,
            updatedAt: now,
        };

        return await customerRepository.add(newCustomer);
    }

    async updateCustomer(uuid: string, customerData: Partial<Customer>): Promise<Customer> {
        const existing = await customerRepository.findByUuid(uuid);
        if (!existing) {
            throw new Error("Client non trouvé.");
        }
        
        const searchName = `${customerData.firstName || existing.firstName} ${customerData.lastName || existing.lastName}`.toLowerCase();
        
        const dataToUpdate: Partial<Customer> = {
            ...customerData,
            searchName,
            updatedAt: new Date(),
        };
        
        return await customerRepository.update(uuid, dataToUpdate);
    }

    async deleteCustomer(uuid: string): Promise<void> {
        // The check for existing sales is now orchestrated by the calling component
        // to avoid cross-service dependencies.
        await customerRepository.delete(uuid);
    }
    
    async getStats(): Promise<{ total: number; overdue: number; overLimit: number; }> {
        const allCustomers = await customerRepository.getAll();
        return {
            total: allCustomers.length,
            overdue: allCustomers.filter(c => c.debtStatus === 'overdue').length,
            overLimit: allCustomers.filter(c => c.isOverLimit === true).length,
        };
    }
    
    async getCustomerActivity(customerUuid: string, page: number, pageSize: number): Promise<any[]> {
        // In a real high-performance app, this would be a single server-side query.
        // For now, we fetch separately and combine.
        const [sales, payments, returns] = await Promise.all([
            saleRepository.findByCustomerUuid(customerUuid),
            paymentRepository.findByCustomerUuid(customerUuid),
            returnRepository.findByCustomerUuid(customerUuid)
        ]);

        const activity = [
            ...sales.map(s => ({ ...s, type: 'sale', date: s.createdAt })),
            ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate })),
            ...returns.map(r => ({ ...r, type: 'return', date: r.createdAt })),
        ];

        activity.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return activity.slice(startIndex, endIndex);
    }

    async getCustomerStatementData(customerUuid: string): Promise<{ customer: Customer, unpaidSales: Sale[] }> {
        const customer = await this.getCustomerByUuid(customerUuid);
        if (!customer) throw new Error("Client non trouvé");

        const unpaidSales = await saleRepository.findUnpaidByCustomerUuid(customerUuid);
        return { customer, unpaidSales };
    }

    /**
     * Recalculates a customer's financial status from scratch based on their entire transaction history.
     * This is the single source of truth for customer balance, debt status, and total spent.
     * @param customerUuid The UUID of the customer to recalculate.
     */
    async recalculateCustomerStatus(customerUuid: string): Promise<Customer> {
        const customer = await customerRepository.findByUuid(customerUuid);
        if (!customer) throw new Error("Customer not found during recalculation.");

        const now = new Date();

        // This would be a server-side function (RPC) in a production app for performance
        const [sales, payments, returns] = await Promise.all([
             saleRepository.findByCustomerUuid(customerUuid),
             paymentRepository.findByCustomerUuid(customerUuid),
             returnRepository.findByCustomerUuid(customerUuid)
        ]);
        

        const totalInvoiced = sales.reduce((sum, s) => sum + s.total, 0);
        const totalPaidViaPayments = payments.reduce((sum, p) => sum + p.amount, 0);
        const netCreditFromReturns = returns.reduce((sum, r) => sum + (r.totalReturnValue - r.amountRefunded), 0);
        
        // Amount paid directly on a sale is already part of sales data
        const totalPaidOnSales = sales.reduce((sum, s) => sum + s.amountPaid, 0);
        
        // Balance calculation needs to be precise
        const newBalance = totalInvoiced - totalPaidViaPayments - totalPaidOnSales - netCreditFromReturns;
        const totalSpent = totalInvoiced;

        const isOverLimit = customer.creditLimit != null && customer.creditLimit > 0 ? newBalance > customer.creditLimit : false;

        let debtStatus: Customer['debtStatus'] = 'none';
        if (newBalance > 0.01) {
            const unpaidSales = sales.filter(s => s.paymentStatus !== 'paid');
            const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < now);
            debtStatus = isOverdue ? 'overdue' : 'due_soon';
        }

        const customerUpdate: Partial<Customer> = {
            totalSpent,
            outstandingBalance: newBalance,
            lastActivityDate: now,
            isOverLimit,
            debtStatus,
            updatedAt: now,
        };
        
        return await customerRepository.update(customer.uuid, customerUpdate);
    }
}

export const customerService = new CustomerService();
