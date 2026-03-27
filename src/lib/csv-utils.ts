
'use client';

import Papa from 'papaparse';
import { api } from './api-client';
import type { Customer, ImportAnalysis, Product, ProductImportAnalysis, Supplier, Expense } from './types';

/**
 * @fileOverview Standardized CSV Logic (The Only Authority for CSV Operations)
 */

export class CsvImporter {
    // --- CUSTOMERS ---
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

    // --- PRODUCTS ---
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

    // --- SUPPLIERS ---
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
    static exportToCSV(data: any[], filename: string) {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    static exportProducts(products: Product[]) {
        this.exportToCSV(products.map(p => ({
            'Nom': p.name,
            'Catégorie': p.category,
            'Prix Vente': p.price,
            'Prix Achat': p.purchasePrice,
            'Stock': p.quantity,
            'Unité': p.unite
        })), 'inventory');
    }

    static exportCustomers(customers: Customer[]) {
        this.exportToCSV(customers.map(c => ({
            'Nom Complet': `${c.firstName} ${c.lastName}`,
            'Téléphone': c.phone || '',
            'Solde': c.outstandingBalance,
            'Catégorie': c.category
        })), 'customers');
    }

    static exportExpenses(expenses: Expense[]) {
        this.exportToCSV(expenses.map(e => ({
            'Date': e.expenseDate,
            'Description': e.description,
            'Catégorie': e.category,
            'Montant': e.amount
        })), 'expenses');
    }
}
