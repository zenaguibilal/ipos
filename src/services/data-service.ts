'use client';

import { db, PosDatabase } from '@/lib/database';
import type { Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, Notification, InventoryLog, DashboardData, StockIntakeItem, CartItem, TopProduct, TopCustomer, GlobalActivityItem, ProductImportAnalysis, ZakatData, CostingItem, Draft, SaleItem, Supplier, ImportAnalysis, BreadClient, BreadOrder, BreadOrderWithClient } from '@/lib/types';
import type { CollectionName } from './initial-data';
import Dexie from 'dexie';
import { subDays } from 'date-fns';
import Papa from 'papaparse';
import { calculateCartTotals } from '@/lib/utils';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { sheetsService } from './googleSheets';

type TableName = keyof Pick<PosDatabase, 
    'products' | 'customers' | 'sales' | 'payments' | 
    'stockIntakes' | 'returns' | 'drafts' | 'companyProfile' | 
    'carts' | 'expenses' | 'settings' | 'notifications' | 'inventoryLogs' | 
    'suppliers' | 'clients_pain' | 'commandes_pain'
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
    return db.transaction('rw', db.settings, async () => {
        const result = await db.settings.put({ id, value });
        const record = await db.settings.get(id);
        sheetsService.addToQueue('settings', 'upsert', record);
        return result;
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
        const dataToSave: CompanyProfile = { id: 1, ...currentProfile, ...profileData, updatedAt: new Date() };
        const result = await db.companyProfile.put(dataToSave);
        sheetsService.addToQueue('companyProfile', 'upsert', dataToSave);
        return result;
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
                    throw new Error(`Stock limité pour "${product.name}". Quantité disponible: ${dbProduct.quantity}`);
                }
            }
            newItems[existingItemIndex] = { ...existingItem, cartQuantity: newQuantity, flash: true };
        } else {
            if (typeof product.id === 'number') {
                 const dbProduct = await db.products.get(product.id);
                if (dbProduct && quantity > dbProduct.quantity) {
                    throw new Error(`Stock insuffisant pour "${product.name}". Quantité disponible: ${dbProduct.quantity}`);
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
          const productWithTs = { ...product, createdAt: new Date(), updatedAt: new Date() };
          const newId = await db.products.add(productWithTs as Product);
          const record = await db.products.get(newId);
          sheetsService.addToQueue('products', 'upsert', record);

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
        
        const dataWithTs = { ...productData, updatedAt: new Date() };
        const result = await db.products.update(id, dataWithTs);
        const updatedRecord = await db.products.get(id);
        sheetsService.addToQueue('products', 'upsert', updatedRecord);

        if (productData.quantity !== undefined && oldProduct.quantity !== productData.quantity) {
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
          await db.products.delete(id);
          sheetsService.addToQueue('products', 'delete', { id });
      });
  }

  async deleteProducts(ids: number[]): Promise<void> {
    return db.transaction('rw', db.products, db.inventoryLogs, async () => {
        await db.inventoryLogs.where('productId').anyOf(ids).delete();
        await db.products.bulkDelete(ids);
        ids.forEach(id => sheetsService.addToQueue('products', 'delete', { id }));
    });
  }

  async getProducts(params: { query?: string; category?: string; supplierId?: number; stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock', sortBy?: string }): Promise<Product[]> {
    const { query, category, supplierId, stockStatus = 'all', sortBy = 'name_asc' } = params;

    let collection: Dexie.Collection<Product, number> = db.products.toCollection();

    if (category) {
      collection = db.products.where('category').equals(category);
    }
    
    if (stockStatus !== 'all') {
        collection = collection.filter(p => {
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

    if(supplierId) {
        collection = collection.filter(p => p.fournisseurId === supplierId);
    }
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      collection = collection.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.barcodes?.some(b => b.includes(lowerQuery))
      );
    }
    
    const [sortField, sortOrder] = sortBy.split('_');
    
    if (sortOrder === 'desc') {
        collection = collection.reverse();
    }
    
    return collection.sortBy(sortField);
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
      return this.getAll<Supplier>('suppliers');
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
    
    const getActivityDate = (item: Sale | Payment | ProductReturn): Date => {
        if ('paymentDate' in item) return new Date(item.paymentDate);
        return new Date(item.createdAt!);
    };

    return combined.sort((a, b) => getActivityDate(b).getTime() - getActivityDate(a).getTime());
  }

    async getCustomerStatementData(customerId: number): Promise<{ customer: Customer, unpaidSales: Sale[]}> {
        const customer = await this.getCustomerById(customerId);
        if (!customer) throw new Error("Client non trouvé");

        const unpaidSales = await db.sales.where({ customerId })
            .and(sale => sale.paymentStatus !== 'paid')
            .sortBy('createdAt');
        
        return { customer, unpaidSales };
    }

  async getCustomers(params: { query?: string; status?: 'all' | 'has_debt' | 'overdue' | 'over_limit', sortBy?: string }): Promise<Customer[]> {
    const { query, status = 'all', sortBy = 'lastName_asc' } = params;
    let collection: Dexie.Collection<Customer, number> = db.customers.toCollection();

    if (query) {
        const lowerQuery = query.toLowerCase();
        collection = collection.filter(c => c.searchName?.toLowerCase().includes(lowerQuery) || c.phone?.includes(lowerQuery));
    }
    
    let customersArray = await collection.toArray();
    
    const now = new Date();
    const customerWithData: Customer[] = customersArray.map(c => {
        let debtStatus: Customer['debtStatus'] = 'none';
        if (c.outstandingBalance > 0) {
            const dueDate = c.lastActivityDate && c.settlementDay ? new Date(new Date(c.lastActivityDate).getTime() + c.settlementDay * 24 * 60 * 60 * 1000) : null;
            if(dueDate && now > dueDate) {
                debtStatus = 'overdue';
            } else if (dueDate && subDays(dueDate, 7) <= now) {
                debtStatus = 'due_soon';
            }
        }
        
        const isOverLimit = c.creditLimit ? c.outstandingBalance > c.creditLimit : false;
        
        return { ...c, id: c.id!, debtStatus, isOverLimit };
    });
    
    let filteredCustomers = customerWithData;

    if (status) {
        switch (status) {
            case 'has_debt':
                filteredCustomers = customerWithData.filter(c => c.outstandingBalance > 0);
                break;
            case 'over_limit':
                filteredCustomers = customerWithData.filter(c => c.isOverLimit);
                break;
            case 'overdue':
                filteredCustomers = customerWithData.filter(c => c.debtStatus === 'overdue');
                break;
        }
    }

    const [sortField, sortOrder] = sortBy.split('_');

    return filteredCustomers.sort((a, b) => {
        const aValue = (a as any)[sortField];
        const bValue = (b as any)[sortField];

        let comparison = 0;
        if (aValue > bValue) comparison = 1;
        else if (aValue < bValue) comparison = -1;

        if (sortField.includes('Date')) {
            if (!aValue) return 1;
            if (!bValue) return -1;
        }

        return sortOrder === 'desc' ? comparison * -1 : comparison;
    });
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<number> {
    return db.transaction('rw', db.customers, async () => {
        const data = {
            ...customer,
            totalSpent: 0,
            outstandingBalance: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Customer;
        const newId = await db.customers.add(data);
        const record = await db.customers.get(newId);
        sheetsService.addToQueue('customers', 'upsert', record);
        return newId;
    });
  }

  async updateCustomer(id: number, customer: Partial<Omit<Customer, 'id'>>): Promise<number> {
      return db.transaction('rw', db.customers, async () => {
          const data = { ...customer, updatedAt: new Date() };
          const result = await db.customers.update(id, data);
          const record = await db.customers.get(id);
          sheetsService.addToQueue('customers', 'upsert', record);
          return result;
      });
  }

  async deleteCustomer(id: number): Promise<void> {
    return db.transaction('rw', db.customers, db.sales, db.payments, db.returns, async () => {
        const customer = await db.customers.get(id);
        if (!customer) return;
        if (customer.outstandingBalance > 0) {
            throw new Error(`Suppression impossible : ce client a un solde impayé de ${customer.outstandingBalance.toFixed(2)} DA`);
        }
        const salesCount = await db.sales.where({ customerId: id }).count();
        if (salesCount > 0) {
            throw new Error("Suppression impossible : ce client a un historique de transactions. Envisagez de le désactiver à la place.");
        }
        await db.payments.where({ customerId: id }).delete();
        await db.returns.where({ customerId: id }).delete();
        await db.customers.delete(id);
        sheetsService.addToQueue('customers', 'delete', { id });
    });
  }

  async exportCustomersToCSV(): Promise<string> {
    const customers = await this.getAll<Customer>('customers');
    return Papa.unparse(customers, {
        columns: ['id', 'firstName', 'lastName', 'phone', 'address', 'outstandingBalance', 'creditLimit', 'settlementDay', 'lastActivityDate', 'createdAt'],
        header: true
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
            if (!product || product.quantity < item.quantity) throw new Error(`Stock insuffisant pour "${product?.name || 'produit inconnu'}".`);
        }
        
        const newDebt = total - amountPaid;

        // Credit limit check
        if (customerId && newDebt > 0) {
            const customer = await db.customers.get(customerId);
            if (customer && typeof customer.creditLimit === 'number') {
                const futureBalance = customer.outstandingBalance + newDebt;
                if (futureBalance > customer.creditLimit) {
                    throw new Error(`Limite de crédit de ${customer.creditLimit.toFixed(2)} DA dépassée pour ${customer.firstName} ${customer.lastName}.`);
                }
            }
        }

        const saleToSave = {
            ...saleData,
            invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
            paymentStatus: amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid',
            remainingBalance: newDebt > 0 ? newDebt : 0,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Sale;
        const saleId = await db.sales.add(saleToSave);
        const record = await db.sales.get(saleId);
        sheetsService.addToQueue('sales', 'upsert', record);


        // Update stock, logs, and check for low stock notifications
        for (const item of items) {
            if (typeof item.id !== 'number') continue;
            const product = await db.products.get(item.id);
            if (!product) continue;
            
            const newQuantity = product.quantity - item.quantity;
            await db.products.update(item.id, { quantity: newQuantity, updatedAt: new Date() });
            const updatedProduct = await db.products.get(item.id);
            sheetsService.addToQueue('products', 'upsert', updatedProduct);

            
            await db.inventoryLogs.add({
                productId: item.id,
                change: -item.quantity,
                newQuantity,
                reason: 'sale',
                relatedId: saleId,
                createdAt: new Date()
            } as InventoryLog);

            if (newQuantity <= product.minStockLevel) {
                const isNotified = await db.notifications.where({ type: 'low-stock', relatedId: product.id, isRead: false }).first();
                if (!isNotified) {
                    await db.notifications.add({
                        type: 'low-stock',
                        message: `Le stock pour "${product.name}" est bas (${newQuantity} restants).`,
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
                c.updatedAt = new Date();
            });
            const updatedCustomer = await db.customers.get(customerId);
            sheetsService.addToQueue('customers', 'upsert', updatedCustomer);
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
                await db.products.update(item.id, { quantity: newQuantity, updatedAt: new Date() });
                const updatedProduct = await db.products.get(item.id);
                sheetsService.addToQueue('products', 'upsert', updatedProduct);

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

        if (sale.customerId && sale.remainingBalance > 0) {
            await db.customers.where({ id: sale.customerId }).modify(c => {
                c.outstandingBalance -= sale.remainingBalance;
                if (c.outstandingBalance < 0) c.outstandingBalance = 0;
                c.updatedAt = new Date();
            });
            const updatedCustomer = await db.customers.get(sale.customerId);
            sheetsService.addToQueue('customers', 'upsert', updatedCustomer);
        }

        await db.sales.delete(id);
        sheetsService.addToQueue('sales', 'delete', { id });
    });
  }
  
  // ====================================================================
  // Drafts
  // ====================================================================

  async saveDraft(cart: Cart, notes?: string): Promise<number> {
    return db.transaction('rw', db.drafts, async () => {
        const { total } = calculateCartTotals(cart);

        const draft: Omit<Draft, 'id'> = {
            date: new Date(),
            customerId: cart.customerId,
            customerName: cart.customerName,
            items: cart.items,
            total,
            discount: cart.discount,
            notes,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const newId = await db.drafts.add(draft as Draft);
        const record = await db.drafts.get(newId);
        sheetsService.addToQueue('drafts', 'upsert', record);
        return newId;
    });
  }

  async getDrafts(): Promise<Draft[]> {
    return db.drafts.orderBy('date').reverse().toArray();
  }

  async deleteDraft(id: number): Promise<void> {
    await db.drafts.delete(id);
    sheetsService.addToQueue('drafts', 'delete', { id });
  }

  // ====================================================================
  // Stock Intake - All writes are transactional
  // ====================================================================
   async addStockIntake(intakeData: { supplierName: string, invoiceNumber: string, invoiceDate?: Date }, items: StockIntakeItem[]): Promise<number> {
        return db.transaction('rw', db.products, db.stockIntakes, db.inventoryLogs, db.suppliers, async () => {
            const { supplierName, invoiceNumber, invoiceDate } = intakeData;

            // Step 1: Find or create the supplier
            let supplier = await db.suppliers.where('name').equalsIgnoreCase(supplierName).first();
            if (!supplier) {
                const supplierId = await db.suppliers.add({ name: supplierName, balance: 0, createdAt: new Date(), updatedAt: new Date() } as Supplier);
                supplier = await db.suppliers.get(supplierId);
                sheetsService.addToQueue('suppliers', 'upsert', supplier);
            } else {
                 await db.suppliers.update(supplier.id!, { updatedAt: new Date() });
                 supplier = await db.suppliers.get(supplier.id!);
                 sheetsService.addToQueue('suppliers', 'upsert', supplier);
            }


            // Step 2: Create the main stock intake record
            const totalValue = items.reduce((acc, item) => acc + item.purchasePrice * item.quantity, 0);
            const intakeToSave = {
                supplierId: supplier!.id!,
                supplierName: supplier!.name,
                invoiceNumber: invoiceNumber,
                invoiceDate: invoiceDate || new Date(),
                totalValue,
                items: [], // Will be populated at the end
                createdAt: new Date(),
                updatedAt: new Date()
            } as unknown as StockIntake;
            const intakeId = await db.stockIntakes.add(intakeToSave);
            
            const persistedItems: StockIntake['items'] = [];

            // Step 3: Process each item in the intake
            for (const item of items) {
                const quantityToAdd = item.quantity - item.quantityDamaged;
                if (quantityToAdd < 0) continue;

                let productId: number | undefined = item.productId;
                let productUpdateData: Partial<Product> = {
                    fournisseurId: supplier!.id, // Always update the supplier for the product
                    updatedAt: new Date()
                };

                if (item.isNew) {
                    const newProduct: Product = {
                        name: item.name, category: item.category, price: item.price,
                        purchasePrice: item.purchasePrice, quantity: 0, minStockLevel: 10, barcodes: item.barcodes,
                        dateMajPrix: new Date(),
                        fournisseurId: supplier!.id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    productId = await db.products.add(newProduct);
                    const newProductRecord = await db.products.get(productId);
                    sheetsService.addToQueue('products', 'upsert', newProductRecord);

                } else if (productId) {
                    const product = await db.products.get(productId);
                    if (product && product.purchasePrice !== item.purchasePrice) {
                        productUpdateData.dateMajPrix = new Date();
                    }
                }

                if (!productId) throw new Error(`ID de produit manquant pour "${item.name}"`);
                
                const product = await db.products.get(productId);
                const newQuantity = (product?.quantity || 0) + quantityToAdd;
                
                await db.products.update(productId, { 
                    quantity: newQuantity, 
                    purchasePrice: item.purchasePrice,
                    ...productUpdateData 
                });
                const updatedProduct = await db.products.get(productId);
                sheetsService.addToQueue('products', 'upsert', updatedProduct);

                await db.inventoryLogs.add({
                    productId, change: quantityToAdd, newQuantity,
                    reason: 'stock_intake', relatedId: intakeId,
                    createdAt: new Date()
                } as InventoryLog);
                
                persistedItems.push({ 
                    productId, 
                    productName: item.name, 
                    quantityReceived: item.quantity,
                    quantityDamaged: item.quantityDamaged,
                    purchasePrice: item.purchasePrice
                });
            }
            // Step 4: Update the intake with processed items and queue for sync
            await db.stockIntakes.update(intakeId, { items: persistedItems });
            const intakeRecord = await db.stockIntakes.get(intakeId);
            sheetsService.addToQueue('stockIntakes', 'upsert', intakeRecord);

            return intakeId;
        });
    }

    async applyNewPurchasePrices(costingItems: CostingItem[]): Promise<void> {
        return db.transaction('rw', db.products, async () => {
            for (const item of costingItems) {
                if (item.productId && typeof item.productId === 'number') {
                    await db.products.update(item.productId, { 
                        purchasePrice: item.finalCostPerUnit,
                        dateMajPrix: new Date(),
                        updatedAt: new Date()
                    });
                    const record = await db.products.get(item.productId);
                    sheetsService.addToQueue('products', 'upsert', record);
                }
            }
        });
    }
  
  async getStockIntakes(params: { query?: string; from?: Date; to?: Date }): Promise<StockIntake[]> {
    const { query, from, to } = params;
    let collection = (from && to) ? db.stockIntakes.where('createdAt').between(from, to, true, true) : db.stockIntakes.toCollection();
    let intakesArray = await collection.reverse().toArray();
    if (query) {
        const lowerQuery = query.toLowerCase();
        intakesArray = intakesArray.filter(intake => 
            intake.invoiceNumber.toLowerCase().includes(lowerQuery) || intake.supplierName.toLowerCase().includes(lowerQuery)
        );
    }
    return intakesArray;
  }
  
  async addPayment(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
      return db.transaction('rw', db.payments, db.customers, async () => {
          const data = {
              ...paymentData,
              createdAt: new Date(),
              updatedAt: new Date()
          } as Payment;
          const id = await db.payments.add(data);
          const record = await db.payments.get(id);
          sheetsService.addToQueue('payments', 'upsert', record);

          await db.customers.where('id').equals(paymentData.customerId).modify(c => {
              c.outstandingBalance = Math.max(0, c.outstandingBalance - paymentData.amount);
              c.lastActivityDate = new Date();
              c.updatedAt = new Date();
          });
          const updatedCustomer = await db.customers.get(paymentData.customerId);
          sheetsService.addToQueue('customers', 'upsert', updatedCustomer);

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
          const data = { ...returnData, createdAt: new Date(), updatedAt: new Date() } as ProductReturn;
          const returnId = await db.returns.add(data);
          const record = await db.returns.get(returnId);
          sheetsService.addToQueue('returns', 'upsert', record);

          for (const item of returnData.items) {
              if (item.productId && item.wasRestocked) {
                  const product = await db.products.get(item.productId);
                  const newQuantity = (product?.quantity || 0) + item.quantity;
                  await db.products.update(item.productId, { quantity: newQuantity, updatedAt: new Date() });
                  const updatedProduct = await db.products.get(item.productId);
                  sheetsService.addToQueue('products', 'upsert', updatedProduct);

                   await db.inventoryLogs.add({
                        productId: item.productId, change: item.quantity, newQuantity,
                        reason: 'return', relatedId: returnId,
                        createdAt: new Date()
                    } as InventoryLog);
              }
          }
          if (returnData.customerId) {
              const balanceEffect = returnData.totalReturnValue - returnData.amountRefunded;
              await db.customers.where('id').equals(returnData.customerId).modify(c => {
                  c.outstandingBalance = Math.max(0, c.outstandingBalance - balanceEffect);
                  c.lastActivityDate = new Date();
                  c.updatedAt = new Date();
              });
              const updatedCustomer = await db.customers.get(returnData.customerId);
              sheetsService.addToQueue('customers', 'upsert', updatedCustomer);
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
                    await db.products.update(item.productId, { quantity: newQuantity, updatedAt: new Date() });
                    const updatedProduct = await db.products.get(item.productId);
                    sheetsService.addToQueue('products', 'upsert', updatedProduct);

                     await db.inventoryLogs.add({
                        productId: item.productId, change: -item.quantity, newQuantity,
                        reason: 'cancellation', relatedId: `return-${id}`,
                        createdAt: new Date()
                    } as InventoryLog);
                }
            }
            if (productReturn.customerId) {
                const balanceEffect = productReturn.totalReturnValue - productReturn.amountRefunded;
                 await db.customers.where('id').equals(productReturn.customerId).modify(c => { 
                    c.outstandingBalance += balanceEffect;
                    c.updatedAt = new Date();
                 });
                 const updatedCustomer = await db.customers.get(productReturn.customerId);
                 sheetsService.addToQueue('customers', 'upsert', updatedCustomer);
            }
            await db.returns.delete(id);
            sheetsService.addToQueue('returns', 'delete', { id });
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

  async addExpense(expense: Omit<Expense, 'id'>): Promise<number> { 
    return db.transaction('rw', db.expenses, async () => {
        const data = { ...expense, createdAt: new Date(), updatedAt: new Date() } as Expense;
        const newId = await db.expenses.add(data);
        const record = await db.expenses.get(newId);
        sheetsService.addToQueue('expenses', 'upsert', record);
        return newId;
    }); 
  }
  async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id'>>): Promise<number> { 
    return db.transaction('rw', db.expenses, async () => {
        const data = { ...expenseData, updatedAt: new Date() };
        const result = await db.expenses.update(id, data);
        const record = await db.expenses.get(id);
        sheetsService.addToQueue('expenses', 'upsert', record);
        return result;
    }); 
  }
  async deleteExpense(id: number): Promise<void> { 
    return db.transaction('rw', db.expenses, async () => {
        await db.expenses.delete(id);
        sheetsService.addToQueue('expenses', 'delete', { id });
    }); 
  }
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
        ...intakes.map(i => ({ type: 'stock_intake', date: i.createdAt!, id: i.id!, description: `Réception de ${i.supplierName}`, details: `${i.items.length} article(s)`, amount: i.totalValue, amountClass: 'text-[hsl(var(--chart-quaternary))]' } as GlobalActivityItem)),
        ...returns.map(r => ({ type: 'return', date: r.createdAt!, id: r.id!, description: `Retour sur facture #${r.originalInvoiceNumber}`, details: `${r.items.length} article(s) retourné(s)`, amount: r.totalReturnValue, amountClass: 'text-destructive' } as GlobalActivityItem)),
        ...customers.map(c => ({ type: 'customer', date: c.createdAt!, id: c.id!, description: `Nouveau client`, details: `${c.firstName} ${c.lastName}` } as GlobalActivityItem)),
    ];
    return activity.sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
  }

  async exportData(): Promise<string> {
    const data: Partial<DB> = {};
    const tables: CollectionName[] = ['products', 'customers', 'sales', 'payments', 'stockIntakes', 'returns', 'expenses', 'notifications', 'settings', 'inventoryLogs', 'suppliers', 'clients_pain', 'commandes_pain'];
    await db.transaction('r', ...db.tables, async () => {
        for (const tableName of tables) data[tableName] = await db.table(tableName).toArray();
        const profile = await db.companyProfile.get(1);
        if(profile) data.companyProfile = profile;
    });
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonString: string): Promise<void> {
      const data: Partial<DB> = JSON.parse(jsonString);
      const tables: (CollectionName | 'companyProfile')[] = ['products', 'customers', 'sales', 'payments', 'stockIntakes', 'returns', 'expenses', 'notifications', 'settings', 'inventoryLogs', 'suppliers', 'clients_pain', 'commandes_pain', 'companyProfile'];
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
                address: c.address || '',
                totalSpent: 0,
                outstandingBalance: c.outstandingBalance ? parseFloat(c.outstandingBalance) : 0,
            }));
            await db.customers.bulkAdd(customersToAdd as any);
            
            for (const c of toUpdate) {
                await db.customers.update(c.id, {
                    firstName: c.firstName,
                    lastName: c.lastName,
                    phone: c.phone,
                    address: c.address,
                });
            }
        });
    }

    async exportProductsToCSV(): Promise<string> {
        const products = await this.getAll<Product>('products');
        return Papa.unparse(products, {
            columns: ['id', 'name', 'category', 'price', 'purchasePrice', 'quantity', 'minStockLevel', 'barcodes', 'unite', 'fournisseurId'],
            header: true
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
                category: row.category || row.Category || 'Autres',
                price: parseFloat(price),
                purchasePrice: parseFloat(row.purchasePrice || row.PurchasePrice || '0'),
                quantity: parseInt(row.quantity || row.Quantity || '0', 10),
                minStockLevel: parseInt(row.minStockLevel || row.MinStockLevel || '10', 10),
                barcodes,
                imageUrl: row.imageUrl || row.ImageUrl || '',
                unite: row.unite || 'Pièce',
                fournisseurId: row.fournisseurId ? parseInt(row.fournisseurId) : undefined
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
            suppliers: await this.getAll('suppliers'),
        };

        const response = await fetch(profile.syncUrl, {
            method: 'POST',
            mode: 'no-cors', // Important for simple requests to Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSync),
        });
        
        await this.updateCompanyProfile({ lastSyncDate: new Date().toISOString() });
    }

  // ====================================================================
  // Bread Management
  // ====================================================================

  async getBreadClients(): Promise<BreadClient[]> {
    return db.clients_pain.orderBy('nom').toArray();
  }

  async getManualBreadClients(): Promise<BreadClient[]> {
    return db.clients_pain.where('type_recurrence').equals('aucun').and(c => c.actif === true).sortBy('nom');
  }

  async addBreadClient(client: BreadClient): Promise<number> {
    return db.transaction('rw', db.clients_pain, async () => {
        const data = { ...client, createdAt: new Date(), updatedAt: new Date() };
        const newId = await db.clients_pain.add(data);
        const record = await db.clients_pain.get(newId);
        sheetsService.addToQueue('clients_pain', 'upsert', record);
        return newId;
    });
  }

  async updateBreadClient(id: number, data: Partial<BreadClient>): Promise<number> {
    return db.transaction('rw', db.clients_pain, async () => {
        const dataWithTs = { ...data, updatedAt: new Date() };
        const result = await db.clients_pain.update(id, dataWithTs);
        const record = await db.clients_pain.get(id);
        sheetsService.addToQueue('clients_pain', 'upsert', record);
        return result;
    });
  }

  async deleteBreadClient(id: number): Promise<void> {
    return db.transaction('rw', db.clients_pain, db.commandes_pain, async () => {
      await db.commandes_pain.where({ client_pain_id: id }).delete();
      await db.clients_pain.delete(id);
      sheetsService.addToQueue('clients_pain', 'delete', { id });
    });
  }

  async getBreadOrdersForDate(date: string): Promise<BreadOrderWithClient[]> {
    const orders = await db.commandes_pain.where({ date }).toArray();
    const clientIds = [...new Set(orders.map(o => o.client_pain_id))];
    const clients = await db.clients_pain.where('id').anyOf(clientIds).toArray();
    const clientMap = new Map(clients.map(c => [c.id!, c]));

    return orders.map(order => ({
      ...order,
      client: clientMap.get(order.client_pain_id) as BreadClient
    })).filter(o => o.client); // Filter out orders with no client
  }
  
  async checkIfBreadOrdersExist(date: string): Promise<boolean> {
    return (await db.commandes_pain.where({ date }).count()) > 0;
  }

  async createDayOrders(date: string): Promise<void> {
    return db.transaction('rw', db.clients_pain, db.commandes_pain, async () => {
      const jourActuel = BREAD_WEEK_DAYS[new Date(date.replace(/-/g, '/')).getUTCDay()] as keyof NonNullable<BreadClient['jours_semaine']>;
      
      const clients = await db.clients_pain.where('actif').equals(true).toArray();
      const newOrders: Omit<BreadOrder, 'id'>[] = [];

      for (const client of clients) {
        if (client.type_recurrence === 'aucun') continue;

        let quantite: number | undefined;

        if (client.type_recurrence === 'quotidien' && client.quantite_defaut) {
          quantite = client.quantite_defaut;
        } else if (client.type_recurrence === 'jours_specifiques' && client.jours_semaine) {
          const jourConfig = client.jours_semaine[jourActuel];
          if (jourConfig && jourConfig.actif) {
            quantite = jourConfig.quantite;
          }
        }
        
        if (quantite !== undefined && quantite > 0) {
          newOrders.push({
            client_pain_id: client.id!,
            date,
            quantite,
            quantite_origine: quantite,
            est_paye: false,
            est_livre: false,
            vente_id: null
          });
        }
      }

      if (newOrders.length > 0) {
        await db.commandes_pain.bulkAdd(newOrders as BreadOrder[]);
      }
    });
  }

  async addManualBreadOrder(clientId: number, date: string, quantity: number): Promise<void> {
    return db.transaction('rw', db.commandes_pain, async () => {
        const existing = await db.commandes_pain.where({ client_pain_id: clientId, date }).first();
        if (existing) {
            throw new Error("Ce client a déjà une commande pour ce jour. Veuillez modifier la commande existante.");
        }
        const data = {
            client_pain_id: clientId,
            date,
            quantite: quantity,
            quantite_origine: quantity,
            est_paye: false,
            est_livre: false,
            vente_id: null,
            createdAt: new Date(),
            updatedAt: new Date()
        } as BreadOrder;
        const newId = await db.commandes_pain.add(data);
        const record = await db.commandes_pain.get(newId);
        sheetsService.addToQueue('commandes_pain', 'upsert', record);
    });
  }

  async updateBreadOrderDeliveryStatus(orderId: number, est_livre: boolean): Promise<void> {
    await db.commandes_pain.update(orderId, { est_livre, updatedAt: new Date() });
    const record = await db.commandes_pain.get(orderId);
    sheetsService.addToQueue('commandes_pain', 'upsert', record);
  }

  async updateBreadOrderQuantity(orderId: number, newQuantity: number): Promise<void> {
    return db.transaction('rw', db.commandes_pain, async () => {
      const order = await db.commandes_pain.get(orderId);
      if (!order) return;
      const updateData: Partial<BreadOrder> = { quantite: newQuantity, updatedAt: new Date() };
      if (order.quantite_origine === undefined) {
        updateData.quantite_origine = order.quantite;
      }
      await db.commandes_pain.update(orderId, updateData);
      const record = await db.commandes_pain.get(orderId);
      sheetsService.addToQueue('commandes_pain', 'upsert', record);
    });
  }

  async convertBreadOrdersToSales(orderIds: number[], breadPrice: number): Promise<void> {
    return db.transaction('rw', db.sales, db.commandes_pain, db.customers, db.products, db.inventoryLogs, db.notifications, async () => {
      const ordersToConvert = await db.commandes_pain.where('id').anyOf(orderIds).and(o => !o.vente_id).toArray();
      const breadProductSaleItem: SaleItem = { id: 'pain', name: 'Pain', price: breadPrice, purchasePrice: 0, quantity: 0 };

      for (const order of ordersToConvert) {
        const clientPain = await db.clients_pain.get(order.client_pain_id);
        if (!clientPain) continue;

        const mainCustomer = await db.customers.where('searchName').equals(clientPain.nom.toLowerCase()).first();
        const total = order.quantite * breadPrice;

        const saleDataForDb: Sale = {
          items: [{...breadProductSaleItem, quantity: order.quantite}],
          subtotal: total,
          total,
          amountPaid: 0,
          remainingBalance: total,
          paymentStatus: 'unpaid',
          payments: [],
          customerId: mainCustomer?.id,
          customerName: mainCustomer ? `${mainCustomer.firstName} ${mainCustomer.lastName}` : clientPain.nom,
          clientPainId: clientPain.id,
          invoiceNumber: `INV-PAIN-${Date.now().toString(36).toUpperCase()}-${order.id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const saleId = await db.sales.add(saleDataForDb);
        const saleRecord = await db.sales.get(saleId);
        sheetsService.addToQueue('sales', 'upsert', saleRecord);


        if (mainCustomer) {
            await db.customers.where('id').equals(mainCustomer.id!).modify(c => {
                c.outstandingBalance = (c.outstandingBalance || 0) + total;
                c.totalSpent = (c.totalSpent || 0) + total;
                c.lastActivityDate = new Date();
                c.updatedAt = new Date();
            });
            const customerRecord = await db.customers.get(mainCustomer.id!);
            sheetsService.addToQueue('customers', 'upsert', customerRecord);
        }
        
        await db.commandes_pain.update(order.id!, { vente_id: saleId, est_paye: true, updatedAt: new Date() });
        const orderRecord = await db.commandes_pain.get(order.id!);
        sheetsService.addToQueue('commandes_pain', 'upsert', orderRecord);
      }
    });
  }
}

interface DB {
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    payments: Payment[];
    stockIntakes: StockIntake[];
    returns: ProductReturn[];
    expenses: Expense[];
    notifications: Notification[];
    settings: Setting[];
    inventoryLogs: InventoryLog[];
    suppliers: Supplier[];
    clients_pain: BreadClient[];
    commandes_pain: BreadOrder[];
    companyProfile?: CompanyProfile;
}

export const dataService = new DataService();
