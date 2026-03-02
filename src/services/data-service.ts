'use client';

import { db } from '@/lib/database';
import { toast } from 'sonner';
import type { SaleItem, SalePayment, Sale, StockIntakeItem, Product, BreadOrder, CompanyProfile, ProductReturn, DailyBreadOrder, ReturnItem, Expense, Cart, Customer, Payment, Setting } from '@/lib/types';
import type { ImportAnalysis } from '@/components/customers/import-preview-dialog';

type TableName = 'products' | 'customers' | 'sales' | 'payments' | 'stockIntakes' | 'returns' | 'breadCustomers' | 'dailyBreadOrders' | 'companyProfile' | 'carts' | 'expenses' | 'settings';

class DataService {

  // Generic Readers
  async getAll<T>(table: TableName): Promise<T[]> {
    return db.table(table).toArray();
  }

  async getById<T>(table: TableName, id: number | string): Promise<T | undefined> {
    return db.table(table).get(id);
  }
  
  // Settings
  async getSetting(id: string): Promise<Setting | undefined> {
    return this.getById<Setting>('settings', id);
  }

  async setSetting(id: string, value: any): Promise<string> {
    return db.transaction('rw', db.settings, () => {
      return db.settings.put({ id, value });
    });
  }

  // Company Profile
  async updateCompanyProfile(profileData: Partial<CompanyProfile>): Promise<number> {
    return db.transaction('rw', db.companyProfile, async () => {
      const dataToSave: CompanyProfile = {
        ...profileData,
        id: 1, // Singleton
        updatedAt: new Date()
      };
      return db.companyProfile.put(dataToSave);
    });
  }

  // Cart
  async saveCart(cart: Cart): Promise<string> {
     return db.transaction('rw', db.carts, () => {
      return db.carts.put(cart);
    });
  }

  async deleteCart(cartId: string): Promise<void> {
    return db.transaction('rw', db.carts, () => {
      return db.carts.delete(cartId);
    });
  }

  // Product
  async addProduct(productData: Omit<Product, 'id'>): Promise<number> {
    return db.transaction('rw', db.products, () => {
      return db.products.add(productData as Product);
    });
  }
  async updateProduct(id: number, productData: Partial<Product>): Promise<number> {
     return db.transaction('rw', db.products, () => {
      return db.products.update(id, productData);
    });
  }
  async deleteProduct(id: number): Promise<void> {
     return db.transaction('rw', db.products, () => {
      return db.products.delete(id);
    });
  }

  // Customer
  async addCustomer(customerData: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance'>): Promise<number> {
    return db.transaction('rw', db.customers, () => {
      const newCustomer: Omit<Customer, 'id'> = {
        ...customerData,
        totalSpent: 0,
        outstandingBalance: 0,
        lastActivityDate: new Date(),
      };
      return db.customers.add(newCustomer as Customer);
    });
  }
  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<number> {
    return db.transaction('rw', db.customers, () => {
      return db.customers.update(id, customerData);
    });
  }
  async deleteCustomer(id: number): Promise<void> {
    return db.transaction('rw', db.customers, () => {
      return db.customers.delete(id);
    });
  }
  
  // Expense
  async addExpense(expenseData: Omit<Expense, 'id'>): Promise<number> {
     return db.transaction('rw', db.expenses, () => {
      return db.expenses.add(expenseData as Expense);
    });
  }
  async updateExpense(id: number, expenseData: Partial<Expense>): Promise<number> {
    return db.transaction('rw', db.expenses, () => {
      return db.expenses.update(id, expenseData);
    });
  }
  async deleteExpense(id: number): Promise<void> {
    return db.transaction('rw', db.expenses, () => {
      return db.expenses.delete(id);
    });
  }

