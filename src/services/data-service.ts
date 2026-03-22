'use client';

import { getDb } from '@/lib/database';
import type { TableName, Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, InventoryLog, StockIntakeItem, ZakatData, CostingItem, Draft, Supplier, ImportAnalysis, BreadClient, BreadOrder, BreadOrderWithClient, DB, ProductImportAnalysis, GlobalActivityItem, DashboardData, TopCustomer } from '@/lib/types';
import { subDays, endOfDay, startOfDay, parseISO } from 'date-fns';
import Papa from 'papaparse';
import { calculateCartTotals, formatCurrency, safeToDate } from '@/lib/utils';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { sheetsService } from './googleSheets';

class DataService {
  get db() {
    return getDb();
  }

  // Generic methods
  async getAll<T>(table: TableName): Promise<T[]> {
    return this.db.table<T>(table).toArray();
  }

  async getById<T>(table: TableName, id: any): Promise<T | undefined> {
    return this.db.table<T>(table).get(id);
  }
  
  // Settings
  async getSetting(id: string): Promise<Setting | undefined> {
    return this.getById<Setting>('settings', id);
  }

  async setSetting(id: string, value: any): Promise<string> {
    sheetsService.addToQueue('settings', 'upsert', { id, value });
    return this.db.settings.put({ id, value });
  }

  // Company Profile
  async getCompanyProfile(): Promise<CompanyProfile | null> {
    return (await this.getById<CompanyProfile>('companyProfile', 1)) || null;
  }
  
  async updateCompanyProfile(profileData: Partial<Omit<CompanyProfile, 'id'>>): Promise<number> {
    const profile = await this.getCompanyProfile() ?? { id: 1 };
    const updatedProfile = { ...profile, ...profileData, id: 1, updatedAt: new Date() };
    sheetsService.addToQueue('companyProfile', 'upsert', updatedProfile);
    return this.db.companyProfile.put(updatedProfile);
  }
  
  // Cart
  async getCart(id: string): Promise<Cart | undefined> {
    return this.getById<Cart>('carts', id);
  }

  async saveCart(cart: Cart): Promise<string> {
    return this.db.carts.put(cart);
  }

  async deleteCart(id: string): Promise<void> {
    return this.db.carts.delete(id);
  }

  async addProductToCart(cartId: string, product: Product, quantity: number): Promise<void> {
    await this.db.transaction('rw', this.db.carts, this.db.products, async () => {
        const cart = await this.db.carts.get(cartId);
        if (!cart) throw new Error("Panier non trouvé.");

        const existingItem = cart.items.find(item => item.id === product.id);
        const newCartQuantity = (existingItem?.cartQuantity || 0) + quantity;

        if (typeof product.id === 'number') {
            const dbProduct = await this.db.products.get(product.id);
            if (!dbProduct) {
                throw new Error(`Produit "${product.name}" non trouvé.`);
            }
            if (dbProduct.quantity < newCartQuantity) {
                throw new Error(`Stock insuffisant pour ${product.name}. Demandé: ${newCartQuantity}, Disponible: ${dbProduct.quantity}.`);
            }
        }

        // If we're here, stock is sufficient.
        if (existingItem) {
            existingItem.cartQuantity = newCartQuantity;
            existingItem.flash = true;
        } else {
            cart.items.push({ ...product, cartQuantity: newCartQuantity, flash: true });
        }
        await this.db.carts.put(cart);
    });
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
    return this.db.carts.where({id: cartId}).modify(cart => {
        cart.items = cart.items.filter(item => item.id !== itemId);
    });
  }
  
  async clearCart(cartId: string): Promise<void> {
     return this.db.carts.where({id: cartId}).modify(cart => {
        cart.items = [];
        cart.customerId = null;
        cart.customerName = '';
        cart.discount = { type: 'fixed', value: 0 };
    });
  }

  async setCartCustomer(cartId: string, customer: Customer | null): Promise<void> {
    return this.db.carts.where({id: cartId}).modify(cart => {
        cart.customerId = customer ? customer.id! : null;
        cart.customerName = customer ? `${''\''.concat(customer.firstName, ' ', customer.lastName)}` : '';
    });
  }

