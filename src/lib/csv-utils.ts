
'use client';

import Papa from 'papaparse';
import { api } from './api-client';
import type { Customer, ImportAnalysis, Product, ProductImportAnalysis, Supplier, Expense, Sale, ProductReturn } from './types';

/**
 * @fileOverview THE CSV SINGULARITY
 * المركز السيادي والوحيد لكافة عمليات استيراد وتصدير البيانات في iPOS.
 */

export class CsvImporter {
    // --- ANALYSIS TOOLS (Import) ---
    
    static async analyzeCustomers(file: File): Promise<ImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const existingCustomers = await api.get<Customer[]>('customers');
                        const existingNames = new Map(existingCustomers.map(c => [c.searchName, c]));

                        const analysis: ImportAnalysis = {
                            customersToAdd: [],
                            customersToUpdate: [],
                            skippedRows: [],
                            errorRows: [],
                            totalRows: results.data.length,
                        };

                        for (const row of results.data as any[]) {
                            const firstName = row.firstName || row.prenom || row.first_name;
                            const lastName = row.lastName || row.nom || row.last_name;
                            if (!firstName || !lastName) {
                                analysis.errorRows.push({ ...row, error: "Identité manquante" });
                                continue;
                            }
                            const sName = `${firstName} ${lastName}`.toLowerCase().trim();
                            const existing = existingNames.get(sName);
                            if (existing) analysis.customersToUpdate.push({ ...row, uuid: existing.uuid });
                            else analysis.customersToAdd.push(row);
                        }
                        resolve(analysis);
                    } catch (e) { reject(e); }
                },
                error: reject
            });
        });
    }

    static async analyzeProducts(file: File): Promise<ProductImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const existingProducts = await api.get<Product[]>('products');
                        const existingNames = new Map(existingProducts.map(p => [p.name.toLowerCase().trim(), p]));

                        const analysis: ProductImportAnalysis = {
                            productsToAdd: [],
                            productsToUpdate: [],
                            skippedRows: [],
                            errorRows: [],
                            totalRows: results.data.length,
                        };

                        for (const row of results.data as any[]) {
                            if (!row.name || !row.price) {
                                analysis.errorRows.push({ ...row, error: "Nom ou Prix manquant" });
                                continue;
                            }
                            const existing = existingNames.get(row.name.toLowerCase().trim());
                            if (existing) analysis.productsToUpdate.push({ ...row, uuid: existing.uuid });
                            else analysis.productsToAdd.push(row);
                        }
                        resolve(analysis);
                    } catch (e) { reject(e); }
                },
                error: reject
            });
        });
    }

    static async analyzeSuppliers(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const suppliers = await api.get<Supplier[]>('suppliers');
                        const existingNames = new Map(suppliers.map(s => [s.name.toLowerCase().trim(), s]));
                        const toAdd = [], toUpdate = [], errors = [];
                        for (const row of results.data as any[]) {
                            if (!row.name) { errors.push({...row, error: "Nom manquant"}); continue; }
                            const existing = existingNames.get(row.name.toLowerCase().trim());
                            if (existing) toUpdate.push({...row, uuid: existing.uuid});
                            else toAdd.push(row);
                        }
                        resolve({ toAdd, toUpdate, errors, total: results.data.length });
                    } catch (e) { reject(e); }
                },
                error: reject
            });
        });
    }

    // --- EXPORT TOOLS ---

    static download(data: any[], filename: string) {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    static exportProducts(products: Product[]) {
        this.download(products.map(p => ({
            'Nom': p.name,
            'Catégorie': p.category,
            'Prix Vente': p.price,
            'Prix Achat': p.purchasePrice,
            'Stock': p.quantity,
            'Unité': p.unite
        })), 'inventory-export');
    }

    static exportCustomers(customers: Customer[]) {
        this.download(customers.map(c => ({
            'Nom Complet': `${c.firstName} ${c.lastName}`,
            'Téléphone': c.phone || '',
            'Solde': c.outstandingBalance,
            'Total Dépensé': c.totalSpent,
            'Catégorie': c.category
        })), 'customers-export');
    }

    static exportSuppliers(suppliers: Supplier[]) {
        this.download(suppliers.map(s => ({
            'Nom': s.name,
            'Contact': s.contactPerson || '',
            'Téléphone': s.phone || '',
            'Solde Dû': s.balance
        })), 'suppliers-export');
    }

    static exportExpenses(expenses: Expense[]) {
        this.download(expenses.map(e => ({
            'Date': new Date(e.expenseDate).toLocaleDateString(),
            'Description': e.description,
            'Catégorie': e.category,
            'Montant': e.amount
        })), 'expenses-export');
    }

    static exportSales(sales: Sale[]) {
        this.download(sales.map(s => ({
            'Facture': s.invoiceNumber,
            'Date': new Date(s.createdAt).toLocaleString(),
            'Total': s.total,
            'Payé': s.amountPaid,
            'Statut': s.paymentStatus
        })), 'sales-history-export');
    }

    static exportReturns(returns: ProductReturn[]) {
        this.download(returns.map(r => ({
            'Référence': r.uuid.substring(0,8),
            'Facture Origine': r.originalInvoiceNumber,
            'Date': new Date(r.createdAt).toLocaleString(),
            'Valeur Retour': r.totalReturnValue,
            'Remboursé': r.amountRefunded
        })), 'returns-export');
    }
}
