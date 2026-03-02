'use client';

import { db, PosDatabase } from '@/lib/database';
import type { Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, DailyBreadOrder, BreadCustomer, BreadOrder, Notification } from '@/lib/types';
import { initialData, type DB, type CollectionName } from './initial-data';

type TableName = keyof Pick<PosDatabase, 
    'products' | 'customers' | 'sales' | 'payments' | 
    'stockIntakes' | 'returns' | 'breadCustomers' | 'dailyBreadOrders' | 
    'companyProfile' | 'carts' | 'expenses' | 'settings' | 'notifications'
>;

class DataService {
  
  // ====================================================================
  // Generic Read/Write Methods (Read methods don't need transactions)
  // ====================================================================
  
  async getAll<T>(table: TableName): Promise<T[]> {
    return db.table(table).toArray();
  }

  async getById<T>(table: TableName, id: number | string): Promise<T | undefined> {
    return db.table(table).get(id);
  }
  
  // ====================================================================
  // Settings - All writes are transactional
  // ====================================================================
  
  async getSetting(id: string): Promise<Setting | undefined> {
    return this.getById<Setting>('settings', id);
  }

  async setSetting(id: string, value: any): Promise<string> {
    return db.transaction('rw', db.settings, () => {
        return db.settings.put({ id, value });
    });
  }

  // ====================================================================
  // Company Profile - All writes are transactional
  // ====================================================================

  async getCompanyProfile(): Promise<CompanyProfile | undefined> {
    return this.getById<CompanyProfile>('companyProfile', 1);
  }
  
  async updateCompanyProfile(profileData: Partial<Omit<CompanyProfile, 'id'>>): Promise<number> {
    return db.transaction('rw', db.companyProfile, () => {
        const dataToSave: CompanyProfile = { id: 1, ...profileData };
        return db.companyProfile.put(dataToSave);
    });
  }
  
  // ====================================================================
  // Carts - All writes are transactional
  // ====================================================================
  
  async getCart(id: string): Promise<Cart | undefined> {
    return this.getById<Cart>('carts', id);
  }

  async saveCart(cart: Cart): Promise<string> {
    return db.transaction('rw', db.carts, () => {
        return db.carts.put(cart);
    });
  }

  async deleteCart(id: string): Promise<void> {
    return db.transaction('rw', db.carts, () => {
        return db.carts.delete(id);
    });
  }
  
  // ====================================================================
  // Products - All writes are transactional
  // ====================================================================
  async addProduct(product: Omit<Product, 'id'>): Promise<number> {
      return db.transaction('rw', db.products, () => {
          return db.products.add(product as Product);
      });
  }

  async updateProduct(id: number, product: Omit<Product, 'id'>): Promise<number> {
      return db.transaction('rw', db.products, () => {
          return db.products.update(id, product);
      });
  }

  async deleteProduct(id: number): Promise<void> {
      return db.transaction('rw', db.products, () => {
          return db.products.delete(id);
      });
  }

  // ====================================================================
  // Customers - All writes are transactional
  // ====================================================================
  async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<number> {
    return db.transaction('rw', db.customers, () => {
        const customerToAdd: Omit<Customer, 'id'> = {
            ...customer,
            totalSpent: 0,
            outstandingBalance: 0,
            lastActivityDate: new Date(),
        };
        return db.customers.add(customerToAdd as Customer);
    });
  }

  async updateCustomer(id: number, customer: Partial<Omit<Customer, 'id'>>): Promise<number> {
      return db.transaction('rw', db.customers, () => {
          return db.customers.update(id, customer);
      });
  }

  async deleteCustomer(id: number): Promise<void> {
    return db.transaction('rw', db.customers, db.sales, db.payments, async () => {
        const salesCount = await db.sales.where({ customerId: id }).count();
        if (salesCount > 0) {
            throw new Error("Impossible de supprimer un client avec un historique de ventes.");
        }
        await db.payments.where({ customerId: id }).delete();
        await db.customers.delete(id);
    });
  }
  
