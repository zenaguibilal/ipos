'use client';

import { db, PosDatabase } from '@/lib/database';
import type { Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, DailyBreadOrder, BreadCustomer, BreadOrder, Notification, InventoryLog, CustomerWithSalesData, ImportAnalysis, DashboardData, DashboardStats, TopProduct, TopCustomer, StockIntakeItem } from '@/lib/types';
import { initialData, type DB, type CollectionName } from './initial-data';
import Dexie from 'dexie';
import { startOfDay, endOfDay, format } from 'date-fns';

type TableName = keyof Pick<PosDatabase, 
    'products' | 'customers' | 'sales' | 'payments' | 
    'stockIntakes' | 'returns' | 'breadCustomers' | 'dailyBreadOrders' | 
    'companyProfile' | 'carts' | 'expenses' | 'settings' | 'notifications' | 'inventoryLogs'
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
  // Products
  // ====================================================================
  async addProduct(product: Omit<Product, 'id'>): Promise<number> {
      return db.transaction('rw', db.products, db.inventoryLogs, async () => {
          const newId = await db.products.add(product as Product);
          await db.inventoryLogs.add({
              productId: newId,
              change: product.quantity,
              newQuantity: product.quantity,
              reason: 'stock_intake',
              relatedId: `init-${newId}`,
              createdAt: new Date(),
          } as InventoryLog);
          return newId;
      });
  }

  async updateProduct(id: number, productData: Omit<Product, 'id'>): Promise<number> {
      return db.transaction('rw', db.products, db.inventoryLogs, async () => {
        const oldProduct = await db.products.get(id);
        if (!oldProduct) throw new Error("Produit non trouvé pour la mise à jour.");

        const result = await db.products.update(id, productData);

        if (oldProduct.quantity !== productData.quantity) {
             await db.inventoryLogs.add({
                productId: id,
                change: productData.quantity - oldProduct.quantity,
                newQuantity: productData.quantity,
                reason: 'manual_adjustment',
                createdAt: new Date(),
             } as InventoryLog);
        }
        return result;
      });
  }

  async deleteProduct(id: number): Promise<void> {
      return db.transaction('rw', db.products, () => {
          return db.products.delete(id);
      });
  }

  async getProducts(params: { query?: string; category?: string; }): Promise<Product[]> {
    const { query, category } = params;

    let collection = db.products.toCollection();

    if (category) {
      collection = db.products.where('category').equals(category);
    }
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      return collection.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.barcodes?.some(b => b.includes(lowerQuery))
      ).toArray();
    }
    
    return collection.toArray();
  }

  async getProductsByIds(ids: number[]): Promise<Product[]> {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }
    return db.products.where('id').anyOf(ids).toArray();
  }

  async getProductCategories(): Promise<string[]> {
    return db.products.orderBy('category').uniqueKeys().then(keys => keys.filter(k => k) as string[]);
  }

  // ====================================================================
  // Customers
  // ====================================================================
  async getCustomers(params: { query?: string }): Promise<CustomerWithSalesData[]> {
    const { query } = params;
    let customers: Customer[];

    if (query) {
        // Since we can't do a compound startsWith, we do separate indexed queries and merge.
        const byLastName = db.customers.where('lastName').startsWithIgnoreCase(query).toArray();
        const byFirstName = db.customers.where('firstName').startsWithIgnoreCase(query).toArray();
        const byPhone = db.customers.where('phone').startsWith(query).toArray();

        const [last, first, phone] = await Promise.all([byLastName, byFirstName, byPhone]);

        const combined = new Map<number, Customer>();
        [...last, ...first, ...phone].forEach(c => c.id && combined.set(c.id, c));
        customers = Array.from(combined.values()).sort((a, b) => a.lastName.localeCompare(b.lastName));
    } else {
        customers = await db.customers.orderBy('[lastName+firstName]').toArray();
    }
    
    const customersWithSalesData: CustomerWithSalesData[] = customers.map(c => {
        let isReminderDue = false;
        if(c.outstandingBalance > 0 && c.settlementDay && c.lastActivityDate) {
            const dueDate = new Date(c.lastActivityDate);
            dueDate.setDate(dueDate.getDate() + c.settlementDay);
            if (new Date() > dueDate) {
                isReminderDue = true;
            }
        }
        return { ...c, id: c.id!, isReminderDue };
    });

    return customersWithSalesData;
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<number> {
    return db.transaction('rw', db.customers, () => {
        const customerToAdd: Omit<Customer, 'id'> = {
            ...customer,
            totalSpent: 0,
            outstandingBalance: 0,
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
    return db.transaction('rw', db.customers, db.sales, db.payments, db.returns, async () => {
        const customer = await db.customers.get(id);
        if (!customer) return;

        if (customer.outstandingBalance > 0) {
            throw new Error("Suppression impossible : ce client a un solde impayé.");
        }

        const salesCount = await db.sales.where({ customerId: id }).count();
        const paymentsCount = await db.payments.where({ customerId: id }).count();
        const returnsCount = await db.returns.where({ customerId: id }).count();

        if (salesCount > 0 || paymentsCount > 0 || returnsCount > 0) {
            throw new Error("Suppression impossible : ce client a un historique de transactions (ventes, paiements ou retours).");
        }

        return db.customers.delete(id);
    });
  }

  async analyzeCustomerImport(data: any[]): Promise<ImportAnalysis> {
    const allCustomers = await db.customers.toArray();
    const customerMapByName: Map<string, Customer> = new Map(allCustomers.map(c => [`${c.firstName.toLowerCase()} ${c.lastName.toLowerCase()}`, c]));
    const customerMapByPhone: Map<string, Customer> = new Map(allCustomers.filter(c => c.phone).map(c => [c.phone!, c]));

    const analysis: ImportAnalysis = {
        customersToAdd: [],
        customersToUpdate: [],
        skippedRows: [],
        errorRows: [],
        totalRows: data.length
    };

    for (const row of data) {
        const firstName = row.firstName || row.prenom || row.Prénom;
        const lastName = row.lastName || row.nom || row.Nom;
        const phone = row.phone || row.telephone || row.Téléphone;

        if (!firstName || !lastName) {
            analysis.errorRows.push({ ...row, error: "Prénom ou Nom manquant" });
            continue;
        }
        
        const fullName = `${String(firstName).toLowerCase()} ${String(lastName).toLowerCase()}`;
        let existingCustomer = customerMapByName.get(fullName) || (phone ? customerMapByPhone.get(phone) : undefined);

        if (existingCustomer) {
            analysis.customersToUpdate.push({
                ...existingCustomer,
                // Update fields if they are present in the CSV
                firstName: firstName || existingCustomer.firstName,
                lastName: lastName || existingCustomer.lastName,
                phone: phone || existingCustomer.phone,
            });
        } else {
            analysis.customersToAdd.push({
                firstName,
                lastName,
                phone: phone || '',
            });
        }
    }
    return analysis;
  }
  
  async processCustomerImport(toAdd: any[], toUpdate: any[]): Promise<void> {
    return db.transaction('rw', db.customers, async () => {
      if (toAdd.length > 0) {
        const customersToAdd = toAdd.map(c => ({
          ...c,
          totalSpent: 0,
          outstandingBalance: 0,
        }));
        await db.customers.bulkAdd(customersToAdd);
      }
      if (toUpdate.length > 0) {
        const updates = toUpdate.map(c => db.customers.update(c.id, {
            firstName: c.firstName,
            lastName: c.lastName,
            phone: c.phone
        }));
        await Promise.all(updates);
      }
    });
  }

  // ====================================================================
  // Sales - Complex logic is handled atomically
  // ====================================================================
  async getSales(params: { query?: string; from?: Date; to?: Date }): Promise<Sale[]> {
    const { query, from, to } = params;
    
    let collection;
    if (from && to) {
        collection = db.sales.where('createdAt').between(from, to, true, true);
    } else {
        collection = db.sales.toCollection();
    }

    let salesArray = await collection.reverse().toArray();

    if (query) {
        const lowerQuery = query.toLowerCase();
        salesArray = salesArray.filter(sale => 
            sale.invoiceNumber.toLowerCase().includes(lowerQuery) ||
            (sale.customerName && sale.customerName.toLowerCase().includes(lowerQuery))
        );
    }
    
    return salesArray;
  }
  
  async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
    return db.sales.where('invoiceNumber').equals(invoiceNumber).first();
  }

  async addSale(saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'paymentStatus' | 'remainingBalance'>): Promise<number> {
    return db.transaction('rw', db.sales, db.products, db.customers, db.notifications, db.inventoryLogs, async () => {
        const { items, customerId, total, amountPaid } = saleData;

        for (const item of items) {
            if (typeof item.id !== 'number') continue;
            const product = await db.products.get(item.id);
            if (!product) throw new Error(`Produit avec ID ${item.id} non trouvé.`);
            if (product.quantity < item.quantity) throw new Error(`Stock insuffisant pour ${product.name}.`);
        }
        
        const remainingBalance = total - amountPaid;
        const paymentStatus = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

        const saleId = await db.sales.add({
            ...saleData,
            invoiceNumber: `INV-${Date.now()}`,
            paymentStatus,
            remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        } as Sale);

        for (const item of items) {
            if (typeof item.id !== 'number') continue;
            let newQuantity = 0;
            await db.products.where({id: item.id}).modify(p => {
                p.quantity -= item.quantity;
                newQuantity = p.quantity;
            });
            await db.inventoryLogs.add({
                productId: item.id,
                change: -item.quantity,
                newQuantity,
                reason: 'sale',
                relatedId: saleId,
                createdAt: new Date()
            } as InventoryLog);

            const product = await db.products.get(item.id);
            if (product && newQuantity <= product.minStockLevel) {
                const isAlreadyNotified = await db.notifications.where({ type: 'low-stock', relatedId: product.id, isRead: false }).first();
                if (!isAlreadyNotified) {
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

  async deleteSale(id: number): Promise<void> {
    return db.transaction('rw', db.sales, db.products, db.customers, db.inventoryLogs, async () => {
        const sale = await db.sales.get(id);
        if (!sale) throw new Error("Vente non trouvée.");

        // Re-stock products
        for (const item of sale.items) {
            if (typeof item.id === 'number') {
                let newQuantity = 0;
                 await db.products.where({ id: item.id }).modify(p => {
                    p.quantity += item.quantity;
                    newQuantity = p.quantity;
                });
                await db.inventoryLogs.add({
                    productId: item.id,
                    change: item.quantity,
                    newQuantity,
                    reason: 'cancellation',
                    relatedId: `sale-${id}`,
                    createdAt: new Date()
                } as InventoryLog);
            }
        }

        // Adjust customer balance
        if (sale.customerId) {
            const balanceToRestore = sale.total - sale.amountPaid;
            if (balanceToRestore > 0) { // If it was a credit sale
                await db.customers.where({ id: sale.customerId }).modify(c => {
                    c.outstandingBalance -= balanceToRestore;
                    if (c.outstandingBalance < 0) c.outstandingBalance = 0;
                });
            }
        }

        await db.sales.delete(id);
    });
  }
  
  async getStockIntakes(params: { query?: string; from?: Date; to?: Date }): Promise<StockIntake[]> {
    const { query, from, to } = params;
    
    let collection;
    if (from && to) {
        collection = db.stockIntakes.where('createdAt').between(from, to, true, true);
    } else {
        collection = db.stockIntakes.toCollection();
    }

    let intakesArray = await collection.reverse().toArray();

    if (query) {
        const lowerQuery = query.toLowerCase();
        intakesArray = intakesArray.filter(intake => 
            intake.invoiceNumber.toLowerCase().includes(lowerQuery) ||
            intake.supplier.toLowerCase().includes(lowerQuery)
        );
    }
    
    return intakesArray;
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
   async addStockIntake(
        intakeData: Omit<StockIntake, 'id' | 'items' | 'totalValue'>,
        items: StockIntakeItem[]
    ): Promise<number> {
        return db.transaction('rw', db.products, db.stockIntakes, db.inventoryLogs, async () => {
            const totalValue = items.reduce((acc, item) => acc + item.purchasePrice * item.quantity, 0);
            
            // Create a temporary intake record to get an ID
            const tempIntake = { ...intakeData, totalValue, items: [] };
            const intakeId = await db.stockIntakes.add(tempIntake as StockIntake);

            const persistedItems: StockIntake['items'] = [];
            
            for (const item of items) {
                let productId: number | undefined = item.productId;
                if (item.isNew) {
                    const newProduct: Omit<Product, 'id'> = {
                        name: item.name,
                        category: item.category,
                        price: item.price,
                        purchasePrice: item.purchasePrice,
                        quantity: 0,
                        minStockLevel: 10,
                        barcodes: item.barcodes,
                    };
                    productId = await db.products.add(newProduct as Product);
                }

                if (!productId) throw new Error(`Product ID missing for item ${item.name}`);
                
                let newQuantity = 0;
                await db.products.where({ id: productId }).modify(p => {
                    p.quantity += item.quantity;
                    p.purchasePrice = item.purchasePrice;
                    newQuantity = p.quantity;
                });
                
                await db.inventoryLogs.add({
                    productId: productId,
                    change: item.quantity,
                    newQuantity: newQuantity,
                    reason: 'stock_intake',
                    relatedId: intakeId, // We have the ID now
                    createdAt: new Date(),
                } as InventoryLog);
                
                persistedItems.push({
                    productId: productId,
                    productName: item.name,
                    quantityReceived: item.quantity,
                    purchasePrice: item.purchasePrice,
                });
            }

            // Update the intake record with the final list of items
            await db.stockIntakes.update(intakeId, { items: persistedItems });
            
            return intakeId;
        });
    }

  // ====================================================================
  // Returns - Complex logic is handled atomically
  // ====================================================================
  async getReturns(params: { query?: string; from?: Date; to?: Date }): Promise<ProductReturn[]> {
    const { query, from, to } = params;
    
    let collection;
    if (from && to) {
        collection = db.returns.where('createdAt').between(from, to, true, true);
    } else {
        collection = db.returns.toCollection();
    }

    let returnsArray = await collection.reverse().toArray();

    if (query) {
        const lowerQuery = query.toLowerCase();
        returnsArray = returnsArray.filter(pr => 
            pr.originalInvoiceNumber.toLowerCase().includes(lowerQuery) ||
            (pr.customerName && pr.customerName.toLowerCase().includes(lowerQuery))
        );
    }
    
    return returnsArray;
  }
  
  async addReturn(returnData: Omit<ProductReturn, 'id'>): Promise<number> {
      return db.transaction('rw', db.returns, db.products, db.customers, db.inventoryLogs, async () => {
          const returnId = await db.returns.add(returnData as ProductReturn);
          const { items, customerId, totalReturnValue, amountRefunded } = returnData;

          for (const item of items) {
              if (item.productId && item.wasRestocked) {
                  let newQuantity = 0;
                  await db.products.where('id').equals(item.productId).modify(p => {
                      p.quantity += item.quantity;
                      newQuantity = p.quantity;
                  });
                   await db.inventoryLogs.add({
                        productId: item.productId,
                        change: item.quantity,
                        newQuantity,
                        reason: 'return',
                        relatedId: returnId,
                        createdAt: new Date(),
                    } as InventoryLog);
              }
          }

          if (customerId) {
              const balanceEffect = totalReturnValue - amountRefunded;
              await db.customers.where('id').equals(customerId).modify(c => {
                  c.outstandingBalance -= balanceEffect;
                   if (c.outstandingBalance < 0) c.outstandingBalance = 0;
                   c.lastActivityDate = new Date();
              });
          }

          return returnId;
      });
  }

    async deleteReturn(id: number): Promise<void> {
        return db.transaction('rw', db.returns, db.products, db.customers, db.inventoryLogs, async () => {
            const productReturn = await db.returns.get(id);
            if (!productReturn) throw new Error("Retour non trouvé.");

            for (const item of productReturn.items) {
                if (item.productId && item.wasRestocked) {
                    let newQuantity = 0;
                    await db.products.where('id').equals(item.productId).modify(p => {
                        p.quantity -= item.quantity;
                        newQuantity = p.quantity;
                    });
                     await db.inventoryLogs.add({
                        productId: item.productId,
                        change: -item.quantity,
                        newQuantity,
                        reason: 'cancellation', // Or a new 'return_cancellation' reason
                        relatedId: `return-${id}`,
                        createdAt: new Date(),
                    } as InventoryLog);
                }
            }

            if (productReturn.customerId) {
                const balanceEffect = productReturn.totalReturnValue - productReturn.amountRefunded;
                 await db.customers.where('id').equals(productReturn.customerId).modify(c => {
                    c.outstandingBalance += balanceEffect;
                });
            }
            
            await db.returns.delete(id);
        });
    }


  // ====================================================================
  // Expenses - All writes are transactional
  // ====================================================================
  async getExpenses(params: { category?: string; from?: Date; to?: Date }): Promise<Expense[]> {
    const { category, from, to } = params;

    let collection;

    // Build the query based on provided filters
    if (category && from && to) {
        collection = db.expenses.where('[category+expenseDate]').between([category, from], [category, to], true, true);
    } else if (category) {
        collection = db.expenses.where('category').equals(category);
    } else if (from && to) {
        collection = db.expenses.where('expenseDate').between(from, to, true, true);
    } else {
        collection = db.expenses.toCollection();
    }
    
    // Sort by most recent
    return collection.reverse().toArray();
  }

  async getExpenseCategories(): Promise<string[]> {
    return db.expenses.orderBy('category').uniqueKeys() as Promise<string[]>;
  }

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
  async addBreadCustomer(customer: Omit<BreadCustomer, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<number> {
    return db.transaction('rw', db.breadCustomers, () => {
      const customerToAdd = { ...customer, isActive: true };
      return db.breadCustomers.add(customerToAdd as BreadCustomer);
    });
  }

  async deleteBreadCustomer(customerId: number): Promise<void> {
    return db.transaction('rw', db.breadCustomers, db.dailyBreadOrders, db.sales, async () => {
      // Find associated bread orders to find associated sales
      const orders = await db.dailyBreadOrders.where({ breadCustomerId: customerId }).toArray();
      const saleIdsToDelete = orders.map(o => o.saleId).filter((id): id is number => !!id);

      if (saleIdsToDelete.length > 0) {
        await db.sales.bulkDelete(saleIdsToDelete);
      }
      await db.dailyBreadOrders.where({ breadCustomerId: customerId }).delete();
      await db.breadCustomers.delete(customerId);
    });
  }

  async getBreadOrdersForDate(date: Date): Promise<BreadOrder[]> {
    const dateString = format(date, 'yyyy-MM-dd');
    const customers = await db.breadCustomers.where('isActive').equals(1).toArray();
    const todaysOrders = await db.dailyBreadOrders.where('date').equals(dateString).toArray();
    const sales = await db.sales.where('breadOrderDate').equals(dateString).toArray();

    const ordersMap = new Map(todaysOrders.map(o => [o.breadCustomerId, o]));
    const salesMap = new Map(sales.map(s => [s.id, s]));

    const result: BreadOrder[] = customers.map(customer => {
      const todaysOrder = ordersMap.get(customer.id!);
      
      let finalOrder: (DailyBreadOrder & { saleId?: number }) | undefined = undefined;

      if (todaysOrder) {
          const sale = sales.find(s => s.id === todaysOrder.saleId);
          finalOrder = { ...todaysOrder, saleId: sale?.id };
      }

      return {
        ...customer,
        id: customer.id!,
        todaysOrder: finalOrder,
      };
    });

    return result.sort((a,b) => a.name.localeCompare(b.name));
  }
  
  async updateDailyBreadOrderQuantity(order: BreadOrder, newQuantity: number, dateString: string): Promise<number> {
    return db.transaction('rw', db.dailyBreadOrders, async () => {
      const existingOrder = await db.dailyBreadOrders.where('[breadCustomerId+date]').equals([order.id, dateString]).first();
      if (existingOrder) {
        if(newQuantity === order.defaultOrderQuantity) {
            // If quantity is reset to default, delete the specific daily entry to revert to default
            return db.dailyBreadOrders.delete(existingOrder.id!);
        }
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

  async updateOrderStatus(orderId: number, dateString: string, field: 'isPaid' | 'isDelivered', value: boolean): Promise<number> {
      return db.transaction('rw', db.dailyBreadOrders, async () => {
          const order = await db.breadCustomers.get(orderId);
          if (!order) throw new Error("Client non trouvé");

          const existingOrder = await db.dailyBreadOrders.where('[breadCustomerId+date]').equals([orderId, dateString]).first();
          if(existingOrder) {
              return db.dailyBreadOrders.update(existingOrder.id!, { [field]: value });
          } else {
              const newOrder: Omit<DailyBreadOrder, 'id'> = {
                  breadCustomerId: orderId,
                  customerName: order.name,
                  quantity: order.defaultOrderQuantity,
                  date: dateString,
                  isPaid: field === 'isPaid' ? value : false,
                  isDelivered: field === 'isDelivered' ? value : false,
              };
              return db.dailyBreadOrders.add(newOrder as DailyBreadOrder);
          }
      });
  }

  async finalizeBreadSales(breadCustomerIds: number[], dateString: string): Promise<{ count: number }> {
    return db.transaction('rw', db.sales, db.dailyBreadOrders, db.companyProfile, async () => {
      const profile = await db.companyProfile.get(1);
      if (!profile?.breadPrice || profile.breadPrice <= 0) {
        throw new Error("Le prix du pain n'est pas configuré. Veuillez le définir dans les paramètres.");
      }
      
      const ordersToProcess = await db.dailyBreadOrders
        .where('date').equals(dateString)
        .and(order => breadCustomerIds.includes(order.breadCustomerId) && !order.isPaid)
        .toArray();

      const allBreadCustomers = await db.breadCustomers.toArray();
      const customersMap = new Map(allBreadCustomers.map(c => [c.id!, c]));

      let salesCount = 0;

      for (const order of ordersToProcess) {
          const customer = customersMap.get(order.breadCustomerId);
          if (!customer) continue;

          const total = profile.breadPrice * order.quantity;
          const saleItem = {
              id: 'bread-product',
              name: 'Pain',
              price: profile.breadPrice,
              purchasePrice: profile.breadPurchasePrice || 0,
              quantity: order.quantity
          };

          const saleData: Omit<Sale, 'id' | 'invoiceNumber'> = {
              items: [saleItem],
              subtotal: total,
              total,
              amountPaid: 0,
              remainingBalance: total,
              paymentStatus: 'unpaid',
              payments: [],
              customerName: customer.name,
              breadOrderDate: dateString,
          };
          
          const saleId = await db.sales.add(saleData as Sale);
          await db.dailyBreadOrders.update(order.id!, { isPaid: true, saleId: saleId });
          salesCount++;
      }

      return { count: salesCount };
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
  // Dashboard - Read-only, no transaction needed
  // ====================================================================
  async getDashboardData(params: { from: Date, to: Date }): Promise<DashboardData> {
      const { from, to } = params;

      const sales = await db.sales.where('createdAt').between(from, to).toArray();
      const allProducts = await db.products.toArray();

      // 1. Calculate stats
      let totalRevenue = 0;
      let totalProfit = 0;
      
      const productSales: { [id: number]: { unitsSold: number, totalRevenue: number, totalProfit: number } } = {};
      const customerSpend: { [id: number]: { name: string, totalSpent: number } } = {};

      for (const sale of sales) {
          totalRevenue += sale.total;
          let saleProfit = 0;

          for (const item of sale.items) {
              const profitPerItem = (item.price - item.purchasePrice) * item.quantity;
              const validProfit = isNaN(profitPerItem) ? 0 : profitPerItem;
              saleProfit += validProfit;
              
              if (typeof item.id === 'number') {
                  if (!productSales[item.id]) {
                      productSales[item.id] = { unitsSold: 0, totalRevenue: 0, totalProfit: 0 };
                  }
                  productSales[item.id].unitsSold += item.quantity;
                  productSales[item.id].totalRevenue += item.price * item.quantity;
                  productSales[item.id].totalProfit += validProfit;
              }
          }
          totalProfit += saleProfit;

          if (sale.customerId) {
              if (!customerSpend[sale.customerId]) {
                  customerSpend[sale.customerId] = { name: sale.customerName || 'N/A', totalSpent: 0 };
              }
              customerSpend[sale.customerId].totalSpent += sale.total;
          }
      }

      const inventoryValue = allProducts.reduce((acc, p) => {
          const value = p.purchasePrice * p.quantity;
          return acc + (isNaN(value) ? 0 : value);
      }, 0);
      
      const stats: DashboardStats = {
          totalRevenue,
          totalProfit,
          salesCount: sales.length,
          inventoryValue
      };

      // 2. Calculate Top Products
      const topProducts: TopProduct[] = Object.entries(productSales)
          .map(([productId, data]) => {
              const product = allProducts.find(p => p.id === Number(productId));
              return {
                  id: Number(productId),
                  name: product?.name || 'Produit Supprimé',
                  ...data,
              };
          })
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, 5);
      
      // 3. Calculate Top Customers
      const topCustomers: TopCustomer[] = Object.entries(customerSpend)
          .map(([customerId, data]) => ({
              id: Number(customerId),
              name: data.name,
              totalSpent: data.totalSpent,
          }))
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 5);

      return {
          stats,
          sales,
          topProducts,
          topCustomers,
      };
  }


  // ====================================================================
  // Backup & Restore - Handled in large transactions
  // ====================================================================
  async exportData(): Promise<string> {
    const data: Partial<DB> = {};
    const tables: CollectionName[] = [
        'products', 'customers', 'sales', 'payments', 
        'stockIntakes', 'returns', 'breadCustomers', 
        'dailyBreadOrders', 'expenses', 'notifications', 'settings', 'inventoryLogs'
    ];

    await db.transaction('r', ...db.tables, async () => {
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
        'dailyBreadOrders', 'expenses', 'notifications', 'settings', 'inventoryLogs',
        'companyProfile'
    ];

      return db.transaction('rw', ...db.tables, async () => {
          for (const tableName of tables) {
              if (db.table(tableName)) {
                await db.table(tableName).clear();
              }
          }

          for (const tableName of tables) {
              const tableData = data[tableName as keyof DB];
              if (tableData) {
                  if (tableName === 'companyProfile' && !Array.isArray(tableData)) {
                     await db.companyProfile.put(tableData as CompanyProfile);
                  } else if (Array.isArray(tableData) && db.table(tableName)) {
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
            if (initialData.companyProfile) {
                await db.companyProfile.put(initialData.companyProfile);
            }
        });
    }

}

export const dataService = new DataService();
