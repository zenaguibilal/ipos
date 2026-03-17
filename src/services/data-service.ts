'use client';

import { getDb } from '@/lib/database';
import type { Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, Notification, InventoryLog, StockIntakeItem, SaleItem, TopProduct, ZakatData, CostingItem, Draft, Supplier, ImportAnalysis, BreadClient, BreadOrder, BreadOrderWithClient, DB, ProductImportAnalysis, GlobalActivityItem, DashboardDataType } from '@/lib/types';
import { subDays, parseISO, format } from 'date-fns';
import Papa from 'papaparse';
import { calculateCartTotals } from '@/lib/utils';
import { BREAD_WEEK_DAYS } from '@/lib/constants';
import { sheetsService } from './googleSheets';

const db = () => {
  if (typeof window === 'undefined') {
    throw new Error('DB only available on client')
  }
  return getDb()
}

class DataService {
  
  // ====================================================================
  // Generic Read/Write Methods
  // ====================================================================
  
  async getAll<T>(table: keyof DB): Promise<T[]> {
    return db().table<T, any>(table).toArray();
  }

  async getById<T>(table: keyof DB, id: any): Promise<T | undefined> {
    return db().table<T, any>(table).get(id);
  }
  
  // ====================================================================
  // Settings
  // ====================================================================
  
  async getSetting(id: string): Promise<Setting | undefined> {
    return (await db().settings.get(id)) || undefined;
  }

  async setSetting(id: string, value: any): Promise<string> {
    await db().settings.put({ id, value });
    sheetsService.addToQueue('settings', 'upsert', { id, value });
    return id;
  }

  // ====================================================================
  // Company Profile
  // ====================================================================

  async getCompanyProfile(): Promise<CompanyProfile | null> {
    const profile = await db().companyProfile.get(1);
    return profile ?? null;
  }
  
  async updateCompanyProfile(profileData: Partial<Omit<CompanyProfile, 'id'>>): Promise<number> {
    const profile = await this.getCompanyProfile() ?? {id: 1};
    await db().companyProfile.put({ ...profile, ...profileData, id: 1});
    sheetsService.addToQueue('companyProfile', 'upsert', { ...profile, ...profileData, id: 1});
    return 1;
  }
  
  // ====================================================================
  // Carts
  // ====================================================================
  
  async getCart(id: string): Promise<Cart | undefined> {
    return db().carts.get(id);
  }

  async saveCart(cart: Cart): Promise<string> {
    return db().carts.put(cart).then(() => cart.id);
  }

  async deleteCart(id: string): Promise<void> {
    return db().carts.delete(id);
  }

  async addProductToCart(cartId: string, product: Product, quantity: number): Promise<void> {
    const cart = await db().carts.get(cartId);
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
      const cart = await db().carts.get(cartId);
      if (!cart) throw new Error("Panier non trouvé.");

      const itemIndex = cart.items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return {capped: false};
      
      const item = cart.items[itemIndex];
      let capped = false;
      let maxQuantity: number | undefined = undefined;

      if (typeof item.id === 'number') {
          const product = await db().products.get(item.id as number);
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
      await db().carts.put(cart);
      return {capped, maxQuantity};
  }

  async removeCartItem(cartId: string, itemId: string | number): Promise<void> {
    const cart = await db().carts.get(cartId);
    if (!cart) return;
    cart.items = cart.items.filter(item => item.id !== itemId);
    await db().carts.put(cart);
  }
  
  async clearCart(cartId: string): Promise<void> {
    const cart = await db().carts.get(cartId);
    if (!cart) return;
    cart.items = [];
    cart.customerId = null;
    cart.customerName = '';
    cart.discount = { type: 'fixed', value: 0 };
    await db().carts.put(cart);
  }

  async setCartCustomer(cartId: string, customer: Customer | null): Promise<void> {
    const cart = await db().carts.get(cartId);
    if (!cart) return;
    cart.customerId = customer ? customer.id! : null;
    cart.customerName = customer ? `${customer.firstName} ${customer.lastName}` : '';
    await db().carts.put(cart);
  }

  async setCartDiscount(cartId: string, discount: { type: 'fixed' | 'percentage'; value: number }): Promise<void> {
      const cart = await db().carts.get(cartId);
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
      await db().carts.put(cart);
  }

  async removeFlashFromCartItems(cartId: string): Promise<void> {
    const cart = await db().carts.get(cartId);
    if (!cart) return;
    cart.items.forEach(i => { if(i.flash) i.flash = false });
    await db().carts.put(cart);
  }

  // ====================================================================
  // Products
  // ====================================================================
  
  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return db().products.where('barcodes').equals(barcode).first();
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
      const newProduct = await db().products.add(product).then(id => this.getById<Product>('products', id));
      await db().inventoryLogs.add({
            productId: newProduct!.id as number,
            change: product.quantity,
            newQuantity: product.quantity,
            reason: 'stock_intake',
            relatedId: `init-${newProduct!.id as number}`,
        });
      sheetsService.addToQueue('products', 'upsert', newProduct);
      return newProduct!;
  }