  // Main Transactional Methods
  async addPayment(paymentData: Omit<Payment, 'id'>): Promise<number> {
    return db.transaction('rw', db.payments, db.customers, async () => {
        const { customerId, amount } = paymentData;
        if (!customerId) throw new Error("ID de client manquant pour le paiement.");

        const customer = await db.customers.get(customerId);
        if (!customer) throw new Error("Client non trouvé pour le paiement.");

        const newOutstandingBalance = customer.outstandingBalance - amount;
        await db.customers.update(customerId, { 
            outstandingBalance: newOutstandingBalance,
            lastActivityDate: new Date() 
        });

        return await db.payments.add(paymentData as Payment);
    });
  }

  async addSale(saleData: {
    items: SaleItem[]; subtotal: number; discountType?: 'fixed' | 'percentage';
    discountAmount?: number; total: number; amountPaid: number;
    payments: SalePayment[]; customerId?: number; customerName?: string;
    breadOrderDate?: string;
  }): Promise<number> {
    return db.transaction('rw', db.products, db.sales, db.customers, async () => {
      // 1. Update product stock
      for (const item of saleData.items) {
        if (typeof item.id === 'number') {
          const product = await db.products.get(item.id);
          if (product) {
            if (product.quantity < item.quantity) throw new Error(`Stock insuffisant pour ${product.name}.`);
            await db.products.update(item.id, { quantity: product.quantity - item.quantity });
          }
        }
      }

      // 2. Update customer balance if applicable
      if (saleData.customerId) {
        const customer = await db.customers.get(saleData.customerId);
        if (customer) {
          await db.customers.update(saleData.customerId, {
            totalSpent: customer.totalSpent + saleData.total,
            outstandingBalance: customer.outstandingBalance + (saleData.total - saleData.amountPaid),
            lastActivityDate: new Date(),
          });
        }
      }

      // 3. Create the sale record
      const newSale: Omit<Sale, 'id'> = {
        ...saleData,
        invoiceNumber: `INV-${Date.now()}`,
        remainingBalance: saleData.total - saleData.amountPaid,
        paymentStatus: saleData.total - saleData.amountPaid <= 0.01 ? 'paid' : saleData.amountPaid > 0 ? 'partial' : 'unpaid',
      };
      return await db.sales.add(newSale as Sale);
    });
  }

  async deleteSale(saleId: number): Promise<void> {
    return db.transaction('rw', db.sales, db.products, db.customers, async () => {
        const sale = await db.sales.get(saleId);
        if (!sale) throw new Error("Vente non trouvée.");

        // 1. Restore product stock
        for (const item of sale.items) {
            if (typeof item.id === 'number') {
                const product = await db.products.get(item.id);
                if (product) await db.products.update(item.id, { quantity: product.quantity + item.quantity });
            }
        }

        // 2. Revert customer balance
        if (sale.customerId) {
          const customer = await db.customers.get(sale.customerId);
          if (customer) {
            await db.customers.update(sale.customerId, {
              totalSpent: customer.totalSpent - sale.total,
              outstandingBalance: customer.outstandingBalance - (sale.total - sale.amountPaid),
            });
          }
        }

        // 3. Delete the sale
        await db.sales.delete(saleId);
    });
  }

  async addReturn(returnData: {
    foundSale: Sale; returnedItems: ReturnItem[]; totalReturnValue: number; amountRefunded: number; notes: string;
  }): Promise<void> {
      return db.transaction('rw', db.products, db.returns, db.customers, async () => {
        // 1. Update product stock for restocked items
        for (const item of returnData.returnedItems) {
            if (item.wasRestocked && item.productId) {
                const product = await db.products.get(item.productId);
                if (product) await db.products.update(item.productId, { quantity: product.quantity + item.quantity });
            }
        }

        // 2. Adjust customer balance
        const { customerId, customerName, originalInvoiceNumber, originalSaleId } = returnData.foundSale;
        if (customerId) {
          const customer = await db.customers.get(customerId);
          if (customer) {
            await db.customers.update(customerId, {
              totalSpent: customer.totalSpent - returnData.totalReturnValue,
              outstandingBalance: customer.outstandingBalance - (returnData.totalReturnValue - returnData.amountRefunded),
              lastActivityDate: new Date(),
            });
          }
        }

        // 3. Create the return record
        const newReturn: Omit<ProductReturn, 'id'> = {
            originalSaleId, originalInvoiceNumber, customerId, customerName,
            items: returnData.returnedItems,
            totalReturnValue: returnData.totalReturnValue,
            amountRefunded: returnData.amountRefunded,
            notes: returnData.notes,
        };
        await db.returns.add(newReturn as ProductReturn);
    });
  }
  