  // ====================================================================
  // Sales - Complex logic is handled atomically
  // ====================================================================
  async addSale(saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'paymentStatus' | 'remainingBalance'>): Promise<number> {
    return db.transaction('rw', db.sales, db.products, db.customers, db.notifications, async () => {
        const { items, customerId, total, amountPaid } = saleData;

        // 1. Update product stock and check for low stock
        for (const item of items) {
            if (typeof item.id !== 'number') continue; // Skip custom items

            const product = await db.products.get(item.id);
            if (!product) throw new Error(`Produit avec ID ${item.id} non trouvé.`);
            if (product.quantity < item.quantity) {
                throw new Error(`Stock insuffisant pour ${product.name}.`);
            }
            const newQuantity = product.quantity - item.quantity;
            await db.products.update(item.id, { quantity: newQuantity });
            
            const isAlreadyNotified = await db.notifications.where({ type: 'low-stock', relatedId: product.id, isRead: false }).first();
            if (newQuantity <= product.minStockLevel && !isAlreadyNotified) {
                if (product.quantity > product.minStockLevel) { // Trigger only when crossing the threshold
                    await db.notifications.add({
                        type: 'low-stock',
                        message: `Le stock pour ${product.name} est bas (${newQuantity} restants).`,
                        isRead: false,
                        createdAt: new Date(),
                        relatedId: product.id,
                    });
                }
            }
        }
        
        const remainingBalance = total - amountPaid;
        let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (amountPaid >= total) paymentStatus = 'paid';
        else if (amountPaid > 0) paymentStatus = 'partial';

        const saleId = await db.sales.add({
            ...saleData,
            invoiceNumber: `INV-${Date.now()}`,
            paymentStatus,
            remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        } as Sale);

        if (customerId) {
            await db.customers.where('id').equals(customerId).modify(c => {
                c.totalSpent = (c.totalSpent || 0) + total;
                c.outstandingBalance = (c.outstandingBalance || 0) + (remainingBalance > 0 ? remainingBalance : 0);
                c.lastActivityDate = new Date();
            });
        }
        
        return saleId;
    });
  }

  async deleteSale(saleId: number): Promise<void> {
    return db.transaction('rw', db.sales, db.products, db.customers, async () => {
        const sale = await db.sales.get(saleId);
        if (!sale) throw new Error("Vente non trouvée.");

        for (const item of sale.items) {
            if(typeof item.id !== 'number') continue;
            await db.products.where('id').equals(item.id).modify(p => {
                p.quantity += item.quantity;
            });
        }

        if (sale.customerId) {
            const saleBalanceEffect = sale.total - sale.amountPaid;
            await db.customers.where('id').equals(sale.customerId).modify(c => {
                c.totalSpent -= sale.total;
                c.outstandingBalance -= saleBalanceEffect > 0 ? saleBalanceEffect : 0;
            });
        }
        
        await db.sales.delete(saleId);
    });
  }
  
  // ====================================================================
  // Payments - All writes are transactional
  // ====================================================================
  async addPayment(paymentData: Omit<Payment, 'id'>): Promise<number> {
      return db.transaction('rw', db.payments, db.customers, async () => {
          const id = await db.payments.add(paymentData as Payment);
          await db.customers.where('id').equals(paymentData.customerId).modify(c => {
              c.outstandingBalance -= paymentData.amount;
              if (c.outstandingBalance < 0) c.outstandingBalance = 0;
              c.lastActivityDate = new Date();
          });
          return id;
      });
  }

  // ====================================================================
  // Stock Intake - All writes are transactional
  // ====================================================================
   async addStockIntake(intakeData: Omit<StockIntake, 'id'>): Promise<number> {
        return db.transaction('rw', db.products, db.stockIntakes, async () => {
            const intakeId = await db.stockIntakes.add(intakeData as StockIntake);

            for (const item of intakeData.items) {
                if (item.productId) { // Existing product
                    await db.products.where('id').equals(item.productId).modify(p => {
                        p.quantity += item.quantityReceived;
                        p.purchasePrice = item.purchasePrice; // Update purchase price
                    });
                }
            }
            return intakeId;
        });
    }

  // ====================================================================
  // Returns - Complex logic is handled atomically
  // ====================================================================
  async addReturn(returnData: Omit<ProductReturn, 'id'>): Promise<number> {
      return db.transaction('rw', db.returns, db.products, db.customers, async () => {
          const returnId = await db.returns.add(returnData as ProductReturn);
          const { items, customerId, totalReturnValue, amountRefunded } = returnData;

          for (const item of items) {
              if (item.productId && item.wasRestocked) {
                  await db.products.where('id').equals(item.productId).modify(p => {
                      p.quantity += item.quantity;
                  });
              }
          }

          if (customerId) {
              const balanceEffect = totalReturnValue - amountRefunded;
              await db.customers.where('id').equals(customerId).modify(c => {
                  c.outstandingBalance -= balanceEffect;
                   if (c.outstandingBalance < 0) c.outstandingBalance = 0;
              });
          }

          return returnId;
      });
  }
  
  async deleteReturn(returnId: number): Promise<void> {
     return db.transaction('rw', db.returns, db.products, db.customers, async () => {
        const pr = await db.returns.get(returnId);
        if (!pr) throw new Error("Retour non trouvé.");
        
        for (const item of pr.items) {
          if (item.productId && item.wasRestocked) {
            await db.products.where('id').equals(item.productId).modify(p => {
              p.quantity -= item.quantity;
            });
          }
        }
        
        if (pr.customerId) {
          const balanceEffect = pr.totalReturnValue - pr.amountRefunded;
           await db.customers.where('id').equals(pr.customerId).modify(c => {
                c.outstandingBalance += balanceEffect;
            });
        }

        await db.returns.delete(returnId);
    });
  }

