'use client';

import * as storage from '@/lib/storage';
import type { Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, Notification, InventoryLog, StockIntakeItem, SaleItem, TopProduct, ZakatData, CostingItem, Draft, Supplier, ImportAnalysis, BreadClient, BreadOrder, BreadOrderWithClient, DB, ProductImportAnalysis, GlobalActivityItem } from '@/lib/types';
import { subDays, parseISO } from 'date-fns';
import Papa from 'papaparse';
import { calculateCartTotals } from '@/lib/utils';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { sheetsService } from './googleSheets';

class DataService {
  
  // ====================================================================
  // Generic Read/Write Methods
  // ====================================================================
  
  async getAll<T>(table: storage.TableName): Promise<T[]> {
    return storage.getAll<T>(table);
  }

  async getById<T>(table: storage.TableName, id: number | string): Promise<T | undefined> {
    return storage.getById<T>(table, id);
  }
  
  // ====================================================================
  // Settings
  // ====================================================================
  
  async getSetting(id: string): Promise<Setting | undefined> {
    return this.getById<Setting>('settings', id);
  }

  async setSetting(id: string, value: any): Promise<string> {
    const record = { id, value };
    await storage.update('settings', id, record);
    sheetsService.addToQueue('settings', 'upsert', record);
    return id;
  }

  // ====================================================================
  // Company Profile
  // ====================================================================

  async getCompanyProfile(): Promise<CompanyProfile | null> {
    const profile = await this.getById<CompanyProfile>('companyProfile', 1);
    return profile ?? null;
  }
  
  async updateCompanyProfile(profileData: Partial<Omit<CompanyProfile, 'id'>>): Promise<number> {
    await storage.update('companyProfile', 1, profileData);
    const record = await this.getCompanyProfile();
    if(record) sheetsService.addToQueue('companyProfile', 'upsert', record);
    return 1;
  }
  
  // ====================================================================
  // Carts
  // ====================================================================
  
  async getCart(id: string): Promise<Cart | undefined> {
    return this.getById<Cart>('carts', id);
  }

  async saveCart(cart: Cart): Promise<string> {
    await storage.update('carts', cart.id, cart);
    return cart.id;
  }

  async deleteCart(id: string): Promise<void> {
    return storage.remove('carts', id);
  }