  async deleteReturn(returnId: number): Promise<void> {
      return db.transaction('rw', db.returns, db.products, db.customers, async () => {
        const returnDoc = await db.returns.get(returnId);
        if (!returnDoc) throw new Error("Retour non trouvé.");
        
        // 1. Revert stock changes
        for (const item of returnDoc.items) {
            if (item.wasRestocked && item.productId) {
                const product = await db.products.get(item.productId);
                if (product) await db.products.update(item.productId, { quantity: Math.max(0, product.quantity - item.quantity) });
            }
        }

        // 2. Revert customer balance changes
        if (returnDoc.customerId) {
          const customer = await db.customers.get(returnDoc.customerId);
          if (customer) {
            await db.customers.update(returnDoc.customerId, {
              totalSpent: customer.totalSpent + returnDoc.totalReturnValue,
              outstandingBalance: customer.outstandingBalance + (returnDoc.totalReturnValue - returnDoc.amountRefunded),
            });
          }
        }

        // 3. Delete the return document
        await db.returns.delete(returnId);
    });
  }

  async recordStockIntake(intakeData: {
    supplier: string; invoiceNumber: string; invoiceDate: Date; items: StockIntakeItem[]; totalValue: number;
  }): Promise<void> {
      return db.transaction('rw', db.products, db.stockIntakes, async () => {
        const intakeItemsForDb = [];
        for (const item of intakeData.items) {
            if (!item.name || item.quantity <= 0 || item.purchasePrice < 0 || item.price < 0) throw new Error(`Ligne invalide pour: ${item.name || 'inconnu'}.`);
            
            let productId = item.productId;
            if (item.isNew) {
                productId = await this.addProduct({
                    name: item.name, category: item.category, price: item.price,
                    purchasePrice: item.purchasePrice, quantity: item.quantity,
                    minStockLevel: 1, barcodes: item.barcodes, imageUrl: '',
                });
            } else if (productId) {
                const product = await this.getById<Product>('products', productId);
                if (!product) throw new Error(`Produit avec ID ${productId} non trouvé.`);
                await this.updateProduct(productId, {
                    quantity: product.quantity + item.quantity,
                    purchasePrice: item.purchasePrice, price: item.price,
                });
            }
            intakeItemsForDb.push({ productId, productName: item.name, quantityReceived: item.quantity, purchasePrice: item.purchasePrice });
        }
        await db.stockIntakes.add({ ...intakeData, items: intakeItemsForDb } as StockIntake);
    });
  }

  async importCustomers(analysis: ImportAnalysis) {
    let importedCount = 0;
    let updatedCount = 0;
    
    return db.transaction('rw', db.customers, async () => {
      // Process updates first
      for (const item of analysis.customersToUpdate) {
        const { existingCustomer, phone, debtAmount } = item;
        const customerId = existingCustomer.id;
        
        const updatePayload: Partial<Customer> = {};
        if (phone && existingCustomer.phone !== phone) updatePayload.phone = phone;

        const currentBalance = existingCustomer.outstandingBalance;
        const debtDifference = debtAmount !== null ? debtAmount - currentBalance : 0;
        
        if (Math.abs(debtDifference) > 0.01) {
            updatePayload.outstandingBalance = debtAmount;
            // We assume the total spent is responsible for the debt, for simplicity.
            // A more complex import could differentiate between spent and paid.
            updatePayload.totalSpent = existingCustomer.totalSpent + debtDifference;
        }

        if (Object.keys(updatePayload).length > 0) {
            await db.customers.update(customerId, updatePayload);
            updatedCount++;
        }
      }
      
      // Process new customers
      for (const item of analysis.customersToAdd) {
        const { firstName, lastName, phone, debtAmount } = item;
        const customerData = { 
            firstName, 
            lastName, 
            phone,
            totalSpent: debtAmount > 0 ? debtAmount : 0,
            outstandingBalance: debtAmount > 0 ? debtAmount : 0,
        };
        await this.addCustomer(customerData);
        importedCount++;
      }
    }).then(() => ({ importedCount, updatedCount }));
  }