  async setCartDiscount(cartId: string, discount: { type: 'fixed' | 'percentage'; value: number }): Promise<void> {
      return this.db.carts.where({id: cartId}).modify(cart => {
        let value = Math.max(0, discount.value || 0);
        const subtotal = cart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);

        if (discount.type === 'fixed' && value > subtotal) {
            value = subtotal;
        }
        if (discount.type === 'percentage' && (value < 0 || value > 100)) {
            value = Math.max(0, Math.min(100, value));
        }
        cart.discount = { type: discount.type, value };
      });
  }

  async removeFlashFromCartItems(cartId: string): Promise<void> {
    return this.db.carts.where({id: cartId}).modify(cart => {
        cart.items.forEach(i => { if(i.flash) i.flash = false });
    });
  }

  // Product
  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return this.db.products.where('barcodes').equals(barcode).first();
  }

  async addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    return this.db.transaction('rw', this.db.products, this.db.inventoryLogs, async () => {
      const newProductId = await this.db.products.add(productData);
      await this.db.inventoryLogs.add({
            productId: newProductId,
            change: productData.quantity,
            newQuantity: productData.quantity,
            reason: 'stock_intake',
            relatedId: `init-${newProductId}`,
            createdAt: new Date(),
      });
      const newProduct = { ...productData, id: newProductId };
      sheetsService.addToQueue('products', 'upsert', newProduct);
      return newProduct;
    });
  }

  async updateProduct(id: number, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
    return this.db.transaction('rw', this.db.products, this.db.inventoryLogs, async () => {
        const oldProduct = await this.db.products.get(id);
        if (oldProduct && productData.quantity !== undefined && oldProduct.quantity !== productData.quantity) {
            await this.db.inventoryLogs.add({
              productId: id,
              change: (productData.quantity || 0) - oldProduct.quantity,
              newQuantity: productData.quantity!,
              reason: 'manual_adjustment',
              createdAt: new Date(),
            });
        }
        await this.db.products.update(id, productData);
        const updatedProduct = await this.db.products.get(id);
        if(updatedProduct) sheetsService.addToQueue('products', 'upsert', updatedProduct);
    });
  }

  async deleteProduct(id: number): Promise<void> {
    return this.db.transaction('rw', this.db.products, this.db.inventoryLogs, async () => {
        await this.db.inventoryLogs.where({productId: id}).delete();
        await this.db.products.delete(id);
        sheetsService.addToQueue('products', 'delete', { id });
    });
  }

  async deleteProducts(ids: number[]): Promise<void> {
    return this.db.transaction('rw', this.db.products, this.db.inventoryLogs, async () => {
        await this.db.inventoryLogs.where('productId').anyOf(ids).delete();
        await this.db.products.bulkDelete(ids);
        ids.forEach(id => sheetsService.addToQueue('products', 'delete', { id }));
    });
  }

  async getProducts(params: { query?: string; category?: string; supplierId?: number; stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock', sortBy?: string }): Promise<Product[]> {
    const { query, category, supplierId, stockStatus = 'all', sortBy = 'createdAt_desc' } = params;
    
    let collection = this.db.products.toCollection();

    if (category) {
        collection = collection.filter(p => p.category === category);
    }
    if (stockStatus !== 'all') {
        collection = collection.filter(p => {
            switch (stockStatus) {
                case 'in_stock': return p.quantity > p.minStockLevel;
                case 'low_stock': return p.quantity > 0 && p.quantity <= p.minStockLevel;
                case 'out_of_stock': return p.quantity <= 0;
                default: return true;
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
    
    const [sortField] = sortBy.split('_');
    
    // Dexie doesn't support dynamic sort direction easily, so we sort in memory
    const products = await collection.toArray();
    
    products.sort((a, b) => {
        const aVal = (a as any)[sortField];
        const bVal = (b as any)[sortField];
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else if (aVal && !bVal) {
            return -1;
        } else if (!aVal && bVal) {
            return 1;
        }
        return sortBy.endsWith('desc') ? comparison * -1 : comparison;
    });

    return products;
  }

  async getProductsByIds(ids: number[]): Promise<Product[]> {
    return this.db.products.where('id').anyOf(ids).toArray();
  }

  async getProductCategories(): Promise<string[]> {
    const products = await this.getAll<Product>('products');
    const categories = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(categories).sort();
  }
  
  async getSuppliers(): Promise<Supplier[]> {
      return this.db.suppliers.orderBy('name').toArray();
  }

  // Customer
  async getCustomerById(id: number): Promise<Customer | undefined> {
      return this.getById<Customer>('customers', id);
  }

  async getCustomerActivity(customerId: number): Promise<(Sale | Payment | ProductReturn)[]> {
    if (!customerId) return [];
    const [sales, payments, returns] = await Promise.all([
        this.db.sales.where({ customerId }).toArray(),
        this.db.payments.where({ customerId }).toArray(),
        this.db.returns.where({ customerId }).toArray(),
    ]);

    const activity: ({ type: string, date: Date } & (Sale | Payment | ProductReturn))[] = [
        ...sales.map(s => ({ ...s, type: 'sale', date: safeToDate(s.createdAt!) })),
        ...returns.map(r => ({ ...r, type: 'return', date: safeToDate(r.createdAt!) })),
        ...payments.map(p => ({ ...p, type: 'payment', date: safeToDate(p.paymentDate!) })),
    ];

    return activity.filter(item => item.date && !isNaN(item.date.getTime()))
                   .sort((a, b) => b.date.getTime() - a.date.getTime());
}

  async getCustomerStatementData(customerId: number): Promise<{ customer: Customer, unpaidSales: Sale[]}> {
      const customer = await this.getCustomerById(customerId);
      if (!customer) throw new Error("Client non trouvé");
      const unpaidSales = await this.db.sales.where('customerId').equals(customerId).and(sale => sale.paymentStatus !== 'paid').sortBy('createdAt');
      return { customer, unpaidSales };
  }

  async getCustomers(params: { query?: string; status?: 'all' | 'has_debt' | 'overdue' | 'over_limit', sortBy?: string, limit?: number }): Promise<Customer[]> {
    const { query, status = 'all', sortBy = 'lastName_asc', limit } = params;
    
    let collection = this.db.customers.toCollection();

    if (query) {
        const lowerQuery = query.toLowerCase();
        collection = collection.filter(c => (c.searchName || '').toLowerCase().includes(lowerQuery) || c.phone?.includes(lowerQuery));
    }
    
    let customers = await collection.sortBy(sortBy.split('_')[0]);
    
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

    if(sortBy.endsWith('_desc')) {
      filteredCustomers.reverse();
    }
    return limit ? filteredCustomers.slice(0, limit) : filteredCustomers;
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<Customer> {
      const data = { 
        ...customer, 
        totalSpent: 0, 
        outstandingBalance: 0,
      };
      const id = await this.db.customers.add(data);
      const newCustomer = {...data, id };
      sheetsService.addToQueue('customers', 'upsert', newCustomer);
      return newCustomer;
  }

  async updateCustomer(id: number, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> {
      await this.db.customers.update(id, customerData);
      const updatedCustomer = await this.db.customers.get(id);
      if(updatedCustomer) sheetsService.addToQueue('customers', 'upsert', updatedCustomer);
  }

  async deleteCustomer(id: number): Promise<void> {
    const customer = await this.getById<Customer>('customers', id);
    if (!customer) return;
    if (customer.outstandingBalance > 0) {
        throw new Error(`Suppression impossible : ce client a un solde impayé de ${formatCurrency(customer.outstandingBalance)}`);
    }
    const salesCount = await this.db.sales.where({customerId: id}).count();
    if (salesCount > 0) {
        throw new Error("Suppression impossible : ce client a un historique de transactions. Envisagez de le désactiver à la place.");
    }
    await this.db.customers.delete(id);
    sheetsService.addToQueue('customers', 'delete', { id });
  }

  // Import/Export
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
    
    // Zakat
    async getZakatData(): Promise<ZakatData> {
        const products = await this.getAll<Product>('products');
        const customers = await this.getAll<Customer>('customers');
        const inventoryValue = products.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
        const totalReceivables = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
        return { inventoryValue, totalReceivables };
    }
  
    // Bread
    async getBreadClients(): Promise<BreadClient[]> {
        return this.db.clients_pain.orderBy('nom').toArray();
    }

    async addBreadClient(client: Omit<BreadClient, 'id'>): Promise<BreadClient> {
        const id = await this.db.clients_pain.add(client);
        const newClient = {...client, id};
        sheetsService.addToQueue('clients_pain', 'upsert', newClient);
        return newClient;
    }

    async updateBreadClient(id: number, data: Partial<BreadClient>): Promise<void> {
        await this.db.clients_pain.update(id, data);
        const updatedClient = await this.db.clients_pain.get(id);
        if(updatedClient) sheetsService.addToQueue('clients_pain', 'upsert', updatedClient);
    }

    async deleteBreadClient(id: number): Promise<void> {
        await this.db.transaction('rw', this.db.commandes_pain, this.db.clients_pain, async () => {
            await this.db.commandes_pain.where({ client_pain_id: id }).delete();
            await this.db.clients_pain.delete(id);
            sheetsService.addToQueue('clients_pain', 'delete', { id });
        });
    }

    async getManualBreadClients(): Promise<BreadClient[]> {
        return this.db.clients_pain.where('type_recurrence').equals('aucun').and(c => c.actif === true).toArray();
    }

    async addManualBreadOrder(clientId: number, date: string, quantity: number): Promise<BreadOrder> {
        const existing = await this.db.commandes_pain.where({ client_pain_id: clientId, date }).first();
        if(existing) throw new Error("Une commande pour ce client existe déjà à cette date.");
        
        const orderData: Omit<BreadOrder, 'id'> = { client_pain_id: clientId, date, quantite: quantity, est_paye: false, est_livre: false, vente_id: null };
        const id = await this.db.commandes_pain.add(orderData);
        const newOrder = {...orderData, id};
        sheetsService.addToQueue('commandes_pain', 'upsert', newOrder);
        return newOrder;
    }
  
    async updateBreadOrderQuantity(orderId: number, newQuantity: number): Promise<void> {
        const order = await this.db.commandes_pain.get(orderId);
        if (!order) return;
        const quantite_origine = order.quantite_origine === undefined ? order.quantite : order.quantite_origine;
        await this.db.commandes_pain.update(orderId, { quantite: newQuantity, quantite_origine });
        sheetsService.addToQueue('commandes_pain', 'upsert', {id: orderId, quantite: newQuantity, quantite_origine });
    }

    async updateBreadOrderDeliveryStatus(orderId: number, delivered: boolean): Promise<void> {
        await this.db.commandes_pain.update(orderId, { est_livre: delivered });
        sheetsService.addToQueue('commandes_pain', 'upsert', {id: orderId, est_livre: delivered });
    }
  
    async checkIfBreadOrdersExist(date: string): Promise<boolean> {
        const count = await this.db.commandes_pain.where({date}).count();
        return count > 0;
    }

    async createDayOrders(date: string): Promise<void> {
        const dayOfWeek = BREAD_WEEK_DAYS[new Date(date.replace(/-/g, '/')).getUTCDay()];
        const activeClients = await this.db.clients_pain.where('actif').equals(true).toArray();
        const existingOrders = await this.db.commandes_pain.where({date}).toArray();
        const existingClientIds = new Set(existingOrders.map(o => o.client_pain_id));

        const ordersToCreate: Omit<BreadOrder, 'id'>[] = [];
        for (const client of activeClients) {
          if (existingClientIds.has(client.id!)) continue;
          
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
            await this.db.commandes_pain.bulkAdd(ordersToCreate);
            ordersToCreate.forEach(o => sheetsService.addToQueue('commandes_pain', 'upsert', o));
        }
    }

    async getBreadOrdersForDate(date: string): Promise<BreadOrderWithClient[]> {
        const [orders, clients] = await Promise.all([
            this.db.commandes_pain.where({date}).toArray(),
            this.getAll<BreadClient>('clients_pain')
        ]);
        const clientsMap = new Map(clients.map(c => [c.id, c]));
        return orders
            .map(order => ({...order, client: clientsMap.get(order.client_pain_id)! }))
            .filter(order => order.client)
            .sort((a, b) => a.client.nom.localeCompare(b.client.nom));
    }
  
    async convertBreadOrdersToSales(orderIds: number[], breadPrice: number): Promise<void> {
        return this.db.transaction('rw', this.db.products, this.db.sales, this.db.inventoryLogs, this.db.commandes_pain, this.db.customers, async () => {
            const breadProduct = await this.db.products.where('name').equals('Pain').first();
            if (!breadProduct?.id || typeof breadProduct.id !== 'number') throw new Error("Le produit 'Pain' n'a pas été trouvé.");
            
            for (const orderId of orderIds) {
                const order = await this.db.commandes_pain.get(orderId);
                if (order && !order.vente_id) {
                    const client = await this.getById<BreadClient>('clients_pain', order.client_pain_id);
                    const salesCount = await this.db.sales.count();
                    const invoiceNumber = `INV-${new Date().getFullYear()}-${(salesCount + 1).toString().padStart(5, '0')}`;
                    
                    const saleTotal = breadPrice * order.quantite;
                    const saleData: Omit<Sale, 'id'> = { 
                        items: [{ id: breadProduct.id!, name: "Pain", price: breadPrice, purchasePrice: breadProduct.purchasePrice, quantity: order.quantite }], 
                        subtotal: saleTotal, total: saleTotal, amountPaid: 0, payments: [], clientPainId: order.client_pain_id, 
                        customerName: client?.nom, invoiceNumber, remainingBalance: saleTotal, 
                        paymentStatus: 'unpaid' as const, createdAt: new Date(), updatedAt: new Date()
                    };
                    const saleId = await this.db.sales.add(saleData);
                    
                    await this.db.commandes_pain.update(orderId, { vente_id: saleId, est_paye: true });
                    sheetsService.addToQueue('commandes_pain', 'upsert', { id: orderId, vente_id: saleId, est_paye: true });

                    const newProductQuantity = breadProduct.quantity - order.quantite;
                    await this.db.products.update(breadProduct.id, { quantity: newProductQuantity });
                    await this.db.inventoryLogs.add({ productId: breadProduct.id, change: -order.quantite, newQuantity: newProductQuantity, reason: 'sale', relatedId: saleId, createdAt: new Date() });

                    if (client?.nom) {
                        const mainCustomer = await this.db.customers.where('searchName').equals(client.nom.toLowerCase()).first();
                        if (mainCustomer?.id) {
                           await this.db.customers.update(mainCustomer.id, { outstandingBalance: mainCustomer.outstandingBalance + saleData.total, lastActivityDate: new Date() });
                        }
                    }
                }
            }
        });
    }
  
    // Sales
    async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        return this.db.sales.where({invoiceNumber}).first();
    }
    
    async getSales(params: { query?: string; from?: Date, to?: Date }): Promise<Sale[]> {
        let collection = this.db.sales.orderBy('createdAt').reverse();
        
        if (params.from && params.to) {
            collection = this.db.sales.where('createdAt').between(params.from, params.to, true, true).reverse();
        }
        
        if (params.query) {
            const lowerQuery = params.query.toLowerCase();
            return collection.filter(s =>
                s.invoiceNumber.toLowerCase().includes(lowerQuery) ||
                (s.customerName || '').toLowerCase().includes(lowerQuery)
            ).toArray();
        }

        return collection.toArray();
    }


    async addSale(saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'remainingBalance' | 'paymentStatus'> & { amountPaid: number }): Promise<Sale> {
        return this.db.transaction('rw', this.db.sales, this.db.products, this.db.inventoryLogs, this.db.customers, async () => {
            
            // 1. Pre-sale validation
            for (const item of saleData.items) {
                if (typeof item.id === 'number') {
                    const product = await this.db.products.get(item.id);
                    if (!product) {
                        throw new Error(`Produit "${item.name}" non trouvé dans l'inventaire.`);
                    }
                    if (product.quantity < item.quantity) {
                        throw new Error(`Stock insuffisant pour "${item.name}". Demandé: ${item.quantity}, Disponible: ${product.quantity}.`);
                    }
                }
            }

            // 2. Create Sale Record
            const salesCount = await this.db.sales.count();
            const invoiceNumber = `INV-${new Date().getFullYear()}-${(salesCount + 1).toString().padStart(5, '0')}`;
            const remainingBalance = saleData.total - saleData.amountPaid;
            const paymentStatus = remainingBalance <= 0 ? 'paid' : (saleData.amountPaid > 0 ? 'partial' : 'unpaid');
            const newSaleData: Omit<Sale, 'id'> = { ...saleData, invoiceNumber, remainingBalance, paymentStatus, createdAt: new Date(), updatedAt: new Date() };

            const saleId = await this.db.sales.add(newSaleData);
            
            // 3. Update Inventory
            for(const item of newSaleData.items) {
                if (typeof item.id === 'number') {
                    // We already fetched the product, but we do it again inside the transaction for safety
                    const product = await this.db.products.get(item.id); 
                    if (product) { // Should always be true because of pre-validation
                        const newQuantity = product.quantity - item.quantity;
                        await this.db.products.update(item.id, { quantity: newQuantity });
                        await this.db.inventoryLogs.add({ 
                            productId: item.id, 
                            change: -item.quantity, 
                            newQuantity, 
                            reason: 'sale', 
                            relatedId: saleId, 
                            createdAt: new Date() 
                        });
                    }
                }
            }
            
            // 4. Update Customer Balance
            if (newSaleData.customerId) {
                const customer = await this.db.customers.get(newSaleData.customerId);
                if (customer?.id) {
                    await this.db.customers.update(customer.id, { 
                        outstandingBalance: customer.outstandingBalance + newSaleData.remainingBalance, 
                        totalSpent: customer.totalSpent + newSaleData.total, 
                        lastActivityDate: new Date() 
                    });
                }
            }
            
            const finalSale = { ...newSaleData, id: saleId };
            sheetsService.addToQueue('sales', 'upsert', finalSale);
            return finalSale;
        });
    }
  
    async deleteSale(saleId: number): Promise<void> {
        return this.db.transaction('rw', this.db.sales, this.db.products, this.db.inventoryLogs, this.db.customers, async () => {
            const sale = await this.db.sales.get(saleId);
            if (!sale) return;

            for (const item of sale.items) {
                if (typeof item.id === 'number') {
                    await this.db.products.where({id: item.id}).modify(p => p.quantity += item.quantity);
                    const updatedProduct = await this.db.products.get(item.id);
                    await this.db.inventoryLogs.add({ productId: item.id, change: item.quantity, newQuantity: updatedProduct!.quantity, reason: 'cancellation', relatedId: sale.id, createdAt: new Date() });
                }
            }
            
            if (sale.customerId) {
                await this.db.customers.where({id: sale.customerId}).modify(c => {
                    c.outstandingBalance -= sale.remainingBalance;
                    c.totalSpent -= sale.total;
                });
            }

            await this.db.sales.delete(saleId);
            sheetsService.addToQueue('sales', 'delete', { id: saleId });
        });
    }
  
    // Payments
    async addPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
        const id = await this.db.payments.add(paymentData);
        const newPayment = {...paymentData, id};
        await this.db.customers.where({id: newPayment.customerId}).modify(c => {
            c.outstandingBalance -= newPayment.amount;
            c.lastActivityDate = new Date();
        });
        sheetsService.addToQueue('payments', 'upsert', newPayment);
        return newPayment;
    }
    
    // Drafts
    async getDrafts(): Promise<Draft[]> {
        return this.db.drafts.orderBy('createdAt').reverse().toArray();
    }
    
    async saveDraft(cart: Cart, notes?: string): Promise<Draft> {
        const { total } = calculateCartTotals(cart);
        const draftData: Omit<Draft, 'id' > = { 
          date: new Date(), 
          customerId: cart.customerId, 
          customerName: cart.customerName, 
          items: cart.items, 
          total, 
          discount: cart.discount, 
          notes 
        };
        const id = await this.db.drafts.add(draftData as Draft);
        const newDraft = {...draftData, id} as Draft;
        sheetsService.addToQueue('drafts', 'upsert', newDraft);
        return newDraft;
    }
    
    async deleteDraft(id: number): Promise<void> {
        await this.db.drafts.delete(id);
        sheetsService.addToQueue('drafts', 'delete', { id });
    }
    
    async getDraftAndClear(draftId: number): Promise<Omit<Draft, 'id' | 'createdAt' | 'updatedAt'> | null> {
        const draft = await this.db.drafts.get(draftId);
        if (!draft) return null;
        await this.deleteDraft(draftId);
        const { id, createdAt, updatedAt, ...draftContent } = draft;
        return draftContent;
    }

    async loadDraftContentToCart(cartId: string, draftContent: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
        return this.db.carts.where({id: cartId}).modify(cart => {
            cart.items = draftContent.items;
            cart.customerId = draftContent.customerId;
            cart.customerName = draftContent.customerName;
            cart.discount = draftContent.discount;
        });
    }
    
    // Stock Intake
    async getStockIntakes(params: { query?: string; from?: Date, to?: Date }): Promise<StockIntake[]> {
        let collection = this.db.stockIntakes.orderBy('createdAt').reverse();

        if (params.from && params.to) {
            collection = this.db.stockIntakes.where('createdAt').between(params.from, params.to, true, true).reverse();
        }
        
        if (params.query) {
            const lowerQuery = params.query.toLowerCase();
            return collection.filter(si =>
                (si.supplierName || '').toLowerCase().includes(lowerQuery) ||
                si.invoiceNumber.toLowerCase().includes(lowerQuery)
            ).toArray();
        }

        return collection.toArray();
    }
    
    async addStockIntake(intakeData: { supplierName: string; invoiceNumber: string; invoiceDate: Date }, items: StockIntakeItem[]): Promise<StockIntake> {
        return this.db.transaction('rw', this.db.suppliers, this.db.products, this.db.inventoryLogs, this.db.stockIntakes, async () => {
            let supplier = await this.db.suppliers.where('name').equalsIgnoreCase(intakeData.supplierName).first();
            if(!supplier) {
                const newSupplierData = { name: intakeData.supplierName, balance: 0 };
                const id = await this.db.suppliers.add(newSupplierData);
                supplier = { ...newSupplierData, id, balance: 0 };
            }
            
            const intakeItems = [];
            for (const item of items) {
                if(item.isNew) {
                    const newProduct = await this.addProduct({ name: item.name, category: item.category, price: item.price, purchasePrice: item.purchasePrice, quantity: item.quantity - item.quantityDamaged, minStockLevel: 10, barcodes: item.barcodes, unite: 'Pièce', fournisseurId: supplier.id });
                    item.productId = newProduct.id as number;
                } else if(item.productId) {
                    const product = await this.db.products.get(item.productId);
                    if (product) {
                        const newQuantity = product.quantity + item.quantity - item.quantityDamaged;
                        await this.db.products.update(item.productId, { quantity: newQuantity, purchasePrice: item.purchasePrice, dateMajPrix: new Date(), fournisseurId: supplier.id });
                        await this.db.inventoryLogs.add({ productId: item.productId, change: item.quantity - item.quantityDamaged, newQuantity, reason: 'stock_intake', createdAt: new Date() });
                    }
                }
                intakeItems.push({ productId: item.productId, productName: item.name, quantityReceived: item.quantity, quantityDamaged: item.quantityDamaged, purchasePrice: item.purchasePrice });
            }
            
            const totalValue = intakeItems.reduce((acc, item) => acc + (item.purchasePrice * item.quantityReceived), 0);
            const newIntakeData: Omit<StockIntake, 'id'> = { ...intakeData, supplierId: supplier.id!, supplierName: supplier.name, items: intakeItems, totalValue, createdAt: new Date(), updatedAt: new Date() };
            const id = await this.db.stockIntakes.add(newIntakeData);
            
            const newIntake = { ...newIntakeData, id };
            sheetsService.addToQueue('stockIntakes', 'upsert', newIntake);
            return newIntake;
        });
    }
    
    // Returns
    async getReturns(params: { query?: string; from?: Date, to?: Date }): Promise<ProductReturn[]> {
        let collection = this.db.returns.orderBy('createdAt').reverse();
        
        if (params.from && params.to) {
            collection = this.db.returns.where('createdAt').between(params.from, params.to, true, true).reverse();
        }
        
        if (params.query) {
            const lowerQuery = params.query.toLowerCase();
            return collection.filter(r =>
                r.originalInvoiceNumber.toLowerCase().includes(lowerQuery) ||
                (r.customerName || '').toLowerCase().includes(lowerQuery)
            ).toArray();
        }

        return collection.toArray();
    }
    
    async addReturn(returnData: Omit<ProductReturn, 'id'>): Promise<ProductReturn> {
        return this.db.transaction('rw', this.db.returns, this.db.products, this.db.inventoryLogs, this.db.customers, async () => {
            const id = await this.db.returns.add(returnData);
            const newReturn = {...returnData, id};
            
            for (const item of newReturn.items) {
                if(item.productId && item.wasRestocked) {
                    const product = await this.db.products.get(item.productId);
                    if(product?.id) {
                        const newQuantity = product.quantity + item.quantity;
                        await this.db.products.update(product.id, { quantity: newQuantity });
                        await this.db.inventoryLogs.add({ productId: item.productId, change: item.quantity, newQuantity, reason: 'return', relatedId: newReturn.id });
                    }
                }
            }
            if (newReturn.customerId) {
                const customer = await this.db.customers.get(newReturn.customerId);
                if (customer?.id) {
                    const balanceChange = newReturn.totalReturnValue - newReturn.amountRefunded;
                    await this.updateCustomer(customer.id, { outstandingBalance: customer.outstandingBalance - balanceChange, lastActivityDate: new Date() });
                }
            }
            sheetsService.addToQueue('returns', 'upsert', newReturn);
            return newReturn;
        });
    }
    
    async deleteReturn(returnId: number): Promise<void> {
        return this.db.transaction('rw', this.db.returns, this.db.products, this.db.customers, this.db.inventoryLogs, async() => {
            const pr = await this.db.returns.get(returnId);
            if (!pr) return;

            for (const item of pr.items) {
                if (item.productId && item.wasRestocked) {
                    await this.db.products.where({id: item.productId}).modify(p => p.quantity -= item.quantity);
                    const updatedProduct = await this.db.products.get(item.productId);
                    await this.db.inventoryLogs.add({ productId: item.productId, change: -item.quantity, newQuantity: updatedProduct!.quantity, reason: 'cancellation', relatedId: `cancel-return-${returnId}`, createdAt: new Date() });
                }
            }
            if (pr.customerId) {
                await this.db.customers.where({id: pr.customerId}).modify(c => {
                    const balanceChange = pr.totalReturnValue - pr.amountRefunded;
                    c.outstandingBalance += balanceChange;
                });
            }
            
            await this.db.returns.delete(returnId);
            sheetsService.addToQueue('returns', 'delete', { id: returnId });
        });
    }
    
    // Expenses
    async getExpenses(params: { category?: string; from?: Date, to?: Date }): Promise<Expense[]> {
        let collection;
        if(params.from && params.to) {
            collection = this.db.expenses.where('expenseDate').between(params.from, params.to);
        } else {
            collection = this.db.expenses.toCollection();
        }
        
        if (params.category) {
            collection = collection.filter(e => e.category === params.category);
        }
        
        return collection.reverse().toArray();
    }
    
    async getExpenseCategories(): Promise<string[]> {
        const expenses = await this.getAll<Expense>('expenses');
        return Array.from(new Set(expenses.map(e => e.category))).sort();
    }
    
    async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
        const id = await this.db.expenses.add(expense);
        const newExpense = {...expense, id};
        sheetsService.addToQueue('expenses', 'upsert', newExpense);
        return newExpense;
    }
    
    async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id'>>): Promise<void> {
        await this.db.expenses.update(id, expenseData);
        const updatedExpense = await this.db.expenses.get(id);
        if(updatedExpense) sheetsService.addToQueue('expenses', 'upsert', updatedExpense);
    }
    
    async deleteExpense(id: number): Promise<void> {
        await this.db.expenses.delete(id);
        sheetsService.addToQueue('expenses', 'delete', { id });
    }
    
    // Costing
    async applyNewPurchasePrices(costingItems: CostingItem[]): Promise<void> {
        return this.db.transaction('rw', this.db.products, async () => {
            for (const item of costingItems) {
                if(item.productId) {
                   await this.db.products.update(item.productId as number, { purchasePrice: item.finalCostPerUnit, dateMajPrix: new Date() });
                }
            }
        });
    }
    
    // Backup & Restore
    async exportData(): Promise<string> {
        const data: Partial<DB> = {};
        for (const tableName of this.db.tables.map(t => t.name)) {
            data[tableName as keyof DB] = await this.db.table(tableName).toArray();
        }
        return JSON.stringify(data, null, 2);
    }
    
    async restoreTables(backupData: Partial<DB>, tablesToRestore: string[], onProgress: (progress: any) => void): Promise<void> {
        const total = tablesToRestore.length;
        let current = 0;
        const done: { table: string; success: boolean; error?: string }[] = [];
        
        for (const tableName of tablesToRestore) {
            current++;
            onProgress({ current, total, currentTable: tableName, done });
            try {
                if (backupData[tableName as keyof typeof backupData]) {
                    const table = this.db.table(tableName);
                    await table.clear();
                    const records = backupData[tableName as keyof typeof backupData] as any[];
                    if (records.length > 0) {
                        await table.bulkPut(records);
                    }
                    done.push({ table: tableName, success: true });
                }
            } catch (e: any) {
                done.push({ table: tableName, success: false, error: e.message });
            } finally {
                onProgress({ current, total, currentTable: tableName, done });
            }
        }
    }
    
    async resetDatabase(): Promise<void> {
        const tables = this.db.tables.map(t => t.name);
        await Promise.all(tables.map(t => this.db.table(t).clear()));
    }
    
    async getDashboardData(from: Date, to: Date): Promise<DashboardData | undefined> {
        if (!from || !to) return undefined;
        
        const sales = await this.db.sales.where('createdAt').between(from, to, true, true).toArray();
        const expenses = await this.db.expenses.where('expenseDate').between(from, to, true, true).toArray();
        const allProducts = await this.db.products.toArray();

        const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalExpensesValue = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        const salesProfit = sales.reduce((sum, s) => {
            const saleProfit = (s.items || []).reduce((itemSum, item) => 
                itemSum + ((item.price || 0) - (item.purchasePrice || 0)) * (item.quantity || 0), 0);
            return sum + saleProfit - (s.discountAmount || 0);
        }, 0);
        const totalProfit = salesProfit - totalExpensesValue;
        const inventoryValue = allProducts.reduce((sum, p) => sum + ((p.purchasePrice || 0) * (p.quantity || 0)), 0);

        const productSales: { [key: number]: { revenue: number, profit: number, units: number } } = {};
        for (const sale of sales) {
            for (const item of sale.items || []) {
                if (typeof item.id !== 'number') continue;
                if (!productSales[item.id]) productSales[item.id] = { revenue: 0, profit: 0, units: 0 };
                productSales[item.id].revenue += (item.price || 0) * (item.quantity || 0);
                productSales[item.id].profit += ((item.price || 0) - (item.purchasePrice || 0)) * (item.quantity || 0);
                productSales[item.id].units += item.quantity || 0;
            }
        }
        
        const topProducts = Object.entries(productSales).map(([id, data]) => ({
            id: Number(id),
            name: allProducts.find(p => p.id === Number(id))?.name || 'Produit Inconnu',
            totalRevenue: data.revenue,
            totalProfit: data.profit,
            unitsSold: data.units,
        })).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);

        const allCustomers = await this.db.customers.toArray();
        const customerMap = new Map(allCustomers.map(c => [c.id, c]));
        const customerSales: { [key: number]: number } = {};
        for (const sale of sales) {
            if (sale.customerId) {
                if (!customerSales[sale.customerId]) customerSales[sale.customerId] = 0;
                customerSales[sale.customerId] += sale.total;
            }
        }
        
        const topCustomers: TopCustomer[] = Object.entries(customerSales).map(([customerId, totalSpent]) => {
            const customer = customerMap.get(Number(customerId));
            return {
                id: Number(customerId),
                name: customer ? `${''\''.concat(customer.firstName, ' ', customer.lastName)}` : 'Client Inconnu',
                totalSpent,
            };
        }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
        
        const lowStockProducts = allProducts.filter(p => p.quantity <= p.minStockLevel).sort((a,b) => a.quantity - b.quantity).slice(0, 10);
        const recentActivity = await this.getGlobalActivity(10);

        return {
            stats: { totalRevenue, totalProfit, salesCount: sales.length, inventoryValue, totalExpenses: totalExpensesValue },
            sales, expenses, topProducts, topCustomers, lowStockProducts, recentActivity,
        };
    }
    
    async getGlobalActivity(limit: number): Promise<GlobalActivityItem[]> {
        const [allSales, allStockIntakes, allReturns, allCustomers, allPayments] = await Promise.all([
            this.db.sales.orderBy('createdAt').reverse().limit(limit).toArray(),
            this.db.stockIntakes.orderBy('createdAt').reverse().limit(limit).toArray(),
            this.db.returns.orderBy('createdAt').reverse().limit(limit).toArray(),
            this.db.customers.orderBy('createdAt').reverse().limit(limit).toArray(),
            this.db.payments.orderBy('paymentDate').reverse().limit(limit).toArray(),
        ]);
        
        const activity: GlobalActivityItem[] = [];
        allSales.forEach(s => s.createdAt && activity.push({ type: 'sale', date: safeToDate(s.createdAt), id: s.id!, description: `Vente #${s.invoiceNumber}`, details: s.customerName || 'Client de passage', amount: s.total, amountClass: 'text-primary' }));
        allStockIntakes.forEach(si => si.createdAt && activity.push({ type: 'stock_intake', date: safeToDate(si.createdAt), id: si.id!, description: `Réception de stock`, details: `Facture: ${si.invoiceNumber}`, amount: si.totalValue, amountClass: 'text-yellow-500' }));
        allReturns.forEach(r => r.createdAt && activity.push({ type: 'return', date: safeToDate(r.createdAt), id: r.id!, description: `Retour sur facture #${r.originalInvoiceNumber}`, details: `${r.items.length} article(s) retourné(s)`, amount: -r.totalReturnValue, amountClass: 'text-destructive' }));
        allCustomers.forEach(c => c.createdAt && activity.push({ type: 'customer', date: safeToDate(c.createdAt), id: c.id!, description: `Nouveau client`, details: `${''\''.concat(c.firstName, ' ', c.lastName)}`, amount: undefined }));
        allPayments.forEach(p => p.paymentDate && activity.push({ type: 'payment', date: safeToDate(p.paymentDate), id: p.id!, description: `Paiement reçu`, details: p.customerName || 'Client inconnu', amount: p.amount, amountClass: 'text-green-500' }));
        
        return activity.sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
    }
}

export const dataService = new DataService();
