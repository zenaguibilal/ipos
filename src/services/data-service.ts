
'use client';

import { db, PosDatabase } from '@/lib/database';
import type { Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, DailyBreadOrder, BreadCustomer, BreadOrder, Notification, InventoryLog, CustomerWithSalesData, ImportAnalysis, DashboardData, StockIntakeItem, CartItem, TopProduct, TopCustomer, GlobalActivityItem, ProductImportAnalysis, ZakatData, CostingItem, Draft, SaleItem, Supplier } from '@/lib/types';
import { initialData, type DB, type CollectionName } from './initial-data';
import Dexie from 'dexie';
import { startOfDay, endOfDay, format } from 'date-fns';
import Papa from 'papaparse';
import { formatCurrency } from '@/lib/utils';

type TableName = keyof Pick<PosDatabase, 
    'products' | 'customers' | 'sales' | 'payments' | 
    'stockIntakes' | 'returns' | 'breadCustomers' | 'dailyBreadOrders' | 'drafts' |
    'companyProfile' | 'carts' | 'expenses' | 'settings' | 'notifications' | 'inventoryLogs' | 'suppliers'
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

  async getCompanyProfile(): Promise<CompanyProfile | null> {
    const profile = await this.getById<CompanyProfile>('companyProfile', 1);
    return profile ?? null;
  }
  
  async updateCompanyProfile(profileData: Partial<Omit<CompanyProfile, 'id'>>): Promise<number> {
    return db.transaction('rw', db.companyProfile, async () => {
        const currentProfile = await db.companyProfile.get(1);
        const dataToSave: CompanyProfile = { id: 1, ...currentProfile, ...profileData };
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
  
  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return db.products.where('barcodes').equals(barcode).first();
  }

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

  async updateProduct(id: number, productData: Partial<Omit<Product, 'id'>>): Promise<number> {
      return db.transaction('rw', db.products, db.inventoryLogs, async () => {
        const oldProduct = await db.products.get(id);
        if (!oldProduct) throw new Error("Produit non trouvé pour la mise à jour.");

        const result = await db.products.update(id, productData);

        if (oldProduct.quantity !== productData.quantity) {
             await db.inventoryLogs.add({
                productId: id,
                change: (productData.quantity || 0) - oldProduct.quantity,
                newQuantity: productData.quantity,
                reason: 'manual_adjustment',
                createdAt: new Date(),
             } as InventoryLog);
        }
        return result;
      });
  }

  async deleteProduct(id: number): Promise<void> {
      return db.transaction('rw', db.products, db.inventoryLogs, async () => {
          await db.inventoryLogs.where({ productId: id }).delete();
          return db.products.delete(id);
      });
  }

  async deleteProducts(ids: number[]): Promise<void> {
    return db.transaction('rw', db.products, db.inventoryLogs, async () => {
        await db.inventoryLogs.where('productId').anyOf(ids).delete();
        return db.products.bulkDelete(ids);
    });
  }

  async getProducts(params: { 
    query?: string; 
    category?: string; 
    supplierId?: number;
    stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
    sortBy?: string;
  }): Promise<Product[]> {
    const { query, category, stockStatus = 'all', sortBy = 'name_asc', supplierId } = params;

    let collection: Dexie.Collection<Product, number> = db.products.toCollection();

    if (category) {
      collection = collection.filter(p => p.category === category);
    }
    if (supplierId) {
        collection = collection.filter(p => p.fournisseurId === supplierId);
    }

    let productsArray = await collection.toArray();

    if (stockStatus !== 'all') {
        productsArray = productsArray.filter(p => {
            switch (stockStatus) {
                case 'in_stock':
                    return p.quantity > p.minStockLevel;
                case 'low_stock':
                    return p.quantity > 0 && p.quantity <= p.minStockLevel;
                case 'out_of_stock':
                    return p.quantity <= 0;
                default:
                    return true;
            }
        });
    }
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      productsArray = productsArray.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.barcodes?.some(b => b.includes(lowerQuery))
      );
    }
    
    const [sortField, sortOrder] = sortBy.split('_');

    productsArray.sort((a, b) => {
        let valA = (a as any)[sortField];
        let valB = (b as any)[sortField];
        
        // Handle undefined or null values, sorting them to the end
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        // Special handling for date fields
        if (['dateExpiration', 'createdAt', 'updatedAt', 'dateMajPrix'].includes(sortField)) {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        }

        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
    });

    if (sortOrder === 'desc') productsArray.reverse();
    return productsArray;
  }

  async getProductsByIds(ids: number[]): Promise<Product[]> {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    return db.products.where('id').anyOf(ids).toArray();
  }

  async getProductCategories(): Promise<string[]> {
    const keys = await db.products.orderBy('category').uniqueKeys();
    return keys.filter(k => k) as string[];
  }
  
  async getSuppliers(): Promise<Supplier[]> {
    return db.suppliers.orderBy('name').toArray();
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
        customers = await db.customers.where('searchName').startsWith(lowerQuery).toArray();
    } else {
        customers = await db.customers.orderBy('lastName').toArray();
    }
    
    return customers.map(c => {
        let isReminderDue = false;
        if(c.outstandingBalance > 0 && c.settlementDay && c.lastActivityDate) {
            const dueDate = new Date(c.lastActivityDate);
            dueDate.setDate(dueDate.getDate() + c.settlementDay);
            if (new Date() > dueDate) isReminderDue = true;
        }
        return { ...c, id: c.id!, isReminderDue };
    });
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<number> {
    return db.transaction('rw', db.customers, () => {
        return db.customers.add({
            ...customer,
            totalSpent: 0,
            outstandingBalance: 0,
        } as Customer);
    });
  }

  async updateCustomer(id: number, customer: Partial<Omit<Customer, 'id'>>): Promise<number> {
      return db.transaction('rw', db.customers, () => db.customers.update(id, customer));
  }

  async deleteCustomer(id: number): Promise<void> {
    return db.transaction('rw', db.customers, db.sales, db.payments, db.returns, async () => {
        const customer = await db.customers.get(id);
        if (!customer) return;
        if (customer.outstandingBalance > 0) throw new Error("Suppression impossible : ce client a un solde impayé.");
        const salesCount = await db.sales.where({ customerId: id }).count();
        if (salesCount > 0) throw new Error("Suppression impossible : ce client a un historique de transactions.");
        return db.customers.delete(id);
    });
  }

  // ====================================================================
  // Sales - Complex logic is handled atomically
  // ====================================================================
  async getSales(params: { query?: string; from?: Date; to?: Date }): Promise<Sale[]> {
    const { query, from, to } = params;
    let collection = (from && to) ? db.sales.where('createdAt').between(from, to, true, true) : db.sales.toCollection();
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

  async addSale(saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'paymentStatus' | 'remainingBalance'> & { items: SaleItem[] }): Promise<number> {
    return db.transaction('rw', db.sales, db.products, db.customers, db.notifications, db.inventoryLogs, async () => {
        const { items, customerId, total, amountPaid } = saleData;

        // Stock check
        for (const item of items) {
            if (typeof item.id !== 'number') continue;
            const product = await db.products.get(item.id);
            if (!product || product.quantity < item.quantity) throw new Error(`Stock insuffisant pour ${product?.name || 'produit inconnu'}.`);
        }
        
        const newDebt = total - amountPaid;

        // Credit limit check
        if (customerId && newDebt > 0) {
            const customer = await db.customers.get(customerId);
            if (customer && typeof customer.creditLimit === 'number') {
                const futureBalance = customer.outstandingBalance + newDebt;
                if (futureBalance > customer.creditLimit) {
                    throw new Error(`Limite de crédit de ${formatCurrency(customer.creditLimit)} dépassée pour ${customer.firstName} ${customer.lastName}.`);
                }
            }
        }

        const saleId = await db.sales.add({
            ...saleData,
            invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
            paymentStatus: amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid',
            remainingBalance: newDebt > 0 ? newDebt : 0,
        } as Sale);

        // Update stock, logs, and check for low stock notifications
        for (const item of items) {
            if (typeof item.id !== 'number') continue;
            const product = await db.products.get(item.id);
            if (!product) continue;
            
            const newQuantity = product.quantity - item.quantity;
            await db.products.update(item.id, { quantity: newQuantity });
            
            await db.inventoryLogs.add({
                productId: item.id,
                change: -item.quantity,
                newQuantity,
                reason: 'sale',
                relatedId: saleId,
            } as InventoryLog);

            if (newQuantity <= product.minStockLevel) {
                const isNotified = await db.notifications.where({ type: 'low-stock', relatedId: product.id, isRead: false }).first();
                if (!isNotified) {
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

        // Update customer balance
        if (customerId) {
            await db.customers.where('id').equals(customerId).modify(c => {
                c.outstandingBalance = (c.outstandingBalance || 0) + (newDebt > 0 ? newDebt : 0);
                c.totalSpent = (c.totalSpent || 0) + total;
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
                const product = await db.products.get(item.id);
                const newQuantity = (product?.quantity || 0) + item.quantity;
                await db.products.update(item.id, { quantity: newQuantity });
                await db.inventoryLogs.add({
                    productId: item.id,
                    change: item.quantity,
                    newQuantity,
                    reason: 'cancellation',
                    relatedId: `sale-${id}`,
                } as InventoryLog);
            }
        }

        if (sale.customerId && sale.remainingBalance > 0) {
            await db.customers.where({ id: sale.customerId }).modify(c => {
                c.outstandingBalance -= sale.remainingBalance;
                if (c.outstandingBalance < 0) c.outstandingBalance = 0;
            });
        }

        await db.sales.delete(id);
    });
  }
  
  // ====================================================================
  // Drafts
  // ====================================================================

  async saveDraft(cart: Cart, notes?: string): Promise<number> {
    return db.transaction('rw', db.drafts, () => {
        const subtotal = cart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
        const discountAmount = cart.discount.type === 'percentage'
            ? (subtotal * cart.discount.value) / 100
            : cart.discount.value;
        const total = subtotal - discountAmount;

        const draft: Omit<Draft, 'id'> = {
            date: new Date(),
            customerId: cart.customerId,
            customerName: cart.customerName,
            items: cart.items,
            discount: cart.discount,
            total,
            notes,
        };
        return db.drafts.add(draft as Draft);
    });
  }

  async getDrafts(): Promise<Draft[]> {
    return db.drafts.orderBy('date').reverse().toArray();
  }

  async deleteDraft(id: number): Promise<void> {
    return db.drafts.delete(id);
  }

  // ====================================================================
  // Stock Intake - All writes are transactional
  // ====================================================================
   async addStockIntake(intakeData: Omit<StockIntake, 'id' | 'items' | 'totalValue'>, items: StockIntakeItem[]): Promise<number> {
        return db.transaction('rw', db.products, db.stockIntakes, db.inventoryLogs, db.suppliers, async () => {
            
            // Ensure supplier exists
            const supplierName = intakeData.supplier;
            let supplier = await db.suppliers.where('name').equalsIgnoreCase(supplierName).first();
            if (!supplier) {
                const supplierId = await db.suppliers.add({ name: supplierName });
                supplier = { id: supplierId, name: supplierName };
            }

            const totalValue = items.reduce((acc, item) => acc + item.purchasePrice * item.quantity, 0);
            const intakeId = await db.stockIntakes.add({ ...intakeData, totalValue, items: [] } as StockIntake);
            const persistedItems: StockIntake['items'] = [];

            for (const item of items) {
                let productId: number | undefined = item.productId;
                if (item.isNew) {
                    productId = await db.products.add({
                        name: item.name, category: item.category, price: item.price,
                        purchasePrice: item.purchasePrice, quantity: 0, minStockLevel: 10, barcodes: item.barcodes,
                        fournisseurId: supplier.id
                    } as Product);
                }
                if (!productId) throw new Error(`ID de produit manquant pour ${item.name}`);
                
                const product = await db.products.get(productId);
                const newQuantity = (product?.quantity || 0) + item.quantity;
                await db.products.update(productId, { 
                    quantity: newQuantity, 
                    purchasePrice: item.purchasePrice,
                    fournisseurId: supplier.id // Associate with supplier
                });
                
                await db.inventoryLogs.add({
                    productId, change: item.quantity, newQuantity,
                    reason: 'stock_intake', relatedId: intakeId,
                } as InventoryLog);
                
                persistedItems.push({ productId, productName: item.name, quantityReceived: item.quantity, purchasePrice: item.purchasePrice });
            }
            await db.stockIntakes.update(intakeId, { items: persistedItems });
            return intakeId;
        });
    }

    async applyNewPurchasePrices(costingItems: CostingItem[]): Promise<void> {
        return db.transaction('rw', db.products, async () => {
            for (const item of costingItems) {
                if (item.productId && typeof item.productId === 'number') {
                    await db.products.update(item.productId, { purchasePrice: item.finalCostPerUnit });
                }
            }
        });
    }
  
  // Other methods remain unchanged...
  // The following methods are collapsed for brevity but are unchanged.

  async getStockIntakes(params: { query?: string; from?: Date; to?: Date }): Promise<StockIntake[]> {
    const { query, from, to } = params;
    let collection = (from && to) ? db.stockIntakes.where('createdAt').between(from, to, true, true) : db.stockIntakes.toCollection();
    let intakesArray = await collection.reverse().toArray();
    if (query) {
        const lowerQuery = query.toLowerCase();
        intakesArray = intakesArray.filter(intake => 
            intake.invoiceNumber.toLowerCase().includes(lowerQuery) || intake.supplier.toLowerCase().includes(lowerQuery)
        );
    }
    return intakesArray;
  }
  
  async addPayment(paymentData: Omit<Payment, 'id'>): Promise<number> {
      return db.transaction('rw', db.payments, db.customers, async () => {
          const id = await db.payments.add(paymentData as Payment);
          await db.customers.where('id').equals(paymentData.customerId).modify(c => {
              c.outstandingBalance = Math.max(0, c.outstandingBalance - paymentData.amount);
              c.lastActivityDate = new Date();
          });
          return id;
      });
  }

  async getReturns(params: { query?: string; from?: Date; to?: Date }): Promise<ProductReturn[]> {
    const { query, from, to } = params;
    let collection = (from && to) ? db.returns.where('createdAt').between(from, to, true, true) : db.returns.toCollection();
    let returnsArray = await collection.reverse().toArray();
    if (query) {
        const lowerQuery = query.toLowerCase();
        returnsArray = returnsArray.filter(pr => 
            pr.originalInvoiceNumber.toLowerCase().includes(lowerQuery) || (pr.customerName && pr.customerName.toLowerCase().includes(lowerQuery))
        );
    }
    return returnsArray;
  }
  
  async addReturn(returnData: Omit<ProductReturn, 'id'>): Promise<number> {
      return db.transaction('rw', db.returns, db.products, db.customers, db.inventoryLogs, async () => {
          const returnId = await db.returns.add(returnData as ProductReturn);
          for (const item of returnData.items) {
              if (item.productId && item.wasRestocked) {
                  const product = await db.products.get(item.productId);
                  const newQuantity = (product?.quantity || 0) + item.quantity;
                  await db.products.update(item.productId, { quantity: newQuantity });
                   await db.inventoryLogs.add({
                        productId: item.productId, change: item.quantity, newQuantity,
                        reason: 'return', relatedId: returnId,
                    } as InventoryLog);
              }
          }
          if (returnData.customerId) {
              const balanceEffect = returnData.totalReturnValue - returnData.amountRefunded;
              await db.customers.where('id').equals(returnData.customerId).modify(c => {
                  c.outstandingBalance = Math.max(0, c.outstandingBalance - balanceEffect);
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
                    const product = await db.products.get(item.productId);
                    const newQuantity = (product?.quantity || 0) - item.quantity;
                    await db.products.update(item.productId, { quantity: newQuantity });
                     await db.inventoryLogs.add({
                        productId: item.productId, change: -item.quantity, newQuantity,
                        reason: 'cancellation', relatedId: `return-${id}`,
                    } as InventoryLog);
                }
            }
            if (productReturn.customerId) {
                const balanceEffect = productReturn.totalReturnValue - productReturn.amountRefunded;
                 await db.customers.where('id').equals(productReturn.customerId).modify(c => { c.outstandingBalance += balanceEffect; });
            }
            await db.returns.delete(id);
        });
    }

  async addBreadCustomer(customer: Omit<BreadCustomer, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<number> {
    return db.transaction('rw', db.breadCustomers, () => db.breadCustomers.add({ ...customer, isActive: true } as BreadCustomer));
  }

  async deleteBreadCustomer(customerId: number): Promise<void> {
    return db.transaction('rw', db.breadCustomers, db.dailyBreadOrders, db.sales, async () => {
      const orders = await db.dailyBreadOrders.where({ breadCustomerId: customerId }).toArray();
      const saleIdsToDelete = orders.map(o => o.saleId).filter((id): id is number => !!id);
      if (saleIdsToDelete.length > 0) await db.sales.bulkDelete(saleIdsToDelete);
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
    return customers.map(customer => {
      const todaysOrder = ordersMap.get(customer.id!);
      let finalOrder: (DailyBreadOrder & { saleId?: number }) | undefined = undefined;
      if (todaysOrder) {
          const sale = sales.find(s => s.id === todaysOrder.saleId);
          finalOrder = { ...todaysOrder, saleId: sale?.id };
      }
      return { ...customer, id: customer.id!, todaysOrder: finalOrder };
    }).sort((a,b) => a.name.localeCompare(b.name));
  }
  
  async updateDailyBreadOrderQuantity(order: BreadOrder, newQuantity: number, dateString: string): Promise<number> {
    return db.transaction('rw', db.dailyBreadOrders, async () => {
      const existingOrder = await db.dailyBreadOrders.where('[breadCustomerId+date]').equals([order.id, dateString]).first();
      if (existingOrder) {
        if(newQuantity === order.defaultOrderQuantity) return db.dailyBreadOrders.delete(existingOrder.id!);
        return db.dailyBreadOrders.update(existingOrder.id!, { quantity: newQuantity });
      } else {
        return db.dailyBreadOrders.add({
          breadCustomerId: order.id, customerName: order.name, quantity: newQuantity, date: dateString, isPaid: false, isDelivered: false
        } as DailyBreadOrder);
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
              return db.dailyBreadOrders.add({
                  breadCustomerId: orderId, customerName: order.name, quantity: order.defaultOrderQuantity, date: dateString,
                  isPaid: field === 'isPaid' ? value : false, isDelivered: field === 'isDelivered' ? value : false,
              } as DailyBreadOrder);
          }
      });
  }

  async finalizeBreadSales(breadCustomerIds: number[], dateString: string): Promise<{ count: number }> {
    return db.transaction('rw', db.sales, db.dailyBreadOrders, db.companyProfile, db.products, db.inventoryLogs, async () => {
      const profile = await db.companyProfile.get(1);
      if (!profile?.breadPrice || profile.breadPrice <= 0) throw new Error("Le prix du pain n'est pas configuré.");
      const ordersToProcess = await db.dailyBreadOrders.where('date').equals(dateString).and(order => breadCustomerIds.includes(order.breadCustomerId) && !order.saleId).toArray();
      const customersMap = new Map((await db.breadCustomers.where('id').anyOf(ordersToProcess.map(o => o.breadCustomerId)).toArray()).map(c => [c.id!, c]));
      let salesCount = 0;
      for (const order of ordersToProcess) {
          const customer = customersMap.get(order.breadCustomerId);
          if (!customer) continue;
          const total = profile.breadPrice * order.quantity;
          const saleId = await db.sales.add({
              items: [{ id: 'bread-product', name: 'Pain', price: profile.breadPrice, purchasePrice: profile.breadPurchasePrice || 0, quantity: order.quantity, unite: 'Pièce' }],
              subtotal: total, total, amountPaid: total, remainingBalance: 0, paymentStatus: 'paid',
              payments: [{ method: 'cash', amount: total }], customerName: customer.name, breadOrderDate: dateString,
          } as Sale);
          await db.dailyBreadOrders.update(order.id!, { isPaid: true, saleId: saleId });
          salesCount++;
      }
      return { count: salesCount };
    });
  }

  async getExpenses(params: { category?: string; from?: Date; to?: Date }): Promise<Expense[]> {
    const { category, from, to } = params;
    let collection;
    if(category && from && to) collection = db.expenses.where('[category+expenseDate]').between([category, from], [category, to]);
    else if (category) collection = db.expenses.where({ category });
    else if (from && to) collection = db.expenses.where('expenseDate').between(from, to);
    else collection = db.expenses.toCollection();
    return collection.reverse().toArray();
  }
  
  async getExpenseCategories(): Promise<string[]> {
    const keys = await db.expenses.orderBy('category').uniqueKeys();
    return keys.filter(k => k) as string[];
  }

  async addExpense(expense: Omit<Expense, 'id'>): Promise<number> { return db.transaction('rw', db.expenses, () => db.expenses.add(expense as Expense)); }
  async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id'>>): Promise<number> { return db.transaction('rw', db.expenses, () => db.expenses.update(id, expenseData)); }
  async deleteExpense(id: number): Promise<void> { return db.transaction('rw', db.expenses, () => db.expenses.delete(id)); }
  async getUnreadLowStockAlerts(): Promise<Notification[]> { return db.notifications.orderBy('createdAt').reverse().filter(n => n.type === 'low-stock' && !n.isRead).toArray(); }
  async markNotificationAsRead(notificationId: number): Promise<number> { return db.transaction('rw', db.notifications, () => db.notifications.update(notificationId, { isRead: true })); }
  async clearReadNotifications(): Promise<void> { return db.transaction('rw', db.notifications, () => db.notifications.where({ isRead: true }).delete()); }

  async getZakatData(): Promise<ZakatData> {
      const inventoryValue = await this.getInventoryValue();
      const totalReceivables = (await db.customers.toArray()).reduce((acc, c) => acc + c.outstandingBalance, 0);
      return { inventoryValue, totalReceivables };
  }

  async getDashboardData(params: { from: Date; to: Date }): Promise<DashboardData> {
    const { from, to } = params;
    const sales = await db.sales.where('createdAt').between(from, to, true, true).reverse().toArray();
    const expenses = await db.expenses.where('expenseDate').between(from, to, true, true).toArray();
    let totalRevenue = 0, totalProfit = 0;
    const productStats = new Map<number, { name: string; totalRevenue: number; unitsSold: number; totalProfit: number }>();
    const customerStats = new Map<number, { name: string; totalSpent: number }>();

    for (const sale of sales) {
        totalRevenue += sale.total;
        const saleProfit = sale.items.reduce((acc, item) => acc + (item.price - item.purchasePrice) * item.quantity, 0);
        totalProfit += isNaN(saleProfit) ? 0 : saleProfit;
        if (sale.customerId && sale.customerName) {
            const current = customerStats.get(sale.customerId) || { name: sale.customerName, totalSpent: 0 };
            customerStats.set(sale.customerId, { ...current, totalSpent: current.totalSpent + sale.total });
        }
        for (const item of sale.items) {
            if (typeof item.id !== 'number') continue;
            const current = productStats.get(item.id) || { name: item.name, totalRevenue: 0, unitsSold: 0, totalProfit: 0 };
            const profit = (item.price - item.purchasePrice) * item.quantity;
            productStats.set(item.id, {
                ...current, unitsSold: current.unitsSold + item.quantity,
                totalRevenue: current.totalRevenue + item.price * item.quantity,
                totalProfit: current.totalProfit + (isNaN(profit) ? 0 : profit)
            });
        }
    }

    return {
        stats: { totalRevenue, totalProfit, salesCount: sales.length, inventoryValue: await this.getInventoryValue(), totalExpenses: expenses.reduce((acc, exp) => acc + exp.amount, 0) },
        sales, expenses,
        topProducts: [...productStats.entries()].map(([id, stats]) => ({ id, ...stats })).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5),
        topCustomers: [...customerStats.entries()].map(([id, stats]) => ({ id, ...stats })).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5),
    };
  }

  async getInventoryValue(): Promise<number> {
      return (await db.products.toArray()).reduce((acc, p) => acc + (p.purchasePrice * p.quantity || 0), 0);
  }

  async getGlobalActivity(limit: number = 10): Promise<GlobalActivityItem[]> {
    const sales = await db.sales.orderBy('createdAt').reverse().limit(limit).toArray();
    const intakes = await db.stockIntakes.orderBy('createdAt').reverse().limit(limit).toArray();
    const returns = await db.returns.orderBy('createdAt').reverse().limit(limit).toArray();
    const customers = await db.customers.orderBy('createdAt').reverse().limit(limit).toArray();
    const activity: GlobalActivityItem[] = [
        ...sales.map(s => ({ type: 'sale', date: s.createdAt!, id: s.id!, description: `Vente #${s.invoiceNumber}`, details: s.customerName || 'Client de passage', amount: s.total, amountClass: 'text-primary' } as GlobalActivityItem)),
        ...intakes.map(i => ({ type: 'stock_intake', date: i.createdAt!, id: i.id!, description: `Réception de ${i.supplier}`, details: `${i.items.length} article(s)`, amount: i.totalValue, amountClass: 'text-[hsl(var(--chart-quaternary))]' } as GlobalActivityItem)),
        ...returns.map(r => ({ type: 'return', date: r.createdAt!, id: r.id!, description: `Retour sur facture #${r.originalInvoiceNumber}`, details: `${r.items.length} article(s) retourné(s)`, amount: r.totalReturnValue, amountClass: 'text-destructive' } as GlobalActivityItem)),
        ...customers.map(c => ({ type: 'customer', date: c.createdAt!, id: c.id!, description: `Nouveau client`, details: `${c.firstName} ${c.lastName}` } as GlobalActivityItem)),
    ];
    return activity.sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
  }

  async exportData(): Promise<string> {
    const data: Partial<DB> = {};
    const tables: CollectionName[] = ['products', 'customers', 'suppliers', 'sales', 'payments', 'stockIntakes', 'returns', 'breadCustomers', 'dailyBreadOrders', 'expenses', 'notifications', 'settings', 'inventoryLogs', 'drafts'];
    await db.transaction('r', ...db.tables, async () => {
        for (const tableName of tables) data[tableName] = await db.table(tableName).toArray();
        const profile = await db.companyProfile.get(1);
        if(profile) data.companyProfile = profile;
    });
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonString: string): Promise<void> {
      const data: Partial<DB> = JSON.parse(jsonString);
      const tables: (CollectionName | 'companyProfile' | 'drafts')[] = ['products', 'customers', 'suppliers', 'sales', 'payments', 'stockIntakes', 'returns', 'breadCustomers', 'dailyBreadOrders', 'expenses', 'notifications', 'settings', 'inventoryLogs', 'companyProfile', 'drafts'];
      return db.transaction('rw', ...db.tables, async () => {
          for (const tableName of tables) await db.table(tableName)?.clear();
          for (const tableName of tables) {
              const tableData = data[tableName as keyof DB];
              if (tableData) {
                  if (tableName === 'companyProfile' && !Array.isArray(tableData)) await db.companyProfile.put(tableData as CompanyProfile);
                  else if (Array.isArray(tableData)) await db.table(tableName).bulkAdd(tableData);
              }
          }
      });
  }

  async resetDatabase(): Promise<void> {
    return db.transaction('rw', ...db.tables, async () => {
        for (const table of db.tables) await table.clear();
        if (initialData.companyProfile) await db.companyProfile.put(initialData.companyProfile);
    });
  }

    async analyzeCustomerImport(data: any[]): Promise<ImportAnalysis> {
        const existingCustomers = await db.customers.toArray();
        const existingPhones = new Set(existingCustomers.map(c => c.phone).filter(Boolean));
        const analysis: ImportAnalysis = {
            customersToAdd: [],
            customersToUpdate: [],
            skippedRows: [],
            errorRows: [],
            totalRows: data.length,
        };

        for (const row of data) {
            if (!row.firstName || !row.lastName) {
                analysis.errorRows.push({ ...row, error: 'Prénom ou nom manquant' });
                continue;
            }
            
            const existingByName = existingCustomers.find(c => 
                c.firstName.toLowerCase() === row.firstName.toLowerCase() && 
                c.lastName.toLowerCase() === row.lastName.toLowerCase()
            );

            if (existingByName) {
                analysis.customersToUpdate.push({ ...existingByName, ...row });
            } else if (row.phone && existingPhones.has(row.phone)) {
                const existingByPhone = existingCustomers.find(c => c.phone === row.phone);
                 analysis.customersToUpdate.push({ ...existingByPhone, ...row });
            } else {
                 analysis.customersToAdd.push(row);
            }
        }
        return analysis;
    }

    async processCustomerImport(toAdd: any[], toUpdate: any[]): Promise<void> {
        return db.transaction('rw', db.customers, async () => {
            const customersToAdd = toAdd.map(c => ({
                firstName: c.firstName,
                lastName: c.lastName,
                phone: c.phone || '',
                creditLimit: c.creditLimit ? parseFloat(c.creditLimit) : undefined,
                totalSpent: 0,
                outstandingBalance: c.outstandingBalance ? parseFloat(c.outstandingBalance) : 0,
            }));
            await db.customers.bulkAdd(customersToAdd as any);
            
            for (const c of toUpdate) {
                await db.customers.update(c.id, {
                    firstName: c.firstName,
                    lastName: c.lastName,
                    phone: c.phone,
                    creditLimit: c.creditLimit ? parseFloat(c.creditLimit) : undefined,
                });
            }
        });
    }

    async analyzeProductImport(data: any[]): Promise<ProductImportAnalysis> {
        const existingProducts = await db.products.toArray();
        const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase()));
        const existingBarcodes = new Set(existingProducts.flatMap(p => p.barcodes || []));

        const analysis: ProductImportAnalysis = {
            productsToAdd: [],
            productsToUpdate: [],
            skippedRows: [],
            errorRows: [],
            totalRows: data.length,
        };

        for (const row of data) {
            const name = row.name || row.Name;
            const price = row.price || row.Price;
            if (!name || !price) {
                analysis.errorRows.push({ ...row, error: 'Nom ou prix manquant' });
                continue;
            }

            const barcodes = (row.barcodes || row.Barcodes || '').split(',').map((b: string) => b.trim()).filter(Boolean);
            let existing: Product | undefined = undefined;

            if (barcodes.length > 0) {
                existing = existingProducts.find(p => p.barcodes?.some(b => barcodes.includes(b)));
            }
            if (!existing) {
                existing = existingProducts.find(p => p.name.toLowerCase() === name.toLowerCase());
            }

            const productData = {
                name,
                category: row.category || row.Category || '',
                price: parseFloat(price),
                purchasePrice: parseFloat(row.purchasePrice || row.PurchasePrice || '0'),
                quantity: parseInt(row.quantity || row.Quantity || '0', 10),
                minStockLevel: parseInt(row.minStockLevel || row.MinStockLevel || '10', 10),
                barcodes,
                imageUrl: row.imageUrl || row.ImageUrl || ''
            };

            if (existing) {
                analysis.productsToUpdate.push({ ...existing, ...productData });
            } else {
                analysis.productsToAdd.push(productData);
            }
        }
        return analysis;
    }

    async processProductImport(toAdd: any[], toUpdate: any[]): Promise<void> {
        return db.transaction('rw', db.products, async () => {
            await db.products.bulkAdd(toAdd);
            for (const p of toUpdate) {
                await db.products.update(p.id, p);
            }
        });
    }

    async exportProductsToCSV(): Promise<string> {
        const products = await db.products.toArray();
        const suppliers = await db.suppliers.toArray();
        const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

        const data = products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            purchasePrice: p.purchasePrice,
            quantity: p.quantity,
            minStockLevel: p.minStockLevel,
            unite: p.unite,
            dateExpiration: p.dateExpiration ? format(p.dateExpiration, 'yyyy-MM-dd') : '',
            fournisseur: p.fournisseurId ? supplierMap.get(p.fournisseurId) : '',
            dateMajPrix: p.dateMajPrix ? format(p.dateMajPrix, 'yyyy-MM-dd') : '',
            barcodes: p.barcodes?.join(','),
            imageUrl: p.imageUrl,
        }));
        return Papa.unparse(data);
    }
    
    async syncDataToGoogleSheet() {
        const profile = await this.getCompanyProfile();
        if (!profile || !profile.syncUrl) {
            throw new Error("L'URL du script de synchronisation Google Apps n'est pas configurée.");
        }

        const dataToSync = {
            products: await this.getAll('products'),
            customers: await this.getAll('customers'),
            sales: await this.getAll('sales'),
            expenses: await this.getAll('expenses'),
        };

        const response = await fetch(profile.syncUrl, {
            method: 'POST',
            mode: 'no-cors', // Important for simple requests to Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSync),
        });
        
        // As it's a no-cors request, we can't inspect the response.
        // We assume success if the request doesn't throw a network error.
        await this.updateCompanyProfile({ lastSyncDate: new Date().toISOString() });
    }
}

export const dataService = new DataService();