  // --- Bread-specific methods ---

  async handleBreadOrderStatusUpdate(params: {
      order: BreadOrder; field: 'isPaid' | 'isDelivered'; value: boolean; dateString: string;
  }) {
      const { order, field, value, dateString } = params;
      
      return db.transaction('rw', db.dailyBreadOrders, db.sales, db.customers, db.companyProfile, async () => {
        const companyProfile = await this.getById<CompanyProfile>('companyProfile', 1);
        const { breadPrice, breadPurchasePrice } = companyProfile || {};
        if (field === 'isPaid' && value && (!breadPrice || breadPrice <= 0)) throw new Error("Prix du pain non défini dans les paramètres.");

        const todaysOrder = order.todaysOrder;
        
        if (field === 'isPaid') {
          if (value) { // Mark as paid
            if (todaysOrder?.isPaid) return;
            const quantity = todaysOrder?.quantity ?? order.defaultOrderQuantity;
            const total = quantity * breadPrice!;
            const newSaleId = await this.addSale({
              items: [{ id: 'BREAD_PRODUCT', name: 'Pain', price: breadPrice!, purchasePrice: breadPurchasePrice ?? 0, quantity }],
              subtotal: total, total, amountPaid: total,
              payments: [{ method: 'cash', amount: total }], customerId: order.id, customerName: order.name,
              breadOrderDate: dateString,
            });

            if (todaysOrder?.id) {
              await db.dailyBreadOrders.update(todaysOrder.id, { isPaid: true, saleId: newSaleId });
            } else {
              await db.dailyBreadOrders.add({ breadCustomerId: order.id, customerName: order.name, date: dateString, quantity, isPaid: true, isDelivered: todaysOrder?.isDelivered ?? false, saleId: newSaleId } as DailyBreadOrder);
            }
          } else { // Mark as unpaid
            if (!todaysOrder?.isPaid || !todaysOrder.id) return;
            if (todaysOrder.saleId) await this.deleteSale(todaysOrder.saleId);
            await db.dailyBreadOrders.update(todaysOrder.id, { isPaid: false, saleId: undefined });
          }
        } else { // Update delivery status
            const quantity = todaysOrder?.quantity ?? order.defaultOrderQuantity;
            if (todaysOrder?.id) {
                await db.dailyBreadOrders.update(todaysOrder.id, { isDelivered: value });
            } else {
                await db.dailyBreadOrders.add({ breadCustomerId: order.id, customerName: order.name, date: dateString, quantity, isPaid: false, isDelivered: value } as DailyBreadOrder);
            }
        }
    });
  }

  async bulkUpdateBreadOrders(params: {
      customers: BreadOrder[]; field: 'isPaid' | 'isDelivered'; value: boolean; dateString: string;
  }) {
      const { customers, field, value, dateString } = params;
      
      return db.transaction('rw', db.dailyBreadOrders, db.sales, db.customers, db.companyProfile, async () => {
        const companyProfile = await this.getById<CompanyProfile>('companyProfile', 1);
        const { breadPrice } = companyProfile || {};
        if (field === 'isPaid' && value && (!breadPrice || breadPrice <= 0)) throw new Error("Prix du pain non défini.");

        for (const customer of customers) {
            // Re-wrapping in a try-catch to allow the bulk operation to continue if one customer fails.
            try {
                await this.handleBreadOrderStatusUpdate({ order: customer, field, value, dateString });
            } catch(e) {
                console.error(`Failed to update bread order for ${customer.name}:`, e);
                toast.error(`Échec de la mise à jour pour ${customer.name}.`);
            }
        }
    });
  }

