
'use client';

import { db, PosDatabase } from '@/lib/database';
import type { Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, DailyBreadOrder, BreadCustomer, BreadOrder, Notification, InventoryLog, CustomerWithSalesData, ImportAnalysis, DashboardDateRangeData, StockIntakeItem, CartItem } from '@/lib/types';
import { initialData, type DB, type CollectionName } from './initial-data';
import Dexie from 'dexie';
import { startOfDay, endOfDay, format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

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

  async addProductToCart(cartId: string, product: Product, quantity: number): Promise<void> {
    return db.transaction('rw', db.carts, db.products, async () => {
        const cart = await db.carts.get(cartId);
        if (!cart) throw new Error("Panier non trouvé.");

        const existingItemIndex = cart.items.findIndex(item => item.id === product.id);
        let newItems: CartItem[];

        if (existingItemIndex > -1) {
            newItems = [...cart.items];
            const existingItem = newItems[existingItemIndex];
            const newQuantity = existingItem.cartQuantity + quantity;
            if (typeof product.id === 'number') {
                const dbProduct = await db.products.get(product.id);
                if (dbProduct && newQuantity > dbProduct.quantity) {
                    throw new Error(`Stock limité pour ${product.name}. Quantité disponible: ${dbProduct.quantity}.`);
                }
            }
            newItems[existingItemIndex] = { ...existingItem, cartQuantity: newQuantity, flash: true };
        } else {
            if (typeof product.id === 'number') {
                 const dbProduct = await db.products.get(product.id);
                if (dbProduct && quantity > dbProduct.quantity) {
                    throw new Error(`Stock insuffisant pour ${product.name}. Quantité disponible: ${dbProduct.quantity}.`);
                }
            }
            const newItem: CartItem = { ...product, cartQuantity: quantity, flash: true };
            newItems = [...cart.items, newItem];
        }
        await db.carts.update(cartId, { items: newItems });
    });
  }

  async updateCartItemQuantity(cartId: string, itemId: string | number, newQuantity: number): Promise<{capped: boolean, maxQuantity?: number}> {
      return db.transaction('rw', db.carts, db.products, async () => {
        const cart = await db.carts.get(cartId);
        if (!cart) throw new Error("Panier non trouvé.");

        const itemIndex = cart.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return {capped: false};
        
        const item = cart.items[itemIndex];
        let capped = false;
        let maxQuantity: number | undefined = undefined;

        if (typeof item.id === 'number') {
            const dbProduct = await db.products.get(item.id);
            if (dbProduct && newQuantity > dbProduct.quantity) {
                newQuantity = dbProduct.quantity;
                capped = true;
                maxQuantity = dbProduct.quantity;
            }
        }
        
        const newItems = [...cart.items];
        if (newQuantity <= 0) {
            newItems.splice(itemIndex, 1);
        } else {
            newItems[itemIndex] = { ...item, cartQuantity: newQuantity };
        }
        await db.carts.update(cartId, { items: newItems });
        return {capped, maxQuantity};
      });
  }

  async removeCartItem(cartId: string, itemId: string | number): Promise<void> {
    return db.transaction('rw', db.carts, async () => {
        const cart = await db.carts.get(cartId);
        if (!cart) return;
        const newItems = cart.items.filter(item => item.id !== itemId);
        await db.carts.update(cartId, { items: newItems });
    });
  }
  
  async clearCart(cartId: string): Promise<void> {
    return db.transaction('rw', db.carts, async () => {
        await db.carts.update(cartId, { items: [], customerId: null, customerName: '', discount: { type: 'fixed', value: 0 } });
    });
  }

  async setCartCustomer(cartId: string, customer: Customer | null): Promise<void> {
    return db.transaction('rw', db.carts, async () => {
        const customerId = customer ? customer.id! : null;
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : '';
        await db.carts.update(cartId, { customerId, customerName });
    });
  }

  async setCartDiscount(cartId: string, discount: { type: 'fixed' | 'percentage'; value: number }): Promise<void> {
      return db.transaction('rw', db.carts, async (tx) => {
        const cart = await db.carts.get(cartId);
        if (!cart) return;

        let value = Math.max(0, discount.value || 0);
        const subtotal = cart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);

        if (discount.type === 'fixed' && value > subtotal) {
            value = subtotal;
        }

        if (discount.type === 'percentage' && (value < 0 || value > 100)) {
            value = Math.max(0, Math.min(100, value));
        }

        await db.carts.update(cartId, { discount: { type: discount.type, value } });
    });
  }

  async removeFlashFromCartItems(cartId: string): Promise<void> {
    return db.transaction('rw', db.carts, async () => {
        const cart = await db.carts.get(cartId);
        if (!cart || !cart.items.some(i => i.flash)) return;
        const newItems = cart.items.map(i => ({...i, flash: false}));
        await db.carts.update(cartId, { items: newItems });
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
    const keys = await db.products.orderBy('category').uniqueKeys();
    return keys.filter(k => k) as string[];
  }

  // ====================================================================
  // Customers
  // ====================================================================
  async getCustomerById(id: number): Promise<Customer | undefined> {
      return this.getById<Customer>('customers', id);
  }

  async getCustomerActivity(customerId: number): Promise<(Sale | Payment | ProductReturn)[]> {
    if (!customerId) return [];
    const sales = await db.sales.where({ customerId }).toArray();
    const payments = await db.payments.where({ customerId }).toArray();
    const returns = await db.returns.where({ customerId }).toArray();
    const combined = [...sales, ...payments, ...returns];
    return combined.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getCustomers(params: { query?: string }): Promise<CustomerWithSalesData[]> {
    const { query } = params;
    let customers: Customer[];

    if (query) {
        const lowerQuery = query.toLowerCase();
        const bySearchName = db.customers.where('searchName').startsWith(lowerQuery).toArray();
        const byPhone = db.customers.where('phone').startsWith(query).toArray(); // phone search can remain case-sensitive or as is

        const [nameMatches, phoneMatches] = await Promise.all([bySearchName, byPhone]);

        const combined = new Map<number, Customer>();
        [...nameMatches, ...phoneMatches].forEach(c => c.id && combined.set(c.id, c));
        customers = Array.from(combined.values()).sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
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

  async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate' | 'searchName'>): Promise<number> {
    return db.transaction('rw', db.customers, () => {
        const customerToAdd: Omit<Customer, 'id'> = {
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            settlementDay: customer.settlementDay,
            creditLimit: customer.creditLimit,
            totalSpent: 0,
            outstandingBalance: 0,
        };
        return db.customers.add(customerToAdd as Customer);
    });
  }

  async updateCustomer(id: number, customer: Partial<Omit<Customer, 'id' | 'searchName'>>): Promise<number> {
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
        const { items, customerId, total, amountPaid, totalProfit } = saleData;

        for (const item of items) {
            if (typeof item.id !== 'number') continue;
            const product = await db.products.get(item.id);
            if (!product) throw new Error(`Produit avec ID ${item.id} non trouvé.`);
            if (product.quantity < item.quantity) throw new Error(`Stock insuffisant pour ${product.name}.`);
        }
        
        const remainingBalance = total - amountPaid;
        const paymentStatus = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

        if (customerId) {
            const customer = await db.customers.get(customerId);
            if (!customer) throw new Error(`Client avec ID ${customerId} non trouvé.`);

            const newCreditAmount = remainingBalance > 0 ? remainingBalance : 0;
            
            if (newCreditAmount > 0 && typeof customer.creditLimit === 'number' && customer.creditLimit >= 0) {
                if ((customer.outstandingBalance + newCreditAmount) > customer.creditLimit) {
                    throw new Error(`Limite de crédit (${formatCurrency(customer.creditLimit)}) dépassée pour ${customer.firstName} ${customer.lastName}. Solde actuel: ${formatCurrency(customer.outstandingBalance)}.`);
                }
            }
        }

        const saleId = await db.sales.add({
            ...saleData,
            invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
            paymentStatus,
            remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
            totalProfit,
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
            const newCreditAmount = remainingBalance > 0 ? remainingBalance : 0;
            await db.customers.where('id').equals(customerId).modify(c => {
                c.totalSpent = (c.totalSpent || 0) + total;
                c.outstandingBalance = (c.outstandingBalance || 0) + newCreditAmount;
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

        if (sale.customerId) {
            const balanceToRestore = sale.total - sale.amountPaid;
            if (balanceToRestore > 0) { 
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
            
            const intakeId = await db.stockIntakes.add({ ...intakeData, totalValue, items: [] } as StockIntake);

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
                    relatedId: intakeId,
                    createdAt: new Date(),
                } as InventoryLog);
                
                persistedItems.push({
                    productId: productId,
                    productName: item.name,
                    quantityReceived: item.quantity,
                    purchasePrice: item.purchasePrice,
                });
            }

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
    return db.transaction('rw', db.sales, db.dailyBreadOrders, db.companyProfile, db.products, db.inventoryLogs, async () => {
      const profile = await db.companyProfile.get(1);
      if (!profile?.breadPrice || profile.breadPrice <= 0) {
        throw new Error("Le prix du pain n'est pas configuré. Veuillez le définir dans les paramètres.");
      }
      
      const ordersToProcess = await db.dailyBreadOrders
        .where('date').equals(dateString)
        .and(order => breadCustomerIds.includes(order.breadCustomerId) && !order.saleId)
        .toArray();

      const allBreadCustomers = await db.breadCustomers.where('id').anyOf(ordersToProcess.map(o => o.breadCustomerId)).toArray();
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
          
          const saleData: Omit<Sale, 'id'| 'invoiceNumber'> = {
              items: [saleItem],
              subtotal: total,
              total,
              totalProfit: total - (saleItem.purchasePrice * saleItem.quantity),
              amountPaid: total,
              remainingBalance: 0,
              paymentStatus: 'paid',
              payments: [{ method: 'cash', amount: total }],
              customerName: customer.name,
              breadOrderDate: dateString,
          };
          
          const saleId = await this.addSale(saleData);
          await db.dailyBreadOrders.update(order.id!, { isPaid: true, saleId: saleId });
          salesCount++;
      }

      return { count: salesCount };
    });
  }

  // ====================================================================
  // Expenses
  // ====================================================================
  async getExpenses(params: { category?: string; from?: Date; to?: Date }): Promise<Expense[]> {
    const { category, from, to } = params;
    let collection;

    if(category && from && to) {
        collection = db.expenses.where('[category+expenseDate]').between([category, from], [category, to]);
    } else if (category) {
        collection = db.expenses.where({ category });
    } else if (from && to) {
        collection = db.expenses.where('expenseDate').between(from, to);
    } else {
        collection = db.expenses.toCollection();
    }
    
    return collection.reverse().toArray();
  }
  
  async getExpenseCategories(): Promise<string[]> {
    const keys = await db.expenses.orderBy('category').uniqueKeys();
    return keys.filter(k => k) as string[];
  }

  async addExpense(expense: Omit<Expense, 'id'>): Promise<number> {
      return db.transaction('rw', db.expenses, () => db.expenses.add(expense as Expense));
  }

  async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id'>>): Promise<number> {
      return db.transaction('rw', db.expenses, () => db.expenses.update(id, expenseData));
  }

  async deleteExpense(id: number): Promise<void> {
      return db.transaction('rw', db.expenses, () => db.expenses.delete(id));
  }


  // ====================================================================
  // Notifications - All writes are transactional
  // ====================================================================

  async getUnreadLowStockAlerts(): Promise<Notification[]> {
    return db.notifications
        .orderBy('createdAt')
        .reverse()
        .filter(n => n.type === 'low-stock' && !n.isRead)
        .toArray();
  }

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
  async getSalesDashboardData(params: { from: Date, to: Date }): Promise<DashboardDateRangeData> {
      const { from, to } = params;

      const sales = await db.sales.where('createdAt').between(from, to).reverse().toArray();

      const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
      const totalProfit = sales.reduce((acc, sale) => acc + (sale.totalProfit || 0), 0);
      
      return {
          totalRevenue,
          totalProfit,
          salesCount: sales.length,
          sales,
      };
  }

  async getInventoryValue(): Promise<number> {
      const allProducts = await db.products.toArray();
      const inventoryValue = allProducts.reduce((acc, p) => {
          const value = p.purchasePrice * p.quantity;
          return acc + (isNaN(value) ? 0 : value);
      }, 0);
      return inventoryValue;
  }


  // ====================================================================
  // Backup, Restore, Sync - Handled in large transactions
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
              const table = db.table(tableName);
              if (table) {
                await table.clear();
              }
          }

          for (const tableName of tables) {
              const tableData = data[tableName as keyof DB];
              if (tableData) {
                  const table = db.table(tableName);
                  if (tableName === 'companyProfile' && !Array.isArray(tableData)) {
                     await db.companyProfile.put(tableData as CompanyProfile);
                  } else if (Array.isArray(tableData) && table) {
                     await table.bulkAdd(tableData);
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

  async syncDataToGoogleSheet(): Promise<void> {
    const profile = await this.getCompanyProfile();
    if (!profile?.syncUrl) {
      throw new Error("L'URL de synchronisation n'est pas configurée.");
    }
    
    const dataToSync = await this.exportData();

    // The Google Apps Script needs to be deployed to return the correct CORS headers
    // and handle the POST request. Using 'text/plain' helps avoid CORS pre-flight requests.
    const response = await fetch(profile.syncUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: dataToSync,
    });

    if (!response.ok) {
        let errorBody = `Status: ${response.status} - ${response.statusText}`;
        try {
            // Try to parse as JSON first, as the script might return a structured error
            const errorJson = await response.json();
            if (errorJson.error) {
                 errorBody = errorJson.error;
            }
        } catch (e) {
            // If not JSON, it might be plain text or HTML from Google
            try {
                const textError = await response.text();
                // Avoid showing a full HTML page in the toast
                if (textError && !textError.toLowerCase().includes('<html')) { 
                    errorBody = textError.substring(0, 200); // Limit length for clarity
                } else if (textError) {
                    errorBody = "Le serveur Google a retourné une erreur inattendue (probablement une page HTML)."
                }
            } catch (textErr) {
                // Ignore if reading as text also fails, stick with the status code.
            }
        }
        throw new Error(`Erreur de synchronisation: ${errorBody}`);
    }
    
    // Update the last sync date on successful fetch.
    return db.transaction('rw', db.companyProfile, () => {
        return db.companyProfile.update(1, { lastSyncDate: new Date() });
    });
  }
}

export const dataService = new DataService();