  async updateProduct(id: number, productData: Partial<Omit<Product, 'id'>>): Promise<Product | undefined> {
    const oldProduct = await this.getById<Product>('products', id);
    const updatedProduct = await db().products.update(id, productData).then(() => db().products.get(id));
    
    if (updatedProduct && oldProduct && productData.quantity !== undefined && oldProduct.quantity !== productData.quantity) {
        await db().inventoryLogs.add({
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
      await db().inventoryLogs.where({ productId: id }).delete();
      await db().products.delete(id);
      sheetsService.addToQueue('products', 'delete', { id });
  }

  async deleteProducts(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.deleteProduct(id);
    }
  }

  async getProducts(params: { query?: string; category?: string; supplierId?: number; stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock', sortBy?: string }): Promise<Product[]> {
    const { query, category, supplierId, stockStatus = 'all', sortBy = 'name_asc' } = params;
    const products = await db().products.toArray();

    let filtered = products;

    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (stockStatus !== 'all') {
        filtered = filtered.filter(p => {
            switch (stockStatus) {
                case 'in_stock': return p.quantity > p.minStockLevel;
                case 'low_stock': return p.quantity > 0 && p.quantity <= p.minStockLevel;
                case 'out_of_stock': return p.quantity <= 0;
                default: return true;
            }
        });
    }

    if(supplierId) {
        filtered = filtered.filter(p => p.fournisseurId === supplierId);
    }
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.barcodes?.some(b => b.includes(lowerQuery))
      );
    }
    
    const [sortField, sortOrder] = sortBy.split('_') as [keyof Product, 'asc' | 'desc'];
    
    filtered.sort((a, b) => {
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
    
    return filtered;
  }

  async getProductsByIds(ids: number[]): Promise<Product[]> {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    return db().products.where('id').anyOf(ids).toArray();
  }

  async getProductCategories(): Promise<string[]> {
    const categories = await db().products.orderBy('category').uniqueKeys();
    return categories as string[];
  }
  
  async getSuppliers(): Promise<Supplier[]> {
      return db().suppliers.orderBy('name').toArray();
  }

  // ====================================================================
  // Customers
  // ====================================================================
  async getCustomerById(id: number): Promise<Customer | undefined> {
      return db().customers.get(id);
  }

  async getCustomerActivity(customerId: number): Promise<GlobalActivityItem[]> {
    if (!customerId) return [];
    const [sales, payments, returns] = await Promise.all([
          db().sales.where({ customerId }).reverse().sortBy('createdAt'),
          db().payments.where({ customerId }).reverse().sortBy('paymentDate'),
          db().returns.where({ customerId }).reverse().sortBy('createdAt')
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

        const customerSales = await db().sales.where({ customerId }).toArray();
        const unpaidSales = customerSales
            .filter(sale => sale.paymentStatus !== 'paid')
            .sort((a,b) => (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0));
        
        return { customer, unpaidSales };
    }

  async getCustomers(params: { query?: string; status?: 'all' | 'has_debt' | 'overdue' | 'over_limit', sortBy?: string, limit?: number }): Promise<Customer[]> {
    const { query, status = 'all', sortBy = 'lastName_asc', limit } = params;
    let customers = await db().customers.toArray();

    if (query) {
        const lowerQuery = query.toLowerCase();
        customers = customers.filter(c => (c.firstName + ' ' + c.lastName).toLowerCase().includes(lowerQuery) || c.phone?.includes(lowerQuery));
    }
    
    const now = new Date();
    const customerWithData: Customer[] = customers.map(c => {
        let debtStatus: Customer['debtStatus'] = 'none';
        if (c.outstandingBalance > 0 && c.lastActivityDate && c.settlementDay) {
            const dueDate = new Date(new Date(c.lastActivityDate).getTime() + c.settlementDay * 24 * 60 * 60 * 1000);
            if(now > dueDate) {
                debtStatus = 'overdue';
            } else if (subDays(dueDate, 7) <= now) {
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
        if(sortField.includes('Date') && aValue && bValue) {
            const dateA = new Date(aValue).getTime();
            const dateB = new Date(bValue).getTime();
            comparison = dateA - dateB;
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
      const data = {
          ...customer,
          totalSpent: 0,
          outstandingBalance: 0,
      };
      const newCustomer = await db().customers.add(data as Customer);
      sheetsService.addToQueue('customers', 'upsert', {id: newCustomer, ...data});
      return {id: newCustomer, ...data} as Customer;
  }

  async updateCustomer(id: number, customerData: Partial<Omit<Customer, 'id'>>): Promise<Customer | undefined> {
      const updatedCustomer = await db().customers.update(id, customerData).then(() => db().customers.get(id));
      if (updatedCustomer) sheetsService.addToQueue('customers', 'upsert', updatedCustomer);
      return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    const customer = await this.getById<Customer>('customers', id);
    if (!customer) return;
    if (customer.outstandingBalance > 0) {
        throw new Error(`Suppression impossible : ce client a un solde impayé de ${customer.outstandingBalance.toFixed(2)} DA`);
    }
    const sales = await db().sales.where({ customerId: id }).toArray();
    if (sales.length > 0) {
        throw new Error("Suppression impossible : ce client a un historique de transactions. Envisagez de le désactiver à la place.");
    }
    await db().customers.delete(id);
    sheetsService.addToQueue('customers', 'delete', { id });
  }

  async exportCustomersToCSV(): Promise<string> {
    const customers = await this.getAll<Customer>('customers');
    return Papa.unparse(customers.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        address: c.address,
        outstandingBalance: c.outstandingBalance,
        creditLimit: c.creditLimit,
        settlementDay: c.settlementDay,
        lastActivityDate: c.lastActivityDate,
        createdAt: c.createdAt,
    })), {
        header: true
    });
  }

  async analyzeCustomerImport(data: any[]): Promise<ImportAnalysis> {
        const allCustomers = await this.getAll<Customer>('customers');
        const analysis: ImportAnalysis = {
            customersToAdd: [], customersToUpdate: [], skippedRows: [], errorRows: [], totalRows: data.length
        };
        
        for (const row of data) {
            if (!row.firstName || !row.lastName) {
                analysis.errorRows.push(row);
                continue;
            }
            const existingCustomer = allCustomers.find(c => c.firstName === row.firstName && c.lastName === row.lastName);
            if (existingCustomer) {
                analysis.customersToUpdate.push({ ...row, id: existingCustomer.id });
            } else {
                analysis.customersToAdd.push(row);
            }
        }
        return analysis;
    }

    async processCustomerImport(toAdd: any[], toUpdate: any[]): Promise<void> {
        if(toAdd.length > 0) {
           for (const row of toAdd) {
               await this.addCustomer(this.mapRowToCustomer(row));
           }
        }
        if(toUpdate.length > 0) {
            for (const row of toUpdate) {
                await this.updateCustomer(row.id, this.mapRowToCustomer(row));
            }
        }
    }
    
    private mapRowToCustomer(row: any) {
        return {
            firstName: row.firstName,
            lastName: row.lastName,
            phone: row.phone || '',
            address: row.address || '',
            creditLimit: parseFloat(row.creditLimit) || undefined,
            settlementDay: parseInt(row.settlementDay) || undefined,
        };
    }
    
     async analyzeProductImport(data: any[]): Promise<ProductImportAnalysis> {
        const allProducts = await this.getAll<Product>('products');
        const analysis: ProductImportAnalysis = {
            productsToAdd: [], productsToUpdate: [], skippedRows: [], errorRows: [], totalRows: data.length
        };

        for (const row of data) {
            if (!row.name || !row.price) {
                analysis.errorRows.push(row);
                continue;
            }
            const existingProduct = allProducts.find(p => p.name.toLowerCase() === row.name.toLowerCase());
            if (existingProduct) {
                analysis.productsToUpdate.push({ ...row, id: existingProduct.id });
            } else {
                analysis.productsToAdd.push(row);
            }
        }
        return analysis;
    }

    async processProductImport(toAdd: any[], toUpdate: any[]): Promise<void> {
        for (const row of toAdd) await this.addProduct(this.mapRowToProduct(row));
        for (const row of toUpdate) await this.updateProduct(row.id, this.mapRowToProduct(row));
    }
    
    private mapRowToProduct(row: any): Omit<Product, 'id'> {
        return {
            name: row.name,
            category: row.category || 'Non classé',
            price: parseFloat(row.price) || 0,
            purchasePrice: parseFloat(row.purchasePrice) || 0,
            quantity: parseInt(row.quantity) || 0,
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
  
  // ====================================================================
  // Bread
  // ====================================================================
  
  async getBreadClients(): Promise<BreadClient[]> {
    return db().bread_clients.orderBy('nom').toArray();
  }

  async addBreadClient(client: Omit<BreadClient, 'id'>): Promise<BreadClient> {
    const newClient = await db().clients_pain.add(client).then(id => this.getById<BreadClient>('clients_pain', id));
    sheetsService.addToQueue('clients_pain', 'upsert', newClient);
    return newClient!;
  }

  async updateBreadClient(id: number, data: Partial<BreadClient>): Promise<BreadClient | undefined> {
    const updatedClient = await db().clients_pain.update(id, data).then(() => db().clients_pain.get(id));
    if (updatedClient) sheetsService.addToQueue('clients_pain', 'upsert', updatedClient);
    return updatedClient;
  }

  async deleteBreadClient(id: number): Promise<void> {
    const orders = await db().commandes_pain.where({ client_pain_id: id }).toArray();
    for(const order of orders) {
      if(order.id) await db().commandes_pain.delete(order.id);
    }
    await db().clients_pain.delete(id);
    sheetsService.addToQueue('clients_pain', 'delete', { id });
  }

  async getManualBreadClients(): Promise<BreadClient[]> {
    return db().clients_pain.where('type_recurrence').equals('aucun').and(c => c.actif === true).toArray();
  }

  async addManualBreadOrder(clientId: number, date: string, quantity: number): Promise<BreadOrder> {
    const existing = await db().commandes_pain.where({ client_pain_id: clientId, date: date }).first();
    if(existing) {
        throw new Error("Une commande pour ce client existe déjà à cette date.");
    }

    const orderData: Omit<BreadOrder, 'id'> = {
      client_pain_id: clientId,
      date,
      quantite: quantity,
      est_paye: false,
      est_livre: false,
      vente_id: null
    };
    const newOrder = await db().commandes_pain.add(orderData).then(id => this.getById<BreadOrder>('commandes_pain', id));
    sheetsService.addToQueue('commandes_pain', 'upsert', newOrder);
    return newOrder!;
  }
  
  async updateBreadOrderQuantity(orderId: number, newQuantity: number): Promise<BreadOrder | undefined> {
    const order = await this.getById<BreadOrder>('commandes_pain', orderId);
    if (!order) return undefined;
    const updatedOrder = await db().commandes_pain.update(orderId, { quantite: newQuantity, quantite_origine: order.quantite });
    if (updatedOrder) sheetsService.addToQueue('commandes_pain', 'upsert', {id: orderId, quantite: newQuantity, quantite_origine: order.quantite});
    return this.getById<BreadOrder>('commandes_pain', orderId);
  }

  async updateBreadOrderDeliveryStatus(orderId: number, delivered: boolean): Promise<BreadOrder | undefined> {
    const updatedOrder = await db().commandes_pain.update(orderId, { est_livre: delivered });
    if(updatedOrder) sheetsService.addToQueue('commandes_pain', 'upsert', {id: orderId, est_livre: delivered });
    return this.getById<BreadOrder>('commandes_pain', orderId);
  }
  
  async checkIfBreadOrdersExist(date: string): Promise<boolean> {
    const count = await db().commandes_pain.where({ date }).count();
    return count > 0;
  }

  async createDayOrders(date: string): Promise<void> {
    const dayOfWeek = BREAD_WEEK_DAYS[new Date(date.replace(/-/g, '/')).getUTCDay()];
    const activeClients = await db().clients_pain.where('actif').equals(true).toArray();

    const ordersToCreate: Omit<BreadOrder, 'id'>[] = [];

    for (const client of activeClients) {
      let quantity: number | undefined;

      if (client.type_recurrence === 'quotidien') {
        quantity = client.quantite_defaut;
      } else if (client.type_recurrence === 'jours_specifiques' && client.jours_semaine?.[dayOfWeek]?.actif) {
        quantity = client.jours_semaine[dayOfWeek].quantite;
      }

      if (quantity && quantity > 0) {
        ordersToCreate.push({
          client_pain_id: client.id!,
          date,
          quantite,
          est_paye: false,
          est_livre: false,
          vente_id: null
        });
      }
    }
    
    if(ordersToCreate.length > 0) {
      const newOrders = await db().commandes_pain.bulkAdd(ordersToCreate);
      newOrders.forEach(id => sheetsService.addToQueue('commandes_pain', 'upsert', {id, ...ordersToCreate[newOrders.indexOf(id)]}));
    }
  }

  async getBreadOrdersForDate(date: string): Promise<BreadOrderWithClient[]> {
    const orders = await db().commandes_pain.where('date').equals(date).toArray();
    const clients = await db().clients_pain.toArray();
    const clientsMap = new Map(clients.map(c => [c.id, c]));

    const result: BreadOrderWithClient[] = orders
      .map(order => ({
        ...order,
        client: clientsMap.get(order.client_pain_id)!,
      }))
      .filter(order => order.client);

    return result.sort((a, b) => a.client.nom.localeCompare(b.client.nom));
  }
  
  async convertBreadOrdersToSales(orderIds: number[], breadPrice: number): Promise<void> {
    const breadProduct = await db().products.where('name').equalsIgnoreCase('pain').first();
    if (!breadProduct || !breadProduct.id) {
        throw new Error("Le produit 'Pain' n'a pas été trouvé. Veuillez le créer.");
    }
    
    for (const orderId of orderIds) {
        const order = await db().commandes_pain.get(orderId);
        if (order && !order.vente_id) {
            const saleItem: SaleItem = {
                id: breadProduct.id!,
                name: "Pain",
                price: breadPrice,
                purchasePrice: breadProduct.purchasePrice,
                quantity: order.quantite,
            };
            const total = saleItem.price * saleItem.quantity;

            const client = await db().clients_pain.get(order.client_pain_id);
            
            const newSale = await this.addSale({
                items: [saleItem],
                subtotal: total,
                total,
                amountPaid: 0,
                payments: [],
                clientPainId: order.client_pain_id,
                customerName: client?.nom,
            });

            await this.updateBreadOrder(order.id!, { vente_id: newSale.id, est_paye: true });

            if(client?.nom){
               const allCustomers = await this.getAll<Customer>('customers');
               const mainCustomer = allCustomers.find(c => (c.firstName + ' ' + c.lastName).toLowerCase() === client.nom.toLowerCase());
               if (mainCustomer && mainCustomer.id) {
                   const newBalance = mainCustomer.outstandingBalance + total;
                   await this.updateCustomer(mainCustomer.id, {
                       outstandingBalance: newBalance,
                       lastActivityDate: new Date(),
                   });
               }
            }
        }
    }
  }

  async updateBreadOrder(id: number, data: Partial<BreadOrder>): Promise<BreadOrder | undefined> {
    const updatedOrder = await db().commandes_pain.update(id, data).then(() => db().commandes_pain.get(id));
    if (updatedOrder) sheetsService.addToQueue('commandes_pain', 'upsert', updatedOrder);
    return updatedOrder;
  }
  
  async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
    return db().sales.where('invoiceNumber').equals(invoiceNumber).first();
  }

  async addSale(saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'remainingBalance' | 'paymentStatus'> & { amountPaid: number }): Promise<Sale> {
      const salesCount = await db().sales.count();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${(salesCount + 1).toString().padStart(5, '0')}`;
      const remainingBalance = saleData.total - saleData.amountPaid;
      const paymentStatus = remainingBalance <= 0 ? 'paid' : (saleData.amountPaid > 0 ? 'partial' : 'unpaid');
      
      const newSaleData = { ...saleData, invoiceNumber, remainingBalance, paymentStatus };
      const newSale = await db().sales.add(newSaleData).then(id => db().sales.get(id));
      
      for(const item of newSale!.items) {
          if (typeof item.id === 'number') {
              const product = await db().products.get(item.id as number);
              if (product) {
                  const newQuantity = product.quantity - item.quantity;
                  await db().products.update(item.id, { quantity: newQuantity });
                  await db().inventoryLogs.add({
                      productId: item.id,
                      change: -item.quantity,
                      newQuantity: newQuantity,
                      reason: 'sale',
                      relatedId: newSale!.id
                  });
              }
          }
      }
      
      if (newSale!.customerId) {
          const customer = await db().customers.get(newSale!.customerId);
          if (customer) {
              await db().customers.update(newSale!.customerId, {
                  outstandingBalance: customer.outstandingBalance + newSale!.remainingBalance,
                  totalSpent: customer.totalSpent + newSale!.total,
                  lastActivityDate: new Date(),
              });
          }
      }
      
      sheetsService.addToQueue('sales', 'upsert', newSale);
      return newSale!;
  }
  
    async deleteSale(saleId: number): Promise<void> {
        const sale = await db().sales.get(saleId);
        if (!sale) return;

        for (const item of sale.items) {
             if (typeof item.id === 'number') {
                const product = await db().products.get(item.id);
                if (product) {
                    const newQuantity = product.quantity + item.quantity;
                    await db().products.update(item.id, { quantity: newQuantity });
                    await db().inventoryLogs.add({
                        productId: item.id,
                        change: item.quantity,
                        newQuantity: newQuantity,
                        reason: 'cancellation',
                        relatedId: sale.id
                    });
                }
            }
        }
        
        if (sale.customerId) {
            const customer = await db().customers.get(sale.customerId);
            if (customer) {
                await db().customers.update(sale.customerId, {
                    outstandingBalance: customer.outstandingBalance - sale.remainingBalance,
                    totalSpent: customer.totalSpent - sale.total,
                });
            }
        }

        await db().sales.delete(saleId);
        sheetsService.addToQueue('sales', 'delete', { id: saleId });
    }
  
    async addPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
        const newPayment = await db().payments.add(paymentData).then(id => db().payments.get(id));
        
        const customer = await this.getById<Customer>('customers', newPayment!.customerId);
        if(customer) {
            await db().customers.update(newPayment!.customerId, {
                outstandingBalance: customer.outstandingBalance - newPayment!.amount,
                lastActivityDate: new Date(),
            });
        }
        
        sheetsService.addToQueue('payments', 'upsert', newPayment);
        return newPayment!;
    }
    
    async getSales({ from, to, query }: { from?: Date, to?: Date, query?: string }): Promise<Sale[]> {
        let sales = await db().sales.orderBy('createdAt').reverse().toArray();
        
        if (from && to) {
            sales = sales.filter(s => {
                if(!s.createdAt) return false;
                const saleDate = new Date(s.createdAt);
                return saleDate >= from && saleDate <= to;
            });
        }
        
        if (query) {
            const lowerQuery = query.toLowerCase();
            sales = sales.filter(s => 
                s.invoiceNumber.toLowerCase().includes(lowerQuery) || 
                s.customerName?.toLowerCase().includes(lowerQuery)
            );
        }
        
        return sales;
    }
    
    // ====================================================================
    // Drafts
    // ====================================================================
    async getDrafts(): Promise<Draft[]> {
        return db().drafts.orderBy('date').reverse().toArray();
    }
    
    async saveDraft(cart: Cart, notes?: string): Promise<Draft> {
        const { total } = calculateCartTotals(cart);
        const draftData: Omit<Draft, 'id'> = {
            date: new Date(),
            customerId: cart.customerId,
            customerName: cart.customerName,
            items: cart.items,
            total,
            discount: cart.discount,
            notes,
        };
        const newDraft = await db().drafts.add(draftData).then(id => db().drafts.get(id));
        sheetsService.addToQueue('drafts', 'upsert', newDraft);
        return newDraft!;
    }
    
    async deleteDraft(id: number): Promise<void> {
        sheetsService.addToQueue('drafts', 'delete', { id });
        return db().drafts.delete(id);
    }
    
    // ====================================================================
    // Stock Intakes
    // ====================================================================
    async addStockIntake(intakeData: { supplierName: string; invoiceNumber: string; invoiceDate: Date }, items: StockIntakeItem[]): Promise<StockIntake> {
        let supplier = await db().suppliers.where('name').equalsIgnoreCase(intakeData.supplierName).first();
        if(!supplier) {
            supplier = await db().suppliers.add({ name: intakeData.supplierName, balance: 0 }).then(id => db().suppliers.get(id));
        }
        
        const intakeItems = [];
        for (const item of items) {
            if(item.isNew) {
                const newProduct = await this.addProduct({
                    name: item.name,
                    category: item.category,
                    price: item.price,
                    purchasePrice: item.purchasePrice,
                    quantity: item.quantity - item.quantityDamaged,
                    minStockLevel: 10, // default
                    barcodes: item.barcodes,
                    unite: 'Pièce',
                    fournisseurId: supplier!.id,
                });
                item.productId = newProduct.id as number;
            } else {
                const product = await db().products.get(item.productId!);
                if (product) {
                    const newQuantity = product.quantity + item.quantity - item.quantityDamaged;
                    await this.updateProduct(item.productId!, { 
                        quantity: newQuantity,
                        purchasePrice: item.purchasePrice,
                        dateMajPrix: new Date(),
                        fournisseurId: supplier!.id,
                    });
                     await db().inventoryLogs.add({
                        productId: item.productId!,
                        change: item.quantity - item.quantityDamaged,
                        newQuantity: newQuantity,
                        reason: 'stock_intake'
                    });
                }
            }
            intakeItems.push({
                productId: item.productId,
                productName: item.name,
                quantityReceived: item.quantity,
                quantityDamaged: item.quantityDamaged,
                purchasePrice: item.purchasePrice,
            });
        }
        
        const totalValue = intakeItems.reduce((acc, item) => acc + (item.purchasePrice * item.quantityReceived), 0);
        
        const newIntakeData = {
            ...intakeData,
            supplierId: supplier!.id!,
            supplierName: intakeData.supplierName,
            items: intakeItems,
            totalValue
        };
        
        const newIntake = await db().stockIntakes.add(newIntakeData).then(id => this.getById<StockIntake>('stockIntakes', id));
        sheetsService.addToQueue('stockIntakes', 'upsert', newIntake);
        return newIntake!;
    }
    
    async getStockIntakes({ from, to, query }: { from?: Date, to?: Date, query?: string }): Promise<StockIntake[]> {
        let intakes = await db().stockIntakes.orderBy('invoiceDate').reverse().toArray();
        if (from && to) {
            intakes = intakes.filter(i => {
                if(!i.invoiceDate) return false;
                const intakeDate = new Date(i.invoiceDate);
                return intakeDate >= from && intakeDate <= to;
            });
        }
        if(query) {
            const lowerQuery = query.toLowerCase();
            intakes = intakes.filter(i => i.supplierName.toLowerCase().includes(lowerQuery) || i.invoiceNumber.toLowerCase().includes(lowerQuery));
        }
        return intakes;
    }
    
    // ====================================================================
    // Returns
    // ====================================================================
    async addReturn(returnData: Omit<ProductReturn, 'id'>): Promise<ProductReturn> {
        const newReturn = await db().returns.add(returnData).then(id => this.getById<ProductReturn>('returns', id));
        
        for (const item of newReturn!.items) {
            if(item.productId && item.wasRestocked) {
                const product = await db().products.get(item.productId);
                if(product) {
                    const newQuantity = product.quantity + item.quantity;
                    await this.updateProduct(item.productId, { quantity: newQuantity });
                    await db().inventoryLogs.add({
                        productId: item.productId,
                        change: item.quantity,
                        newQuantity: newQuantity,
                        reason: 'return',
                        relatedId: newReturn!.id,
                    });
                }
            }
        }
        
        if (newReturn!.customerId) {
            const customer = await this.getById<Customer>('customers', newReturn!.customerId);
            if (customer) {
                const balanceChange = newReturn!.totalReturnValue - newReturn!.amountRefunded;
                await this.updateCustomer(newReturn!.customerId, {
                    outstandingBalance: customer.outstandingBalance - balanceChange,
                    lastActivityDate: new Date(),
                });
            }
        }
        sheetsService.addToQueue('returns', 'upsert', newReturn);
        return newReturn!;
    }
    
    async deleteReturn(returnId: number): Promise<void> {
        const pr = await db().returns.get(returnId);
        if (!pr) return;

        for (const item of pr.items) {
            if (item.productId && item.wasRestocked) {
                const product = await db().products.get(item.productId);
                if (product) {
                    const newQuantity = product.quantity - item.quantity;
                    await db().products.update(item.productId, { quantity: newQuantity });
                }
            }
        }
        
        if (pr.customerId) {
            const customer = await db().customers.get(pr.customerId);
            if (customer) {
                const balanceChange = pr.totalReturnValue - pr.amountRefunded;
                await db().customers.update(pr.customerId, { outstandingBalance: customer.outstandingBalance + balanceChange });
            }
        }
        
        await db().returns.delete(returnId);
        sheetsService.addToQueue('returns', 'delete', { id: returnId });
    }
    
    async getReturns({ from, to, query }: { from?: Date, to?: Date, query?: string }): Promise<ProductReturn[]> {
         let returns = await db().returns.orderBy('createdAt').reverse().toArray();
        if (from && to) {
            returns = returns.filter(r => {
                if (!r.createdAt) return false;
                const returnDate = new Date(r.createdAt);
                return returnDate >= from && returnDate <= to;
            });
        }
        if (query) {
            const lowerQuery = query.toLowerCase();
            returns = returns.filter(r => 
                r.originalInvoiceNumber.toLowerCase().includes(lowerQuery) || 
                r.customerName?.toLowerCase().includes(lowerQuery)
            );
        }
        return returns;
    }
    
    // ====================================================================
    // Expenses
    // ====================================================================
    async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
        const newExpense = await db().expenses.add(expense).then(id => this.getById<Expense>('expenses', id));
        sheetsService.addToQueue('expenses', 'upsert', newExpense);
        return newExpense!;
    }
    
    async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id'>>): Promise<Expense | undefined> {
        const updatedExpense = await db().expenses.update(id, expenseData).then(() => db().expenses.get(id));
        if (updatedExpense) sheetsService.addToQueue('expenses', 'upsert', updatedExpense);
        return updatedExpense;
    }
    
    async deleteExpense(id: number): Promise<void> {
        await db().expenses.delete(id);
        sheetsService.addToQueue('expenses', 'delete', { id });
    }
    
    async getExpenseCategories(): Promise<string[]> {
        const expenses = await this.getAll<Expense>('expenses');
        return Array.from(new Set(expenses.map(e => e.category)));
    }
    
    async getExpenses({ from, to, category }: { from?: Date, to?: Date, category?: string }): Promise<Expense[]> {
        let expenses = await db().expenses.orderBy('expenseDate').reverse().toArray();
        if (from && to) {
            expenses = expenses.filter(e => {
                const expenseDate = new Date(e.expenseDate);
                return expenseDate >= from && expenseDate <= to;
            });
        }
        if (category) {
            expenses = expenses.filter(e => e.category === category);
        }
        return expenses;
    }
    
    // ====================================================================
    // Costing
    // ====================================================================
    async applyNewPurchasePrices(costingItems: CostingItem[]): Promise<void> {
        const dbInstance = db();
        await dbInstance.transaction('rw', dbInstance.products, async () => {
            for (const item of costingItems) {
                if(item.productId) {
                    await dbInstance.products.update(item.productId, { 
                        purchasePrice: item.finalCostPerUnit,
                        dateMajPrix: new Date()
                    });
                }
            }
        });
    }
    
    // ====================================================================
    // Data Import/Export & Backup/Restore
    // ====================================================================
    async exportData(): Promise<string> {
        const dbInstance = db();
        const data: Partial<DB> = {};
        await dbInstance.transaction('r', dbInstance.tables, async () => {
            for (const table of dbInstance.tables) {
                data[table.name as keyof DB] = await table.toArray();
            }
        });
        return JSON.stringify(data, null, 2);
    }
    
    async restoreTables(backupData: Partial<DB>, tablesToRestore: string[], onProgress: (progress: any) => void): Promise<void> {
        const dbInstance = db();
        const total = tablesToRestore.length;
        let current = 0;
        const done: { table: string; success: boolean; error?: string }[] = [];

        for (const tableName of tablesToRestore) {
            current++;
            try {
                if (backupData[tableName as keyof typeof backupData]) {
                    const records = backupData[tableName as keyof typeof backupData] as any[];
                    await db().table(tableName).clear();
                    await db().table(tableName).bulkPut(records);
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
        await db().delete();
    }
}

export const dataService = new DataService();
