
'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Customer, Sale, ImportAnalysis, CustomerTopProduct } from '@/lib/types';
import { customerRepository } from '@/repositories/customer.repository';
import { saleRepository } from '@/repositories/sale.repository';
import { returnRepository } from '@/repositories/return.repository';
import { paymentRepository } from '@/repositories/payment.repository';
import { useAppStore } from '@/stores/appStore';
import Papa from 'papaparse';

class CustomerService {
    
    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async getCustomers(): Promise<Customer[]> {
        try {
            return await customerRepository.getAll();
        } catch (error) {
            throw error;
        }
    }
    
    async getCustomerByUuid(uuid: string): Promise<Customer | undefined> {
        try {
            return await customerRepository.findByUuid(uuid);
        } catch (error) {
            throw error;
        }
    }

    async filterCustomers(filters: { query?: string; status?: string; category?: string; page?: number; pageSize?: number; sortBy?: string }): Promise<{ data: Customer[], total: number }> {
        try {
            const result = await customerRepository.filter(filters);
            return { data: result.data, total: result.count };
        } catch (error) {
            throw error;
        }
    }

    async getCategories(): Promise<string[]> {
        try {
            return await customerRepository.getUniqueCategories();
        } catch (error) {
            throw error;
        }
    }
    
    async addCustomer(customerData: Partial<Omit<Customer, 'uuid' | 'user_id' | 'totalSpent' | 'outstandingBalance'>>): Promise<Customer> {
        try {
            if (!customerData.firstName || !customerData.lastName) {
                throw new Error("Les champs Prénom et Nom sont obligatoires.");
            }

            const now = new Date();
            const searchName = `${customerData.firstName} ${customerData.lastName}`.toLowerCase().trim();
            
            const existing = await customerRepository.findByName(searchName);
            if (existing) {
                throw new Error("Un client portant ce nom exact existe déjà.");
            }
            
            const newCustomer: Customer = {
                uuid: uuidv4(),
                user_id: this.getUserId(),
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                searchName,
                phone: customerData.phone,
                address: customerData.address,
                notes: customerData.notes,
                category: customerData.category || 'Standard',
                settlementDay: customerData.settlementDay,
                creditLimit: customerData.creditLimit || 0,
                totalSpent: 0,
                outstandingBalance: 0,
                createdAt: now,
                updatedAt: now,
                debtStatus: 'none',
                isOverLimit: false,
                isBreadClient: customerData.isBreadClient || false,
                bread_type_recurrence: customerData.bread_type_recurrence || 'aucun',
                bread_quantite_defaut: customerData.bread_quantite_defaut || 0,
            };

            return await customerRepository.add(newCustomer);
        } catch (error) {
            throw error;
        }
    }

    async updateCustomer(uuid: string, customerData: Partial<Customer>): Promise<Customer> {
        try {
            const existing = await customerRepository.findByUuid(uuid);
            if (!existing) throw new Error("Client introuvable.");
            
            const updatedData = { ...customerData };
            if (customerData.firstName || customerData.lastName) {
                updatedData.searchName = `${customerData.firstName || existing.firstName} ${customerData.lastName || existing.lastName}`.toLowerCase().trim();
            }
            
            updatedData.updatedAt = new Date();
            return await customerRepository.update(uuid, updatedData);
        } catch (error) {
            throw error;
        }
    }

    async deleteCustomer(uuid: string): Promise<void> {
        try {
            const sales = await saleRepository.findByCustomerUuid(uuid);
            if (sales.length > 0) {
                throw new Error("Impossible de supprimer un client possédant un historique de transactions.");
            }
            await customerRepository.delete(uuid);
        } catch (error) {
            throw error;
        }
    }

