
'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Customer, Sale, ImportAnalysis } from '@/lib/types';
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

    async filterCustomers(filters: { query?: string; status?: string; page?: number; pageSize?: number; sortBy?: string }): Promise<{ data: Customer[], total: number }> {
        try {
            const result = await customerRepository.filter(filters);
            return { data: result.data, total: result.count };
        } catch (error) {
            throw error;
        }
    }
    
    async addCustomer(customerData: Partial<Omit<Customer, 'uuid' | 'user_id'>>): Promise<Customer> {
        try {
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
                notes: customerData.notes,
                settlementDay: customerData.settlementDay,
                creditLimit: customerData.creditLimit,
                totalSpent: 0,
                outstandingBalance: 0,
                createdAt: now,
                updatedAt: now,
            };

            return await customerRepository.add(newCustomer);
        } catch (error) {
            throw error;
        }
    }

    async updateCustomer(uuid: string, customerData: Partial<Customer>): Promise<Customer> {
        try {
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
        } catch (error) {
            throw error;
        }
    }

    async deleteCustomer(uuid: string): Promise<void> {
        try {
            const sales = await saleRepository.findByCustomerUuid(uuid);
            if (sales.length > 0) {
                throw new Error("Impossible de supprimer un client avec un historique de ventes.");
            }
            await customerRepository.delete(uuid);
        } catch (error) {
            throw error;
        }
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        try {
            for (const uuid of uuids) {
                const sales = await saleRepository.findByCustomerUuid(uuid);
                if (sales.length > 0) {
                    const customer = await customerRepository.findByUuid(uuid);
                    throw new Error(`Suppression impossible: Le client "${customer?.firstName} ${customer?.lastName}" a un historique de transactions.`);
                }
            }
            await customerRepository.bulkDelete(uuids);
        } catch (error) {
            throw error;
        }
    }
    
    async getStats(): Promise<{ total: number; overdue: number; overLimit: number; totalDebt: number }> {
        try {
            const allCustomers = await customerRepository.getAll();
            return {
                total: allCustomers.length,
                overdue: allCustomers.filter(c => c.debtStatus === 'overdue').length,
                overLimit: allCustomers.filter(c => c.isOverLimit === true).length,
                totalDebt: allCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0),
            };
        } catch (error) {
            throw error;
        }
    }
    
    async getCustomerActivity(customerUuid: string, page: number, pageSize: number): Promise<any[]> {
        try {
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
        } catch (error) {
            throw error;
        }
    }

    async getCustomerStatementData(customerUuid: string): Promise<{ customer: Customer, unpaidSales: Sale[] }> {
        try {
            const customer = await this.getCustomerByUuid(customerUuid);
            if (!customer) throw new Error("Client non trouvé");

            const unpaidSales = await saleRepository.findUnpaidByCustomerUuid(customerUuid);
            return { customer, unpaidSales };
        } catch (error) {
            throw error;
        }
    }

    async recalculateCustomerStatus(customerUuid: string): Promise<Customer> {
        try {
            const customer = await customerRepository.findByUuid(customerUuid);
            if (!customer) throw new Error("Customer not found during recalculation.");

            const now = new Date();

            const [sales, payments, returns] = await Promise.all([
                 saleRepository.findByCustomerUuid(customerUuid),
                 paymentRepository.findByCustomerUuid(customerUuid),
                 returnRepository.findByCustomerUuid(customerUuid)
            ]);
            

            const totalInvoiced = sales.reduce((sum, s) => sum + s.total, 0);
            const totalPaidViaPayments = payments.reduce((sum, p) => sum + p.amount, 0);
            const netCreditFromReturns = returns.reduce((sum, r) => sum + (r.totalReturnValue - r.amountRefunded), 0);
            
            const totalPaidOnSales = sales.reduce((sum, s) => sum + s.amountPaid, 0);
            
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
        } catch (error) {
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
                        const analysis = await this.analyzeImport(results.data);
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

    async analyzeImport(csvData: any[]): Promise<ImportAnalysis> {
        try {
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
                    analysis.errorRows.push({ ...row, error: "Prénom ou nom manquant" });
                    continue;
                }
                
                const searchName = `${firstName} ${lastName}`.toLowerCase().trim();
                const existingCustomer = existingNames.get(searchName);

                const customerData = {
                    firstName,
                    lastName,
                    phone: row.phone || row.telephone,
                    address: row.address || row.adresse,
                    notes: row.notes || row.observations,
                    creditLimit: row.creditLimit ? parseFloat(row.creditLimit) : undefined,
                    outstandingBalance: row.outstandingBalance ? parseFloat(row.outstandingBalance) : undefined,
                };

                if (existingCustomer) {
                    analysis.customersToUpdate.push({ ...customerData, uuid: existingCustomer.uuid });
                } else {
                    analysis.customersToAdd.push(customerData);
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

            const toAdd = confirmedData.toAdd.map(c => ({
                ...c,
                uuid: uuidv4(),
                user_id: userId,
                searchName: `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
                totalSpent: 0,
                outstandingBalance: c.outstandingBalance || 0,
                createdAt: now,
                updatedAt: now,
            }));

             const toUpdate = confirmedData.toUpdate.map(c => ({
                ...c,
                searchName: `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
                updatedAt: now,
            }));
            
            const upsertData = [...toAdd, ...toUpdate];
            
            if (upsertData.length > 0) {
                await customerRepository.bulkUpsert(upsertData);
            }
        } catch (error) {
            throw error;
        }
    }

    async exportToCSV(customers: Customer[]) {
        const data = customers.map(c => ({
            'Prénom': c.firstName,
            'Nom': c.lastName,
            'Téléphone': c.phone || '',
            'Adresse': c.address || '',
            'Notes': c.notes || '',
            'Délai Paiement (jours)': c.settlementDay || '',
            'Limite de Crédit': c.creditLimit || 0,
            'Total Dépensé': c.totalSpent,
            'Solde Impayé': c.outstandingBalance,
            'Client de Pain': c.isBreadClient ? 'Oui' : 'Non',
        }));

        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `clients-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const customerService = new CustomerService();