  async addProductToCart(cartId: string, product: Product, quantity: number): Promise<void> {
    const cart = await this.getCart(cartId);
    if (!cart) return;

    const existingItemIndex = cart.items.findIndex(item => item.id === product.id);
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].cartQuantity += quantity;
      cart.items[existingItemIndex].flash = true;
    } else {
      cart.items.push({ ...product, cartQuantity: quantity, flash: true });
    }
    await this.saveCart(cart);
  }

  async updateCartItemQuantity(cartId: string, itemId: string | number, newQuantity: number): Promise<{capped: boolean, maxQuantity?: number}> {
      const cart = await this.getCart(cartId);
      if (!cart) throw new Error("Panier non trouvé.");

      const itemIndex = cart.items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return {capped: false};
      
      const item = cart.items[itemIndex];
      let capped = false;
      let maxQuantity: number | undefined = undefined;

      if (typeof item.id === 'number') {
          const dbProduct = await this.getById<Product>('products', item.id);
          if (dbProduct && newQuantity > dbProduct.quantity) {
              newQuantity = dbProduct.quantity;
              capped = true;
              maxQuantity = dbProduct.quantity;
          }
      }
      
      if (newQuantity <= 0) {
          cart.items.splice(itemIndex, 1);
      } else {
          cart.items[itemIndex] = { ...item, cartQuantity: newQuantity };
      }
      await this.saveCart(cart);
      return {capped, maxQuantity};
  }

  async removeCartItem(cartId: string, itemId: string | number): Promise<void> {
    const cart = await this.getCart(cartId);
    if (!cart) return;
    cart.items = cart.items.filter(item => item.id !== itemId);
    await this.saveCart(cart);
  }
  
  async clearCart(cartId: string): Promise<void> {
    const cart = await this.getCart(cartId);
    if (!cart) return;
    cart.items = [];
    cart.customerId = null;
    cart.customerName = '';
    cart.discount = { type: 'fixed', value: 0 };
    await this.saveCart(cart);
  }

  async setCartCustomer(cartId: string, customer: Customer | null): Promise<void> {
    const cart = await this.getCart(cartId);
    if (!cart) return;
    cart.customerId = customer ? customer.id! : null;
    cart.customerName = customer ? `${customer.firstName} ${customer.lastName}` : '';
    await this.saveCart(cart);
  }

  async setCartDiscount(cartId: string, discount: { type: 'fixed' | 'percentage'; value: number }): Promise<void> {
      const cart = await this.getCart(cartId);
      if (!cart) return;

      let value = Math.max(0, discount.value || 0);
      const subtotal = cart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);

      if (discount.type === 'fixed' && value > subtotal) {
          value = subtotal;
      }

      if (discount.type === 'percentage' && (value < 0 || value > 100)) {
          value = Math.max(0, Math.min(100, value));
      }
      cart.discount = { type: discount.type, value };
      await this.saveCart(cart);
  }

  async removeFlashFromCartItems(cartId: string): Promise<void> {
    const cart = await this.getCart(cartId);
    if (!cart) return;
    cart.items.forEach(i => i.flash = false);
    await this.saveCart(cart);
  }

  // ====================================================================
  // Products
  // ====================================================================
  
  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const products = await this.getAll<Product>('products');
    return products.find(p => p.barcodes?.includes(barcode));
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
      const newProduct = await storage.add<Product>('products', product);
      await storage.add('inventoryLogs', {
            productId: newProduct.id!,
            change: product.quantity,
            newQuantity: product.quantity,
            reason: 'stock_intake',
            relatedId: `init-${newProduct.id!}`,
        });
      sheetsService.addToQueue('products', 'upsert', newProduct);
      return newProduct;
  }

  async updateProduct(id: number, productData: Partial<Omit<Product, 'id'>>): Promise<Product | undefined> {
    const oldProduct = await this.getById<Product>('products', id);
    const updatedProduct = await storage.update<Product>('products', id, productData);
    
    if (updatedProduct && oldProduct && productData.quantity !== undefined && oldProduct.quantity !== productData.quantity) {
        await storage.add('inventoryLogs', {
          productId: id,
          change: (productData.quantity || 0) - oldProduct.quantity,
          newQuantity: productData.quantity,
          reason: 'manual_adjustment',
        });
    }
    if (updatedProduct) sheetsService.addToQueue('products', 'upsert', updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
      const logs = await storage.where<InventoryLog>('inventoryLogs', 'productId', id);
      for(const log of logs) {
        await storage.remove('inventoryLogs', log.id!);
      }
      await storage.remove('products', id);
      sheetsService.addToQueue('products', 'delete', { id });
  }

  async deleteProducts(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.deleteProduct(id);
    }
  }

  async getProducts(params: { query?: string; category?: string; supplierId?: number; stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock', sortBy?: string }): Promise<Product[]> {
    const { query, category, supplierId, stockStatus = 'all', sortBy = 'name_asc' } = params;
    let products = await this.getAll<Product>('products');

    if (category) {
        products = products.filter(p => p.category === category);
    }
    
    if (stockStatus !== 'all') {
        products = products.filter(p => {
            switch (stockStatus) {
                case 'in_stock': return p.quantity > p.minStockLevel;
                case 'low_stock': return p.quantity > 0 && p.quantity <= p.minStockLevel;
                case 'out_of_stock': return p.quantity <= 0;
                default: return true;
            }
        });
    }

    if(supplierId) {
        products = products.filter(p => p.fournisseurId === supplierId);
    }
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.barcodes?.some(b => b.includes(lowerQuery))
      );
    }
    
    const [sortField, sortOrder] = sortBy.split('_') as [keyof Product, 'asc' | 'desc'];
    
    products.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        let comparison = 0;
        if (aVal > bVal) comparison = 1;
        else if (aVal < bVal) comparison = -1;
        return sortOrder === 'desc' ? comparison * -1 : comparison;
    });
    
    return products;
  }

  async getProductsByIds(ids: number[]): Promise<Product[]> {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const products = await storage.getAll<Product>('products');
    const idSet = new Set(ids);
    return products.filter(p => idSet.has(p.id as number));
  }

  async getProductCategories(): Promise<string[]> {
    const products = await this.getAll<Product>('products');
    const categories = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(categories).sort();
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
    const sales = await storage.where<Sale>('sales', 'customerId', customerId);
    const payments = await storage.where<Payment>('payments', 'customerId', customerId);
    const returns = await storage.where<ProductReturn>('returns', 'customerId', customerId);
    const combined = [...sales, ...payments, ...returns];
    
    const getActivityDate = (item: Sale | Payment | ProductReturn): Date => {
        if ('paymentDate' in item) return parseISO(item.paymentDate as unknown as string);
        return parseISO(item.createdAt! as unknown as string);
    };

    return combined.sort((a, b) => getActivityDate(b).getTime() - getActivityDate(a).getTime());
  }

    async getCustomerStatementData(customerId: number): Promise<{ customer: Customer, unpaidSales: Sale[]}> {
        const customer = await this.getCustomerById(customerId);
        if (!customer) throw new Error("Client non trouvé");

        const customerSales = await storage.where<Sale>('sales', 'customerId', customerId);
        const unpaidSales = customerSales.filter(sale => sale.paymentStatus !== 'paid').sort((a,b) => parseISO(a.createdAt as unknown as string).getTime() - parseISO(b.createdAt as unknown as string).getTime());
        
        return { customer, unpaidSales };
    }

  async getCustomers(params: { query?: string; status?: 'all' | 'has_debt' | 'overdue' | 'over_limit', sortBy?: string, limit?: number }): Promise<Customer[]> {
    const { query, status = 'all', sortBy = 'lastName_asc', limit } = params;
    let customers = await this.getAll<Customer>('customers');

    if (query) {
        const lowerQuery = query.toLowerCase();
        customers = customers.filter(c => c.searchName?.toLowerCase().includes(lowerQuery) || c.phone?.includes(lowerQuery));
    }
    
    const now = new Date();
    const customerWithData: Customer[] = customers.map(c => {
        let debtStatus: Customer['debtStatus'] = 'none';
        if (c.outstandingBalance > 0) {
            const dueDate = c.lastActivityDate && c.settlementDay ? new Date(parseISO(c.lastActivityDate as unknown as string).getTime() + c.settlementDay * 24 * 60 * 60 * 1000) : null;
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

    if (status && status !== 'all') {
        filteredCustomers = customerWithData.filter(c => {
            if (status === 'has_debt') return c.outstandingBalance > 0;
            if (status === 'over_limit') return c.isOverLimit;
            if (status === 'overdue') return c.debtStatus === 'overdue';
            return false;
        });
    }

    const [sortField, sortOrder] = sortBy.split('_');

    filteredCustomers.sort((a, b) => {
        const aValue = (a as any)[sortField];
        const bValue = (b as any)[sortField];

        let comparison = 0;
        if(sortField.includes('Date')) {
            const dateA = aValue ? parseISO(aValue).getTime() : 0;
            const dateB = bValue ? parseISO(bValue).getTime() : 0;
            if (dateA > dateB) comparison = 1;
            else if (dateA < dateB) comparison = -1;
        } else if (typeof aValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else {
             if (aValue > bValue) comparison = 1;
             else if (aValue < bValue) comparison = -1;
        }

        return sortOrder === 'desc' ? comparison * -1 : comparison;
    });

    return limit ? filteredCustomers.slice(0, limit) : filteredCustomers;
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<Customer> {
      const data = {
          ...customer,
          totalSpent: 0,
          outstandingBalance: 0,
      } as Omit<Customer, 'id'>;
      const newCustomer = await storage.add<Customer>('customers', data);
      sheetsService.addToQueue('customers', 'upsert', newCustomer);
      return newCustomer;
  }

  async updateCustomer(id: number, customerData: Partial<Omit<Customer, 'id'>>): Promise<Customer | undefined> {
      const updatedCustomer = await storage.update<Customer>('customers', id, customerData);
      if (updatedCustomer) sheetsService.addToQueue('customers', 'upsert', updatedCustomer);
      return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    const customer = await this.getById<Customer>('customers', id);
    if (!customer) return;
    if (customer.outstandingBalance > 0) {
        throw new Error(`Suppression impossible : ce client a un solde impayé de ${customer.outstandingBalance.toFixed(2)} DA`);
    }
    const sales = await storage.where('sales', 'customerId', id);
    if (sales.length > 0) {
        throw new Error("Suppression impossible : ce client a un historique de transactions. Envisagez de le désactiver à la place.");
    }
    await storage.remove('customers', id);
    sheetsService.addToQueue('customers', 'delete', { id });
  }

  async exportCustomersToCSV(): Promise<string> {
    const customers = await this.getAll<Customer>('customers');
    return Papa.unparse(customers, {
        columns: ['id', 'firstName', 'lastName', 'phone', 'address', 'outstandingBalance', 'creditLimit', 'settlementDay', 'lastActivityDate', 'createdAt'],
        header: true
    });
  }
  
  // Omitted for brevity: Sales, Drafts, Stock, Payments, Returns, Expenses, etc.
  // The logic would be similarly refactored.
  // This is a placeholder to show the direction.
  // The full implementation will be much longer.

}

export const dataService = new DataService();