    async getCustomerTopProducts(customerUuid: string): Promise<CustomerTopProduct[]> {
        const sales = await saleRepository.findByCustomerUuid(customerUuid);
        const productMap = new Map<string, { name: string, quantity: number, totalAmount: number, category: string }>();

        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!item.productUuid) return;
                const existing = productMap.get(item.productUuid) || { name: item.name, quantity: 0, totalAmount: 0, category: 'N/A' };
                existing.quantity += item.quantity;
                existing.totalAmount += item.price * item.quantity;
                productMap.set(item.productUuid, existing);
            });
        });

        return Array.from(productMap.entries())
            .map(([productUuid, data]) => ({ productUuid, ...data }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }

    async getCustomerFinancialSummary(customerUuid: string): Promise<{ totalSalesCount: number, averageBasketValue: number }> {
        const sales = await saleRepository.findByCustomerUuid(customerUuid);
        const totalSalesCount = sales.length;
        const totalSpent = sales.reduce((sum, s) => sum + s.total, 0);
        const averageBasketValue = totalSalesCount > 0 ? totalSpent / totalSalesCount : 0;
        return { totalSalesCount, averageBasketValue };
    }

    async getCustomerActivity(customerUuid: string, page: number = 1, pageSize: number = 15): Promise<any[]> {
        const [sales, payments, returns] = await Promise.all([
            saleRepository.findByCustomerUuid(customerUuid),
            paymentRepository.findByCustomerUuid(customerUuid),
            returnRepository.findByCustomerUuid(customerUuid)
        ]);

        const combined = [
            ...sales.map(s => ({ ...s, type: 'sale' as const, date: s.createdAt })),
            ...payments.map(p => ({ ...p, type: 'payment' as const, date: p.paymentDate })),
            ...returns.map(r => ({ ...r, type: 'return' as const, date: r.createdAt }))
        ];

        return combined.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
    }

    async getCustomerStatementData(customerUuid: string): Promise<{ customer: Customer, unpaidSales: Sale[] }> {
        const [customer, unpaidSales] = await Promise.all([
            this.getCustomerByUuid(customerUuid),
            saleRepository.findUnpaidByCustomerUuid(customerUuid)
        ]);
        if (!customer) throw new Error("Client introuvable");
        return { customer, unpaidSales };
    }

    async recalculateCustomerStatus(customerUuid: string): Promise<Customer> {
        try {
            const customer = await customerRepository.findByUuid(customerUuid);
            if (!customer) throw new Error("Customer mismatch during recalculation.");

            const now = new Date();
            const [sales, payments, returns] = await Promise.all([
                 saleRepository.findByCustomerUuid(customerUuid),
                 paymentRepository.findByCustomerUuid(customerUuid),
                 returnRepository.findByCustomerUuid(customerUuid)
            ]);
            
            const totalInvoiced = sales.reduce((sum, s) => sum + s.total, 0);
            const totalPaidViaManualPayments = payments.reduce((sum, p) => sum + p.amount, 0);
            const totalCreditFromReturns = returns.reduce((sum, r) => sum + (r.totalReturnValue - r.amountRefunded), 0);
            const totalPaidAtCheckout = sales.reduce((sum, s) => sum + s.amountPaid, 0);
            
            const newBalance = totalInvoiced - totalPaidAtCheckout - totalCreditFromReturns - totalPaidViaManualPayments;
            const isOverLimit = customer.creditLimit > 0 ? newBalance > customer.creditLimit : false;

            let debtStatus: Customer['debtStatus'] = 'none';
            if (newBalance > 0.01) {
                const isOverdue = sales.some(s => s.paymentStatus !== 'paid' && s.dueDate && new Date(s.dueDate) < now);
                debtStatus = isOverdue ? 'overdue' : 'due_soon';
            }

            return await customerRepository.update(customer.uuid, {
                totalSpent: totalInvoiced,
                outstandingBalance: Math.max(0, newBalance),
                lastActivityDate: now,
                isOverLimit,
                debtStatus,
                updatedAt: now,
            });
        } catch (error) {
            console.error("Critical: Recalculation failed", error);
            throw error;
        }
    }

    async parseAndAnalyzeImport(file: File): Promise<ImportAnalysis> {
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
                error: (error) => reject(error)
            });
        });
    }

    private async _analyzeImportData(csvData: any[]): Promise<ImportAnalysis> {
        const existingCustomers = await this.getCustomers();
        const existingNames = new Map(existingCustomers.map(c => [c.searchName, c]));

        const analysis: ImportAnalysis = {
            customersToAdd: [],
            customersToUpdate: [],
            skippedRows: [],
            errorRows: [],
            totalRows: csvData.length,
        };

        for (const row of csvData) {
            const firstName = row.firstName || row.prenom || row.first_name;
            const lastName = row.lastName || row.nom || row.last_name;

            if (!firstName || !lastName) {
                analysis.errorRows.push({ ...row, error: "Identification manquante" });
                continue;
            }
            
            const sName = `${firstName} ${lastName}`.toLowerCase().trim();
            const existing = existingNames.get(sName);

            const customerData = {
                firstName,
                lastName,
                phone: row.phone || row.telephone,
                address: row.address || row.adresse,
                notes: row.notes,
                category: row.category || 'Standard',
                creditLimit: row.creditLimit ? parseFloat(row.creditLimit) : 0,
                outstandingBalance: row.outstandingBalance ? parseFloat(row.outstandingBalance) : 0,
            };

            if (existing) analysis.customersToUpdate.push({ ...customerData, uuid: existing.uuid });
            else analysis.customersToAdd.push(customerData);
        }
        return analysis;
    }

    async executeImport(confirmedData: { toAdd: any[], toUpdate: any[] }): Promise<void> {
        const userId = this.getUserId();
        const now = new Date();

        const toAdd = confirmedData.toAdd.map(c => ({
            ...c,
            uuid: uuidv4(),
            user_id: userId,
            searchName: `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
            totalSpent: 0,
            outstandingBalance: c.outstandingBalance || 0,
            createdAt: now,
            updatedAt: now,
            debtStatus: 'none',
            isOverLimit: false,
            isBreadClient: false,
            bread_type_recurrence: 'aucun',
            bread_quantite_defaut: 0,
        }));

        const toUpdate = confirmedData.toUpdate.map(c => ({
            ...c,
            searchName: `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
            updatedAt: now,
        }));
        
        if ([...toAdd, ...toUpdate].length > 0) {
            await customerRepository.bulkUpsert([...toAdd, ...toUpdate]);
        }
    }

    async exportToCSV(customers: Customer[]) {
        const data = customers.map(c => ({
            'Prénom': c.firstName,
            'Nom': c.lastName,
            'Téléphone': c.phone || '',
            'Adresse': c.address || '',
            'Catégorie': c.category,
            'Total Dépensé': c.totalSpent,
            'Solde Impayé': c.outstandingBalance,
            'Limite Crédit': c.creditLimit,
        }));

        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `clients-ipos-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const customerService = new CustomerService();
