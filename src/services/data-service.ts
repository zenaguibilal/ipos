'use client';

import { openDB, promisify } from '@/lib/database';
import type { TableName, Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, Notification, InventoryLog, StockIntakeItem, SaleItem, ZakatData, CostingItem, Draft, Supplier, ImportAnalysis, BreadClient, BreadOrder, BreadOrderWithClient, DB, ProductImportAnalysis, GlobalActivityItem, DashboardDataType } from '@/lib/types';
import { subDays } from 'date-fns';
import Papa from 'papaparse';
import { calculateCartTotals } from '@/lib/utils';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { sheetsService } from './googleSheets';

class DataService {
  
  private async getStore<T>(table: TableName, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await openDB();
    return db.transaction(table, mode).objectStore(table);
  }

  async getAll<T>(table: TableName): Promise<T[]> {
    const store = await this.getStore(table);
    return promisify<T[]>(store.getAll());
  }

  async getById<T>(table: TableName, id: any): Promise<T | undefined> {
    if (id === undefined || id === null) return undefined;
    const store = await this.getStore(table);
    return promisify<T | undefined>(store.get(id));
  }

  private async add<T>(table: TableName, item: any): Promise<any> {
    const store = await this.getStore(table, 'readwrite');
    const now = new Date();
    const fullItem = { ...item, createdAt: now, updatedAt: now };
    const id = await promisify(store.add(fullItem));
    return { ...fullItem, id };
  }

  private async update<T>(table: TableName, id: any, changes: Partial<T>): Promise<any> {
    const store = await this.getStore(table, 'readwrite');
    const existing = await promisify(store.get(id));
    if (existing) {
      const updatedItem = { ...existing, ...changes, updatedAt: new Date() };
      await promisify(store.put(updatedItem));
      return updatedItem;
    }
    return undefined;
  }

  private async delete(table: TableName, id: any): Promise<void> {
    const store = await this.getStore(table, 'readwrite');
    await promisify(store.delete(id));
  }

  private async where<T>(table: TableName, indexName: string, query: any): Promise<T[]> {
    const store = await this.getStore(table);
    if (store.indexNames.contains(indexName)) {
        const index = store.index(indexName);
        return promisify(index.getAll(query));
    }
    // Fallback if index not found
    const all = await this.getAll<any>(table);
    return all.filter((item: any) => item[indexName] === query);
  }
  
  async getSetting(id: string): Promise<Setting | undefined> {
    return this.getById<Setting>('settings', id);
  }

  async setSetting(id: string, value: any): Promise<string> {
    const store = await this.getStore('settings', 'readwrite');
    await promisify(store.put({ id, value }));
    sheetsService.addToQueue('settings', 'upsert', { id, value });
    return id;
  }

  async getCompanyProfile(): Promise<CompanyProfile | null> {
    return (await this.getById<CompanyProfile>('companyProfile', 1)) || null;
  }
  
  async updateCompanyProfile(profileData: Partial<Omit<CompanyProfile, 'id'>>): Promise<number> {
    const profile = (await this.getCompanyProfile()) ?? { id: 1 };
    const updatedProfile = { ...profile, ...profileData, id: 1, updatedAt: new Date() };
    const store = await this.getStore('companyProfile', 'readwrite');
    await promisify(store.put(updatedProfile));
    sheetsService.addToQueue('companyProfile', 'upsert', updatedProfile);
    return 1;
  }
  
  async getCart(id: string): Promise<Cart | undefined> {
    return this.getById<Cart>('carts', id);
  }

  async saveCart(cart: Cart): Promise<string> {
    const store = await this.getStore('carts', 'readwrite');
    await promisify(store.put(cart));
    return cart.id;
  }