  // ====================================================================
  // Expenses - All writes are transactional
  // ====================================================================
  async addExpense(expense: Omit<Expense, 'id'>): Promise<number> {
    return db.transaction('rw', db.expenses, () => {
      return db.expenses.add(expense as Expense);
    });
  }

  async updateExpense(id: number, expense: Partial<Omit<Expense, 'id'>>): Promise<number> {
    return db.transaction('rw', db.expenses, () => {
      return db.expenses.update(id, expense);
    });
  }

  async deleteExpense(id: number): Promise<void> {
    return db.transaction('rw', db.expenses, () => {
        return db.expenses.delete(id);
    });
  }

  // ====================================================================
  // Bread Module - All writes are transactional
  // ====================================================================
  async addBreadCustomer(customer: Omit<BreadCustomer, 'id'>): Promise<number> {
    return db.transaction('rw', db.breadCustomers, () => {
      return db.breadCustomers.add(customer as BreadCustomer);
    });
  }

  async deleteBreadCustomer(customerId: number): Promise<void> {
    return db.transaction('rw', db.breadCustomers, db.dailyBreadOrders, async () => {
      await db.dailyBreadOrders.where({ breadCustomerId: customerId }).delete();
      await db.breadCustomers.delete(customerId);
    });
  }

  async updateDailyBreadOrderQuantity(order: BreadOrder, newQuantity: number, dateString: string): Promise<number> {
    return db.transaction('rw', db.dailyBreadOrders, async () => {
      const existingOrder = await db.dailyBreadOrders.where({ breadCustomerId: order.id, date: dateString }).first();
      if (existingOrder) {
        return db.dailyBreadOrders.update(existingOrder.id!, { quantity: newQuantity });
      } else {
        const newOrder: Omit<DailyBreadOrder, 'id'> = {
          breadCustomerId: order.id,
          customerName: order.name,
          quantity: newQuantity,
          date: dateString,
          isPaid: false,
          isDelivered: false
        };
        return db.dailyBreadOrders.add(newOrder as DailyBreadOrder);
      }
    });
  }

  // ====================================================================
  // Notifications - All writes are transactional
  // ====================================================================

  async markNotificationAsRead(notificationId: number): Promise<number> {
    return db.transaction('rw', db.notifications, () => {
        return db.notifications.update(notificationId, { isRead: true });
    });
  }

  async clearReadNotifications(): Promise<void> {
    return db.transaction('rw', db.notifications, () => {
        return db.notifications.where({ isRead: true }).delete();
    });
  }


  // ====================================================================
  // Backup & Restore - Handled in large transactions
  // ====================================================================
  async exportData(): Promise<string> {
    const data: Partial<DB> = {};
    const tables: CollectionName[] = [
        'products', 'customers', 'sales', 'payments', 
        'stockIntakes', 'returns', 'breadCustomers', 
        'dailyBreadOrders', 'expenses', 'notifications', 'settings'
    ];

    await db.transaction('r', db.tables, async () => {
        for (const tableName of tables) {
            data[tableName] = await db.table(tableName).toArray();
        }
        data.companyProfile = await db.companyProfile.get(1);
    });
    
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonString: string): Promise<void> {
      const data: Partial<DB> = JSON.parse(jsonString);
      const tables: (CollectionName | 'companyProfile')[] = [
        'products', 'customers', 'sales', 'payments', 
        'stockIntakes', 'returns', 'breadCustomers', 
        'dailyBreadOrders', 'expenses', 'notifications', 'settings',
        'companyProfile'
    ];

      return db.transaction('rw', ...db.tables, async () => {
          // Clear existing data
          for (const tableName of tables) {
              await db.table(tableName).clear();
          }

          // Import new data
          for (const tableName of tables) {
              const tableData = data[tableName];
              if (tableData) {
                  if (tableName === 'companyProfile' && !Array.isArray(tableData)) {
                     await db.companyProfile.add(tableData as CompanyProfile);
                  } else if (Array.isArray(tableData)) {
                     await db.table(tableName).bulkAdd(tableData);
                  }
              }
          }
      });
  }

  async resetDatabase(): Promise<void> {
        return db.transaction('rw', ...db.tables, async () => {
            for (const table of db.tables) {
                await table.clear();
            }
            await db.companyProfile.add(initialData.companyProfile);
        });
    }

}

export const dataService = new DataService();