  async resetBreadOrdersForDay(dateString: string): Promise<void> {
    return db.transaction('rw', db.dailyBreadOrders, db.sales, db.customers, async () => {
      const ordersToDelete = await db.dailyBreadOrders.where('date').equals(dateString).toArray();
      const saleIds = ordersToDelete.map(o => o.saleId).filter((id): id is number => !!id);
      
      for(const saleId of saleIds) {
          await this.deleteSale(saleId);
      }
      const orderIds = ordersToDelete.map(o => o.id!);
      if (orderIds.length > 0) await db.dailyBreadOrders.bulkDelete(orderIds);
    });
  }

  async updateDailyBreadOrderQuantity(order: BreadOrder, quantity: number, dateString: string) {
      return db.transaction('rw', db.dailyBreadOrders, async () => {
        if (order.todaysOrder?.id) {
            if (order.todaysOrder.isPaid) throw new Error("Impossible de modifier une commande déjà payée.");
            return db.dailyBreadOrders.update(order.todaysOrder.id, { quantity });
        }
        return db.dailyBreadOrders.add({
            breadCustomerId: order.id, customerName: order.name, quantity, date: dateString,
            isPaid: false, isDelivered: false,
        } as DailyBreadOrder);
      });
  }
  
  async addBreadCustomer(customerData: Omit<BreadCustomer, 'id'>): Promise<number> {
    return db.transaction('rw', db.breadCustomers, () => {
      return db.breadCustomers.add(customerData as BreadCustomer);
    });
  }

  async deleteBreadCustomer(customerId: number): Promise<void> {
      return db.transaction('rw', db.breadCustomers, db.dailyBreadOrders, db.sales, db.customers, async () => {
        const dailyOrders = await db.dailyBreadOrders.where('breadCustomerId').equals(customerId).toArray();
        for (const order of dailyOrders) {
            if (order.saleId) {
                await this.deleteSale(order.saleId);
            }
        }
        
        const dailyOrderIds = dailyOrders.map(o => o.id!);
        if (dailyOrderIds.length > 0) await db.dailyBreadOrders.bulkDelete(dailyOrderIds);
        
        await db.breadCustomers.delete(customerId);
    });
  }

  async resetDatabase(): Promise<void> {
    return db.transaction('rw', ...db.tables, async () => {
      await Promise.all(db.tables.map(table => table.clear()));
      await db.companyProfile.add({ id: 1, companyName: "Mon Magasin", country: "France" } as CompanyProfile);
    });
  }

  async exportData(): Promise<string> {
    const data: { [key: string]: any[] } = {};
    const tablesToExport = db.tables;
    for (const table of tablesToExport) {
      data[table.name] = await table.toArray();
    }
    return JSON.stringify(data, (key, value) => {
      if (value instanceof Date) return value.toISOString();
      return value;
    }, 2);
  }

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json);
    const tablesToImport = db.tables;
    return db.transaction('rw', ...tablesToImport, async () => {
      await Promise.all(tablesToImport.map(table => table.clear()));
      for (const tableName in data) {
        if (db.table(tableName)) {
          const tableData = data[tableName].map((item: any) => {
            // Convert ISO strings back to Date objects
            for(const key in item) {
                if (typeof item[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(item[key])) {
                    item[key] = new Date(item[key]);
                }
            }
            if(db.table(tableName).schema.primKey.auto) {
                if (item.id) delete item.id;
            }
            return item;
          });
          await db.table(tableName).bulkAdd(tableData);
        }
      }
    });
  }
}

export const dataService = new DataService();