  async deleteCart(id: string): Promise<void> {
    await this.delete('carts', id);
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
          const product = await this.getById<Product>('products', item.id);
          if (product && newQuantity > product.quantity) {
              newQuantity = product.quantity;
              capped = true;
              maxQuantity = product.quantity;
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
    cart.items.forEach(i => { if(i.flash) i.flash = false });
    await this.saveCart(cart);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const products = await this.where<Product>('products', 'barcodes_idx', barcode);
    return products[0];
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
      const newProduct = await this.add<Product>('products', product);
      await this.add<InventoryLog>('inventoryLogs', {
            productId: newProduct.id as number,
            change: product.quantity,
            newQuantity: product.quantity,
            reason: 'stock_intake',
            relatedId: `init-${newProduct.id as number}`,
        });
      sheetsService.addToQueue('products', 'upsert', newProduct);
      return newProduct;
  }

  async updateProduct(id: number, productData: Partial<Omit<Product, 'id'>>): Promise<Product | undefined> {
    const oldProduct = await this.getById<Product>('products', id);
    const updatedProduct = await this.update<Product>('products', id, productData);
    
    if (updatedProduct && oldProduct && productData.quantity !== undefined && oldProduct.quantity !== productData.quantity) {
        await this.add<InventoryLog>('inventoryLogs', {
          productId: id,
          change: (productData.quantity || 0) - oldProduct.quantity,
          newQuantity: productData.quantity!,
          reason: 'manual_adjustment',
        });
    }
    if (updatedProduct) sheetsService.addToQueue('products', 'upsert', updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
      const logs = await this.where('inventoryLogs', 'productId', id);
      const logIds = logs.map((l: any) => l.id);
      const db = await openDB();
      const tx = db.transaction(['inventoryLogs', 'products'], 'readwrite');
      const logsStore = tx.objectStore('inventoryLogs');
      const productsStore = tx.objectStore('products');
      logIds.forEach(logId => logsStore.delete(logId));
      productsStore.delete(id);
      await promisify(tx.done);
      sheetsService.addToQueue('products', 'delete', { id });
  }

  async deleteProducts(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.deleteProduct(id);
    }
  }

  async getProducts(params: { query?: string; category?: string; supplierId?: number; stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock', sortBy?: string }): Promise<Product[]> {
    const { query, category, supplierId, stockStatus = 'all', sortBy = 'createdAt_desc' } = params;
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
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = new Date(aVal).getTime() - new Date(bVal).getTime();
        } else if (aVal && !bVal) {
            return -1;
        } else if (!aVal && bVal) {
            return 1;
        }
        return sortOrder === 'desc' ? comparison * -1 : comparison;
    });
    return products;
  }

  async getProductsByIds(ids: number[]): Promise<Product[]> {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const products = await this.getAll<Product>('products');
    const idSet = new Set(ids);
    return products.filter(p => idSet.has(p.id as number));
  }

  async getProductCategories(): Promise<string[]> {
    const products = await this.getAll<Product>('products');
    const categories = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(categories).sort();
  }
  
  async getSuppliers(): Promise<Supplier[]> {
      const suppliers = await this.getAll<Supplier>('suppliers');
      return suppliers.sort((a,b) => a.name.localeCompare(b.name));
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
      return this.getById<Customer>('customers', id);
  }

  async getCustomerActivity(customerId: number): Promise<GlobalActivityItem[]> {
    if (!customerId) return [];
    const [sales, payments, returns] = await Promise.all([
          this.where<Sale>('sales', 'customerId', customerId),
          this.where<Payment>('payments', 'customerId', customerId),
          this.where<ProductReturn>('returns', 'customerId', customerId)
    ]);
    const activity: GlobalActivityItem[] = [];
    sales.forEach(s => s.createdAt && activity.push({ type: 'sale', date: new Date(s.createdAt), id: s.id!, description: `Vente #${s.invoiceNumber}`, details: s.customerName || 'Client de passage', amount: s.total, amountClass: 'text-primary' }));
    returns.forEach(r => r.createdAt && activity.push({ type: 'return', date: new Date(r.createdAt), id: r.id!, description: `Retour sur facture #${r.originalInvoiceNumber}`, details: `${r.items.length} article(s) retourné(s)`, amount: r.totalReturnValue, amountClass: 'text-destructive' }));
    payments.forEach(p => p.paymentDate && activity.push({ type: 'payment', date: new Date(p.paymentDate), id: p.id!, description: 'Paiement reçu', details: p.notes || '', amount: p.amount, amountClass: 'text-chart-quaternary' }));
    return activity.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getCustomerStatementData(customerId: number): Promise<{ customer: Customer, unpaidSales: Sale[]}> {
      const customer = await this.getCustomerById(customerId);
      if (!customer) throw new Error("Client non trouvé");
      const customerSales = await this.where<Sale>('sales', 'customerId', customerId);
      const unpaidSales = customerSales.filter(sale => sale.paymentStatus !== 'paid').sort((a,b) => (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0));
      return { customer, unpaidSales };
  }

  async getCustomers(params: { query?: string; status?: 'all' | 'has_debt' | 'overdue' | 'over_limit', sortBy?: string, limit?: number }): Promise<Customer[]> {
    const { query, status = 'all', sortBy = 'lastName_asc', limit } = params;
    let customers = await this.getAll<Customer>('customers');

    if (query) {
        const lowerQuery = query.toLowerCase();
        customers = customers.filter(c => (c.searchName || '').toLowerCase().includes(lowerQuery) || c.phone?.includes(lowerQuery));
    }
    
    const now = new Date();
    const customerWithData: Customer[] = customers.map(c => {
        let debtStatus: Customer['debtStatus'] = 'none';
        if (c.outstandingBalance > 0 && c.lastActivityDate && c.settlementDay) {
            const dueDate = new Date(new Date(c.lastActivityDate).getTime() + c.settlementDay * 24 * 60 * 60 * 1000);
            if(now > dueDate) debtStatus = 'overdue';
            else if (subDays(dueDate, 7) <= now) debtStatus = 'due_soon';
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
        if(sortField.includes('Date') && aValue && bValue) {
            comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
             comparison = aValue - bValue;
        }
        return sortOrder === 'desc' ? comparison * -1 : comparison;
    });

    return limit ? filteredCustomers.slice(0, limit) : filteredCustomers;
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<Customer> {
      const data = { ...customer, totalSpent: 0, outstandingBalance: 0 };
      const newCustomer = await this.add<Customer>('customers', data);
      sheetsService.addToQueue('customers', 'upsert', newCustomer);
      return newCustomer;
  }

  async updateCustomer(id: number, customerData: Partial<Omit<Customer, 'id'>>): Promise<Customer | undefined> {
      const updatedCustomer = await this.update<Customer>('customers', id, customerData);
      if (updatedCustomer) sheetsService.addToQueue('customers', 'upsert', updatedCustomer);
      return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    const customer = await this.getById<Customer>('customers', id);
    if (!customer) return;
    if (customer.outstandingBalance > 0) {
        throw new Error(`Suppression impossible : ce client a un solde impayé de ${customer.outstandingBalance.toFixed(2)} DA`);
    }
    const sales = await this.where('sales', 'customerId', id);
    if (sales.length > 0) {
        throw new Error("Suppression impossible : ce client a un historique de transactions. Envisagez de le désactiver à la place.");
    }
    await this.delete('customers', id);
    sheetsService.addToQueue('customers', 'delete', { id });
  }

  async exportCustomersToCSV(): Promise<string> {
    const customers = await this.getAll<Customer>('customers');
    return Papa.unparse(customers.map(c => ({
        id: c.id, firstName: c.firstName, lastName: c.lastName, phone: c.phone, address: c.address,
        outstandingBalance: c.outstandingBalance, creditLimit: c.creditLimit, settlementDay: c.settlementDay,
        lastActivityDate: c.lastActivityDate, createdAt: c.createdAt,
    })), { header: true });
  }

  async analyzeCustomerImport(data: any[]): Promise<ImportAnalysis> {
        const allCustomers = await this.getAll<Customer>('customers');
        const analysis: ImportAnalysis = {
            customersToAdd: [], customersToUpdate: [], skippedRows: [], errorRows: [], totalRows: data.length
        };
        for (const row of data) {
            if (!row.firstName || !row.lastName) { analysis.errorRows.push(row); continue; }
            const existingCustomer = allCustomers.find(c => c.firstName === row.firstName && c.lastName === row.lastName);
            if (existingCustomer) analysis.customersToUpdate.push({ ...row, id: existingCustomer.id });
            else analysis.customersToAdd.push(row);
        }
        return analysis;
    }

    async processCustomerImport(toAdd: any[], toUpdate: any[]): Promise<void> {
        for (const row of toAdd) await this.addCustomer(this.mapRowToCustomer(row));
        for (const row of toUpdate) await this.updateCustomer(row.id, this.mapRowToCustomer(row));
    }
    
    private mapRowToCustomer(row: any) {
        return {
            firstName: row.firstName, lastName: row.lastName, phone: row.phone || '', address: row.address || '',
            creditLimit: parseFloat(row.creditLimit) || undefined, settlementDay: parseInt(row.settlementDay) || undefined,
        };
    }
    
     async analyzeProductImport(data: any[]): Promise<ProductImportAnalysis> {
        const allProducts = await this.getAll<Product>('products');
        const analysis: ProductImportAnalysis = {
            productsToAdd: [], productsToUpdate: [], skippedRows: [], errorRows: [], totalRows: data.length
        };
        for (const row of data) {
            if (!row.name || !row.price) { analysis.errorRows.push(row); continue; }
            const existingProduct = allProducts.find(p => p.name.toLowerCase() === row.name.toLowerCase());
            if (existingProduct) analysis.productsToUpdate.push({ ...row, id: existingProduct.id });
            else analysis.productsToAdd.push(row);
        }
        return analysis;
    }

    async processProductImport(toAdd: any[], toUpdate: any[]): Promise<void> {
        for (const row of toAdd) await this.addProduct(this.mapRowToProduct(row));
        for (const row of toUpdate) await this.updateProduct(row.id, this.mapRowToProduct(row));
    }
    
    private mapRowToProduct(row: any): Omit<Product, 'id'> {
        return {
            name: row.name, category: row.category || 'Non classé', price: parseFloat(row.price) || 0,
            purchasePrice: parseFloat(row.purchasePrice) || 0, quantity: parseInt(row.quantity) || 0,
            minStockLevel: parseInt(row.minStockLevel) || 10,
            barcodes: row.barcodes ? String(row.barcodes).split(',').map(b => b.trim()) : [],
            unite: row.unite || 'Pièce',
        };
    }
    
    async exportProductsToCSV(): Promise<string> {
        const products = await this.getAll<Product>('products');
        return Papa.unparse(products);
    }
    
    async getZakatData(): Promise<ZakatData> {
        const products = await this.getAll<Product>('products');
        const customers = await this.getAll<Customer>('customers');
        const inventoryValue = products.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
        const totalReceivables = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
        return { inventoryValue, totalReceivables };
    }
  
  async getBreadClients(): Promise<BreadClient[]> {
    return this.getAll<BreadClient>('clients_pain');
  }

  async addBreadClient(client: Omit<BreadClient, 'id'>): Promise<BreadClient> {
    const newClient = await this.add<BreadClient>('clients_pain', client);
    sheetsService.addToQueue('clients_pain', 'upsert', newClient);
    return newClient;
  }

  async updateBreadClient(id: number, data: Partial<BreadClient>): Promise<BreadClient | undefined> {
    const updatedClient = await this.update<BreadClient>('clients_pain', id, data);
    if (updatedClient) sheetsService.addToQueue('clients_pain', 'upsert', updatedClient);
    return updatedClient;
  }

  async deleteBreadClient(id: number): Promise<void> {
    const orders = await this.where<BreadOrder>('commandes_pain', 'client_pain_id', id);
    const db = await openDB();
    const tx = db.transaction(['commandes_pain', 'clients_pain'], 'readwrite');
    orders.forEach(o => tx.objectStore('commandes_pain').delete(o.id!));
    tx.objectStore('clients_pain').delete(id);
    await promisify(tx.done);
    sheetsService.addToQueue('clients_pain', 'delete', { id });
  }

  async getManualBreadClients(): Promise<BreadClient[]> {
    const clients = await this.getAll<BreadClient>('clients_pain');
    return clients.filter(c => c.type_recurrence === 'aucun' && c.actif === true);
  }

  async addManualBreadOrder(clientId: number, date: string, quantity: number): Promise<BreadOrder> {
    const orders = await this.getAll<BreadOrder>('commandes_pain');
    const existing = orders.find(o => o.client_pain_id === clientId && o.date === date);
    if(existing) throw new Error("Une commande pour ce client existe déjà à cette date.");
    const orderData: Omit<BreadOrder, 'id'> = { client_pain_id: clientId, date, quantite: quantity, est_paye: false, est_livre: false, vente_id: null };
    const newOrder = await this.add<BreadOrder>('commandes_pain', orderData);
    sheetsService.addToQueue('commandes_pain', 'upsert', newOrder);
    return newOrder;
  }
  
  async updateBreadOrderQuantity(orderId: number, newQuantity: number): Promise<BreadOrder | undefined> {
    const order = await this.getById<BreadOrder>('commandes_pain', orderId);
    if (!order) return undefined;
    const updated = await this.update<BreadOrder>('commandes_pain', orderId, { quantite: newQuantity, quantite_origine: order.quantite });
    if (updated) sheetsService.addToQueue('commandes_pain', 'upsert', {id: orderId, quantite: newQuantity, quantite_origine: order.quantite});
    return updated;
  }

  async updateBreadOrderDeliveryStatus(orderId: number, delivered: boolean): Promise<BreadOrder | undefined> {
    const updated = await this.update<BreadOrder>('commandes_pain', orderId, { est_livre: delivered });
    if(updated) sheetsService.addToQueue('commandes_pain', 'upsert', {id: orderId, est_livre: delivered });
    return updated;
  }
  
  async checkIfBreadOrdersExist(date: string): Promise<boolean> {
    const orders = await this.where<BreadOrder>('commandes_pain', 'date', date);
    return orders.length > 0;
  }

  async createDayOrders(date: string): Promise<void> {
    const dayOfWeek = BREAD_WEEK_DAYS[new Date(date.replace(/-/g, '/')).getUTCDay()];
    const activeClients = (await this.getAll<BreadClient>('clients_pain')).filter(c => c.actif);
    const ordersToCreate: Omit<BreadOrder, 'id'>[] = [];
    for (const client of activeClients) {
      let quantity: number | undefined;
      if (client.type_recurrence === 'quotidien') quantity = client.quantite_defaut;
      else if (client.type_recurrence === 'jours_specifiques' && client.jours_semaine?.[dayOfWeek]?.actif) {
        quantity = client.jours_semaine[dayOfWeek].quantite;
      }
      if (quantity && quantity > 0) {
        ordersToCreate.push({ client_pain_id: client.id!, date, quantite, est_paye: false, est_livre: false, vente_id: null });
      }
    }
    if(ordersToCreate.length > 0) {
      const db = await openDB();
      const tx = db.transaction('commandes_pain', 'readwrite');
      const store = tx.objectStore('commandes_pain');
      for(const order of ordersToCreate) {
          const newOrder = await promisify(store.add(order));
          sheetsService.addToQueue('commandes_pain', 'upsert', newOrder);
      }
      await promisify(tx.done);
    }
  }

  async getBreadOrdersForDate(date: string): Promise<BreadOrderWithClient[]> {
    const [orders, clients] = await Promise.all([
        this.where<BreadOrder>('commandes_pain', 'date', date),
        this.getAll<BreadClient>('clients_pain')
    ]);
    const clientsMap = new Map(clients.map(c => [c.id, c]));
    const result: BreadOrderWithClient[] = orders.map(order => ({...order, client: clientsMap.get(order.client_pain_id)! })).filter(order => order.client);
    return result.sort((a, b) => a.client.nom.localeCompare(b.client.nom));
  }
  
  async convertBreadOrdersToSales(orderIds: number[], breadPrice: number): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(['products', 'sales', 'inventoryLogs', 'commandes_pain', 'customers'], 'readwrite');
    const productsStore = tx.objectStore('products');
    const salesStore = tx.objectStore('sales');
    const logsStore = tx.objectStore('inventoryLogs');
    const ordersStore = tx.objectStore('commandes_pain');
    const customersStore = tx.objectStore('customers');

    const breadProducts = await promisify(productsStore.index('name').getAll('Pain'));
    const breadProduct = breadProducts[0];
    if (!breadProduct) throw new Error("Le produit 'Pain' n'a pas été trouvé.");

    for (const orderId of orderIds) {
        const order = await promisify(ordersStore.get(orderId));
        if (order && !order.vente_id) {
            const saleItem: SaleItem = { id: breadProduct.id!, name: "Pain", price: breadPrice, purchasePrice: breadProduct.purchasePrice, quantity: order.quantite };
            const total = saleItem.price * saleItem.quantity;
            const client = await this.getById<BreadClient>('clients_pain', order.client_pain_id);
            
            const salesCount = await promisify(salesStore.count());
            const invoiceNumber = `INV-${new Date().getFullYear()}-${(salesCount + 1).toString().padStart(5, '0')}`;
            
            const saleData = { items: [saleItem], subtotal: total, total, amountPaid: 0, payments: [], clientPainId: order.client_pain_id, customerName: client?.nom, invoiceNumber, remainingBalance: total, paymentStatus: 'unpaid' as const, createdAt: new Date(), updatedAt: new Date()};
            const saleId = await promisify(salesStore.add(saleData));
            
            await promisify(ordersStore.put({ ...order, vente_id: saleId, est_paye: true }));
            sheetsService.addToQueue('commandes_pain', 'upsert', { ...order, vente_id: saleId, est_paye: true });

            if (client?.nom) {
                const allCustomers = await promisify(customersStore.getAll());
                const mainCustomer = allCustomers.find((c: Customer) => (c.firstName + ' ' + c.lastName).toLowerCase() === client.nom.toLowerCase());
                if (mainCustomer && mainCustomer.id) {
                   await promisify(customersStore.put({...mainCustomer, outstandingBalance: mainCustomer.outstandingBalance + total, lastActivityDate: new Date() }));
                }
            }
        }
    }
     await promisify(tx.done);
  }
  
  async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
    return (await this.where<Sale>('sales', 'invoiceNumber', invoiceNumber))[0];
  }

  async addSale(saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'remainingBalance' | 'paymentStatus'> & { amountPaid: number }): Promise<Sale> {
      const db = await openDB();
      const tx = db.transaction(['sales', 'products', 'inventoryLogs', 'customers'], 'readwrite');
      const salesStore = tx.objectStore('sales');
      const productsStore = tx.objectStore('products');
      const logsStore = tx.objectStore('inventoryLogs');
      const customersStore = tx.objectStore('customers');
      
      const salesCount = await promisify(salesStore.count());
      const invoiceNumber = `INV-${new Date().getFullYear()}-${(salesCount + 1).toString().padStart(5, '0')}`;
      const remainingBalance = saleData.total - saleData.amountPaid;
      const paymentStatus = remainingBalance <= 0 ? 'paid' : (saleData.amountPaid > 0 ? 'partial' : 'unpaid');
      const newSaleData: Omit<Sale, 'id'> = { ...saleData, invoiceNumber, remainingBalance, paymentStatus, createdAt: new Date(), updatedAt: new Date() };

      const saleId = await promisify(salesStore.add(newSaleData));
      
      for(const item of newSaleData.items) {
          if (typeof item.id === 'number') {
              const product = await promisify(productsStore.get(item.id));
              if (product) {
                  const newQuantity = product.quantity - item.quantity;
                  await promisify(productsStore.put({ ...product, quantity: newQuantity }));
                  await promisify(logsStore.add({ productId: item.id, change: -item.quantity, newQuantity, reason: 'sale', relatedId: saleId, createdAt: new Date() }));
              }
          }
      }
      
      if (newSaleData.customerId) {
          const customer = await promisify(customersStore.get(newSaleData.customerId));
          if (customer) {
              await promisify(customersStore.put({ ...customer, outstandingBalance: customer.outstandingBalance + newSaleData.remainingBalance, totalSpent: customer.totalSpent + newSaleData.total, lastActivityDate: new Date() }));
          }
      }
      await promisify(tx.done);
      const finalSale = { ...newSaleData, id: saleId as number};
      sheetsService.addToQueue('sales', 'upsert', finalSale);
      return finalSale;
  }
  
    async deleteSale(saleId: number): Promise<void> {
        const db = await openDB();
        const tx = db.transaction(['sales', 'products', 'inventoryLogs', 'customers'], 'readwrite');
        const salesStore = tx.objectStore('sales');
        const productsStore = tx.objectStore('products');
        const logsStore = tx.objectStore('inventoryLogs');
        const customersStore = tx.objectStore('customers');

        const sale = await promisify(salesStore.get(saleId));
        if (!sale) return;

        for (const item of sale.items) {
             if (typeof item.id === 'number') {
                const product = await promisify(productsStore.get(item.id));
                if (product) {
                    const newQuantity = product.quantity + item.quantity;
                    await promisify(productsStore.put({ ...product, quantity: newQuantity }));
                    await promisify(logsStore.add({ productId: item.id, change: item.quantity, newQuantity, reason: 'cancellation', relatedId: sale.id, createdAt: new Date() }));
                }
            }
        }
        
        if (sale.customerId) {
            const customer = await promisify(customersStore.get(sale.customerId));
            if (customer) {
                await promisify(customersStore.put({ ...customer, outstandingBalance: customer.outstandingBalance - sale.remainingBalance, totalSpent: customer.totalSpent - sale.total }));
            }
        }

        await promisify(salesStore.delete(saleId));
        await promisify(tx.done);
        sheetsService.addToQueue('sales', 'delete', { id: saleId });
    }
  
    async addPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
        const newPayment = await this.add<Payment>('payments', paymentData);
        const customer = await this.getById<Customer>('customers', newPayment!.customerId);
        if(customer) {
            await this.update('customers', newPayment!.customerId, { outstandingBalance: customer.outstandingBalance - newPayment!.amount, lastActivityDate: new Date() });
        }
        sheetsService.addToQueue('payments', 'upsert', newPayment);
        return newPayment;
    }
    
    async getSales({ from, to, query }: { from?: Date, to?: Date, query?: string }): Promise<Sale[]> {
        let sales = (await this.getAll<Sale>('sales')).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
        if (from && to) sales = sales.filter(s => { if(!s.createdAt) return false; const saleDate = new Date(s.createdAt); return saleDate >= from && saleDate <= to; });
        if (query) {
            const lowerQuery = query.toLowerCase();
            sales = sales.filter(s => s.invoiceNumber.toLowerCase().includes(lowerQuery) || s.customerName?.toLowerCase().includes(lowerQuery));
        }
        return sales;
    }
    
    async getDrafts(): Promise<Draft[]> {
        const drafts = await this.getAll<Draft>('drafts');
        return drafts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    async saveDraft(cart: Cart, notes?: string): Promise<Draft> {
        const { total } = calculateCartTotals(cart);
        const draftData: Omit<Draft, 'id'> = { date: new Date(), customerId: cart.customerId, customerName: cart.customerName, items: cart.items, total, discount: cart.discount, notes };
        const newDraft = await this.add<Draft>('drafts', draftData);
        sheetsService.addToQueue('drafts', 'upsert', newDraft);
        return newDraft;
    }
    
    async deleteDraft(id: number): Promise<void> {
        await this.delete('drafts', id);
        sheetsService.addToQueue('drafts', 'delete', { id });
    }
    
    async addStockIntake(intakeData: { supplierName: string; invoiceNumber: string; invoiceDate: Date }, items: StockIntakeItem[]): Promise<StockIntake> {
        const db = await openDB();
        const tx = db.transaction(['suppliers', 'products', 'inventoryLogs', 'stockIntakes'], 'readwrite');
        const suppliersStore = tx.objectStore('suppliers');
        const productsStore = tx.objectStore('products');
        const logsStore = tx.objectStore('logs');
        const intakesStore = tx.objectStore('stockIntakes');
        
        let supplier = (await this.where<Supplier>('suppliers', 'name', intakeData.supplierName))[0];
        if(!supplier) supplier = await this.add<Supplier>('suppliers', { name: intakeData.supplierName, balance: 0 });
        
        const intakeItems = [];
        for (const item of items) {
            if(item.isNew) {
                const newProduct = await this.addProduct({ name: item.name, category: item.category, price: item.price, purchasePrice: item.purchasePrice, quantity: item.quantity - item.quantityDamaged, minStockLevel: 10, barcodes: item.barcodes, unite: 'Pièce', fournisseurId: supplier.id });
                item.productId = newProduct.id as number;
            } else {
                const product = await this.getById<Product>('products', item.productId!);
                if (product) {
                    const newQuantity = product.quantity + item.quantity - item.quantityDamaged;
                    await this.updateProduct(item.productId!, { quantity: newQuantity, purchasePrice: item.purchasePrice, dateMajPrix: new Date(), fournisseurId: supplier.id });
                     await this.add<InventoryLog>('inventoryLogs', { productId: item.productId!, change: item.quantity - item.quantityDamaged, newQuantity, reason: 'stock_intake' });
                }
            }
            intakeItems.push({ productId: item.productId, productName: item.name, quantityReceived: item.quantity, quantityDamaged: item.quantityDamaged, purchasePrice: item.purchasePrice });
        }
        
        const totalValue = intakeItems.reduce((acc, item) => acc + (item.purchasePrice * item.quantityReceived), 0);
        const newIntakeData: Omit<StockIntake, 'id'> = { ...intakeData, supplierId: supplier.id!, supplierName: intakeData.supplierName, items: intakeItems, totalValue };
        const newIntake = await this.add<StockIntake>('stockIntakes', newIntakeData);
        sheetsService.addToQueue('stockIntakes', 'upsert', newIntake);
        return newIntake;
    }
    
    async getStockIntakes({ from, to, query }: { from?: Date, to?: Date, query?: string }): Promise<StockIntake[]> {
        let intakes = (await this.getAll<StockIntake>('stockIntakes')).sort((a,b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
        if (from && to) intakes = intakes.filter(i => { if(!i.invoiceDate) return false; const intakeDate = new Date(i.invoiceDate); return intakeDate >= from && intakeDate <= to; });
        if(query) {
            const lowerQuery = query.toLowerCase();
            intakes = intakes.filter(i => i.supplierName.toLowerCase().includes(lowerQuery) || i.invoiceNumber.toLowerCase().includes(lowerQuery));
        }
        return intakes;
    }
    
    async addReturn(returnData: Omit<ProductReturn, 'id'>): Promise<ProductReturn> {
        const newReturn = await this.add<ProductReturn>('returns', returnData);
        for (const item of newReturn.items) {
            if(item.productId && item.wasRestocked) {
                const product = await this.getById<Product>('products', item.productId);
                if(product) {
                    const newQuantity = product.quantity + item.quantity;
                    await this.updateProduct(item.productId, { quantity: newQuantity });
                    await this.add<InventoryLog>('inventoryLogs', { productId: item.productId, change: item.quantity, newQuantity, reason: 'return', relatedId: newReturn.id });
                }
            }
        }
        if (newReturn.customerId) {
            const customer = await this.getById<Customer>('customers', newReturn.customerId);
            if (customer) {
                const balanceChange = newReturn.totalReturnValue - newReturn.amountRefunded;
                await this.updateCustomer(newReturn.customerId, { outstandingBalance: customer.outstandingBalance - balanceChange, lastActivityDate: new Date() });
            }
        }
        sheetsService.addToQueue('returns', 'upsert', newReturn);
        return newReturn;
    }
    
    async deleteReturn(returnId: number): Promise<void> {
        const pr = await this.getById<ProductReturn>('returns', returnId);
        if (!pr) return;

        for (const item of pr.items) {
            if (item.productId && item.wasRestocked) {
                const product = await this.getById<Product>('products', item.productId);
                if (product) await this.update('products', item.productId, { quantity: product.quantity - item.quantity });
            }
        }
        if (pr.customerId) {
            const customer = await this.getById<Customer>('customers', pr.customerId);
            if (customer) {
                const balanceChange = pr.totalReturnValue - pr.amountRefunded;
                await this.update('customers', pr.customerId, { outstandingBalance: customer.outstandingBalance + balanceChange });
            }
        }
        await this.delete('returns', returnId);
        sheetsService.addToQueue('returns', 'delete', { id: returnId });
    }
    
    async getReturns({ from, to, query }: { from?: Date, to?: Date, query?: string }): Promise<ProductReturn[]> {
         let returns = (await this.getAll<ProductReturn>('returns')).sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
        if (from && to) returns = returns.filter(r => { if (!r.createdAt) return false; const returnDate = new Date(r.createdAt); return returnDate >= from && returnDate <= to; });
        if (query) {
            const lowerQuery = query.toLowerCase();
            returns = returns.filter(r => r.originalInvoiceNumber.toLowerCase().includes(lowerQuery) || r.customerName?.toLowerCase().includes(lowerQuery));
        }
        return returns;
    }
    
    async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
        const newExpense = await this.add<Expense>('expenses', expense);
        sheetsService.addToQueue('expenses', 'upsert', newExpense);
        return newExpense;
    }
    
    async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id'>>): Promise<Expense | undefined> {
        const updatedExpense = await this.update<Expense>('expenses', id, expenseData);
        if (updatedExpense) sheetsService.addToQueue('expenses', 'upsert', updatedExpense);
        return updatedExpense;
    }
    
    async deleteExpense(id: number): Promise<void> {
        await this.delete('expenses', id);
        sheetsService.addToQueue('expenses', 'delete', { id });
    }
    
    async getExpenseCategories(): Promise<string[]> {
        const expenses = await this.getAll<Expense>('expenses');
        return Array.from(new Set(expenses.map(e => e.category)));
    }
    
    async getExpenses({ from, to, category }: { from?: Date, to?: Date, category?: string }): Promise<Expense[]> {
        let expenses = (await this.getAll<Expense>('expenses')).sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
        if (from && to) expenses = expenses.filter(e => { const expenseDate = new Date(e.expenseDate); return expenseDate >= from && expenseDate <= to; });
        if (category) expenses = expenses.filter(e => e.category === category);
        return expenses;
    }
    
    async applyNewPurchasePrices(costingItems: CostingItem[]): Promise<void> {
        const db = await openDB();
        const tx = db.transaction('products', 'readwrite');
        const store = tx.objectStore('products');
        for (const item of costingItems) {
            if(item.productId) {
                const product = await promisify(store.get(item.productId as number));
                if (product) {
                    await promisify(store.put({ ...product, purchasePrice: item.finalCostPerUnit, dateMajPrix: new Date() }));
                }
            }
        }
        await promisify(tx.done);
    }
    
    async exportData(): Promise<string> {
        const data: Partial<DB> = {};
        for (const tableName of Object.values(TABLES)) {
            data[tableName as keyof DB] = await this.getAll<any>(tableName);
        }
        return JSON.stringify(data, null, 2);
    }
    
    async restoreTables(backupData: Partial<DB>, tablesToRestore: string[], onProgress: (progress: any) => void): Promise<void> {
        const total = tablesToRestore.length;
        let current = 0;
        const done: { table: string; success: boolean; error?: string }[] = [];
        for (const tableName of tablesToRestore) {
            current++;
            try {
                if (backupData[tableName as keyof typeof backupData]) {
                    const records = backupData[tableName as keyof typeof backupData] as any[];
                    const store = await this.getStore(tableName as TableName, 'readwrite');
                    await promisify(store.clear());
                    for (const record of records) {
                        await promisify(store.put(record));
                    }
                    done.push({ table: tableName, success: true });
                    onProgress({ current, total, currentTable: tableName, done });
                }
            } catch (e: any) {
                done.push({ table: tableName, success: false, error: e.message });
                onProgress({ current, total, currentTable: tableName, done });
            }
        }
    }
    
    async resetDatabase(): Promise<void> {
        const db = await openDB();
        db.close();
        await promisify(indexedDB.deleteDatabase(DB_NAME));
    }
}

export const dataService = new DataService();
