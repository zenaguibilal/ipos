
'use client';

import { db } from '@/lib/database';
import type { Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, StockIntakeItem, ZakatData, CostingItem, Supplier, ImportAnalysis, BreadClient, BreadOrder, BreadOrderWithClient, ProductImportAnalysis, GlobalActivityItem, Draft, CartItem, SaleItem } from '@/lib/types';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { startOfDay, endOfDay, format } from 'date-fns';
import { calculateCartTotals } from '@/lib/utils';
import { liveQuery } from 'dexie';

class DataService {

    // =================== Company Profile ===================
    async getCompanyProfile(): Promise<CompanyProfile | null> {
        return await db.companyProfile.get(1) ?? null;
    }

    async updateCompanyProfile(profileData: Partial<Omit<CompanyProfile, 'id'>>): Promise<void> {
        await db.companyProfile.put({ id: 1, ...profileData, updatedAt: new Date() });
    }

    // =================== Cart ===================
    async addProductToCart(cartId: string, product: Product, quantity: number): Promise<void> {
        await db.transaction('rw', db.carts, db.products, async () => {
            const cart = await db.carts.get(cartId);
            if (!cart) return;

            const existingItem = cart.items.find(item => item.id === product.id);

            if (existingItem) {
                const newQuantity = existingItem.cartQuantity + quantity;
                await this.updateCartItemQuantity(cartId, existingItem.id, newQuantity);
            } else {
                const newCartItem: CartItem = { ...product, cartQuantity: quantity, flash: true };
                await db.carts.update(cartId, { items: [...cart.items, newCartItem] });
            }
        });
        setTimeout(() => this.removeFlashFromCartItems(cartId), 500);
    }
    
    async updateCartItemQuantity(cartId: string, itemId: string | number, newQuantity: number): Promise<{ capped: boolean, maxQuantity?: number }> {
        return db.transaction('rw', db.carts, db.products, async () => {
            const cart = await db.carts.get(cartId);
            if (!cart) return { capped: false };

            const itemToUpdate = cart.items.find(item => item.id === itemId);
            if (!itemToUpdate) return { capped: false };
            
            let finalQuantity = newQuantity;
            let result: { capped: boolean, maxQuantity?: number } = { capped: false };
            
            if (typeof itemId === 'number') {
                const product = await db.products.get(itemId);
                if (product && newQuantity > product.quantity) {
                    finalQuantity = product.quantity;
                    result = { capped: true, maxQuantity: product.quantity };
                }
            }

            const updatedItems = cart.items.map(item =>
                item.id === itemId ? { ...item, cartQuantity: Math.max(0, finalQuantity) } : item
            ).filter(item => item.cartQuantity > 0);

            await db.carts.update(cartId, { items: updatedItems });
            return result;
        });
    }

    async removeCartItem(cartId: string, itemId: string | number): Promise<void> {
        await db.carts.where('id').equals(cartId).modify(cart => {
            cart.items = cart.items.filter(item => item.id !== itemId);
        });
    }

    async clearCart(cartId: string): Promise<void> {
        await db.carts.update(cartId, { items: [], discount: { type: 'fixed', value: 0 } });
    }

    async setCartCustomer(cartId: string, customer: Customer | null): Promise<void> {
        await db.carts.update(cartId, {
            customerId: customer?.id ?? null,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'
        });
    }
    
    async removeFlashFromCartItems(cartId: string): Promise<void> {
        await db.carts.where('id').equals(cartId).modify(cart => {
            cart.items.forEach(item => { if(item.flash) delete item.flash; });
        });
    }

    async addCart(cart: Cart): Promise<void> {
        await db.carts.add(cart);
    }
    
    async removeCart(cartId: string): Promise<void> {
        await db.transaction('rw', db.carts, async () => {
            const carts = await db.carts.toArray();
            if (carts.length <= 1) {
                throw new Error("Impossible de supprimer le dernier panier.");
            }
            await db.carts.delete(cartId);
        });
    }
    
    async setCartDiscount(cartId: string, discount: { type: 'fixed' | 'percentage', value: number }): Promise<void> {
        await db.carts.update(cartId, { "discount.type": discount.type, "discount.value": discount.value });
    }
    
    // =================== Drafts ===================
    async saveCartAsDraft(cart: Cart): Promise<void> {
        if (cart.items.length === 0) {
            toast.error("Impossible de sauvegarder un panier vide.");
            return;
        }
        const { total } = calculateCartTotals(cart);
        const draft: Draft = {
            date: new Date(),
            customerId: cart.customerId,
            customerName: cart.customerName,
            items: cart.items,
            total: total,
            discount: cart.discount,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await db.drafts.add(draft);
        toast.success("Brouillon sauvegardé.");
    }
    
    async loadDraftToCart(draftId: number, cartId: string): Promise<void> {
        await db.transaction('rw', db.carts, db.drafts, async () => {
            const draft = await db.drafts.get(draftId);
            if (!draft) {
                throw new Error("Brouillon non trouvé.");
            }
            await db.carts.update(cartId, {
                items: draft.items,
                customerId: draft.customerId,
                customerName: draft.customerName,
                discount: draft.discount,
            });
            await db.drafts.delete(draftId);
            toast.success("Brouillon chargé dans le panier actif.");
        });
    }
    
    async deleteDraft(draftId: number): Promise<void> {
        await db.drafts.delete(draftId);
    }

    // =================== Product ===================
    async getProductByBarcode(barcode: string): Promise<Product | undefined> {
        return await db.products.where('barcodes').equals(barcode).first();
    }
    
    async addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
        return db.transaction('rw', db.products, async () => {
            const now = new Date();
            const newProduct = {
                ...productData,
                createdAt: now,
                updatedAt: now,
                dateMajPrix: now,
            };
            const id = await db.products.add(newProduct as Product);
            return { ...newProduct, id } as Product;
        });
    }

    async updateProduct(id: number, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
         await db.transaction('rw', db.products, async () => {
            const dataToUpdate: any = { ...productData, updatedAt: new Date() };
            const oldProduct = await db.products.get(id);

            if (oldProduct && productData.purchasePrice && productData.purchasePrice !== oldProduct.purchasePrice) {
                 dataToUpdate.dateMajPrix = new Date();
            }
             
            await db.products.update(id, dataToUpdate);
        });
    }

    async deleteProduct(id: number): Promise<void> {
        return db.transaction('rw', db.sales, db.products, async () => {
            const saleWithProduct = await db.sales.filter(sale => 
                sale.items.some(item => item.id === id)
            ).first();

            if (saleWithProduct) {
                const product = await db.products.get(id);
                throw new Error(`Impossible de supprimer le produit "${product?.name || 'inconnu'}" car il a déjà été vendu.`);
            }
            await db.products.delete(id);
        });
    }

    async deleteProducts(ids: number[]): Promise<void> {
       return db.transaction('rw', db.products, db.sales, async () => {
            const sales = await db.sales.toArray();
            const soldProductIds = new Set<number>();
            for (const sale of sales) {
                for (const item of sale.items) {
                    if (typeof item.id === 'number') {
                        soldProductIds.add(item.id);
                    }
                }
            }

            const problemId = ids.find(id => soldProductIds.has(id));

            if (problemId) {
                const product = await db.products.get(problemId);
                throw new Error(`Impossible de supprimer "${product?.name || 'un produit'}" (ID: ${problemId}) car il a déjà été vendu. L'opération a été annulée.`);
            }
            
            await db.products.bulkDelete(ids);
        });
    }

    async getProducts(params: { query?: string, category?: string, supplier?: string, stockStatus?: string, sortBy?: string }): Promise<Product[]> {
        const [sortKey, sortOrder] = (params.sortBy || 'createdAt_desc').split('_');
        
        let collection = db.products.orderBy(sortKey);

        if (sortOrder === 'desc') {
            collection = collection.reverse();
        }

        if (params.query || (params.category && params.category !== 'all') || (params.stockStatus && params.stockStatus !== 'all') || (params.supplier && params.supplier !== 'all')) {
            collection = collection.filter(p => {
                let passes = true;
                if (params.query) {
                    const q = params.query.toLowerCase();
                    passes = passes && (p.name.toLowerCase().includes(q) || (p.barcodes && p.barcodes.some(b => b.includes(q))));
                }
                if (params.category && params.category !== 'all') {
                    passes = passes && (p.category === params.category);
                }
                if (params.supplier && params.supplier !== 'all') {
                    passes = passes && (p.fournisseurId === parseInt(params.supplier!));
                }
                if (params.stockStatus && params.stockStatus !== 'all') {
                    if (params.stockStatus === 'in_stock') passes = passes && p.quantity > 0;
                    if (params.stockStatus === 'low_stock') passes = passes && (p.quantity > 0 && p.quantity <= p.minStockLevel);
                    if (params.stockStatus === 'out_of_stock') passes = passes && p.quantity <= 0;
                }
                return passes;
            });
        }
        
        return await collection.toArray();
    }

    async getProductsByIds(ids: number[]): Promise<Product[]> {
        const products = await db.products.bulkGet(ids);
        return products.filter((p): p is Product => p !== undefined);
    }
    
    async getProductCategories(): Promise<string[]> {
        const products = await db.products.toArray();
        const categories = new Set(products.map(p => p.category).filter(Boolean) as string[]);
        return Array.from(categories).sort();
    }
    
    async getSuppliers(): Promise<Supplier[]> {
        return await db.suppliers.orderBy('name').toArray();
    }

    // =================== Customer ===================
    async getCustomerById(id: number): Promise<Customer | undefined> {
        return await db.customers.get(id);
    }
    
    async getCustomerActivity(customerId: number): Promise<(Sale | Payment | ProductReturn)[]> {
        const sales = await db.sales.where('customerId').equals(customerId).toArray();
        const payments = await db.payments.where('customerId').equals(customerId).toArray();
        const returns = await db.returns.where('customerId').equals(customerId).toArray();
        
        const activity = [
            ...sales.map(s => ({ ...s, type: 'sale', date: s.createdAt! })),
            ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate })),
            ...returns.map(r => ({ ...r, type: 'return', date: r.createdAt! })),
        ];

        return activity.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    async getCustomerStatementData(customerId: number): Promise<{ customer: Customer, unpaidSales: Sale[]}> {
        const customer = await db.customers.get(customerId);
        if (!customer) throw new Error("Client non trouvé");
        const unpaidSales = await db.sales
            .where('customerId').equals(customerId)
            .and(sale => sale.paymentStatus !== 'paid')
            .orderBy('createdAt').toArray();
        return { customer, unpaidSales };
    }

    async getCustomers(params: { query?: string, status?: string }): Promise<Customer[]> {
        let collection = db.customers.orderBy('lastActivityDate').reverse();

        if (params.query || (params.status && params.status !== 'all')) {
            collection = collection.filter(c => {
                let passes = true;
                if (params.query) {
                    const q = params.query.toLowerCase();
                    passes = passes && (c.searchName?.toLowerCase().includes(q) || c.phone?.includes(q));
                }
                if (params.status && params.status !== 'all') {
                    if (params.status === 'has_debt') passes = passes && c.outstandingBalance > 0;
                    if (params.status === 'overdue') passes = passes && c.debtStatus === 'overdue';
                    if (params.status === 'over_limit') passes = passes && c.isOverLimit === true;
                }
                return passes;
            });
        }
        
        return await collection.toArray();
    }

    async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<Customer> {
        const now = new Date();
        const newCustomer = {
            ...customer,
            searchName: `${customer.firstName} ${customer.lastName}`.toLowerCase(),
            totalSpent: 0,
            outstandingBalance: 0,
            createdAt: now,
            updatedAt: now,
            lastActivityDate: now,
        };
        const id = await db.customers.add(newCustomer as Customer);
        return { ...newCustomer, id } as Customer;
    }

    async updateCustomer(id: number, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> {
        await db.transaction('rw', db.customers, async () => {
            const dataToUpdate: any = { ...customerData, updatedAt: new Date() };
            if (customerData.firstName || customerData.lastName) {
                const oldCustomer = await db.customers.get(id);
                const firstName = customerData.firstName || oldCustomer?.firstName;
                const lastName = customerData.lastName || oldCustomer?.lastName;
                dataToUpdate.searchName = `${firstName} ${lastName}`.toLowerCase();
            }
            await db.customers.update(id, dataToUpdate);
        });
    }
    
    async deleteCustomer(id: number): Promise<void> {
        await db.transaction('rw', db.customers, db.sales, db.payments, async () => {
            const salesCount = await db.sales.where('customerId').equals(id).count();
            if (salesCount > 0) {
                throw new Error("Impossible de supprimer un client avec un historique de ventes.");
            }

            const customer = await db.customers.get(id);
            if (!customer) return;

            if (customer.outstandingBalance > 0) {
                throw new Error("Impossible de supprimer un client avec une dette existante.");
            }

            await db.customers.delete(id);
            await db.payments.where('customerId').equals(id).delete();
        });
    }

    // =================== Import / Export ===================
    async analyzeCustomerImport(data: any[]): Promise<ImportAnalysis> {
        const analysis: ImportAnalysis = { customersToAdd: [], customersToUpdate: [], skippedRows: [], errorRows: [], totalRows: data.length };
        const existingCustomers = await db.customers.toArray();
        const existingPhones = new Set(existingCustomers.map(c => c.phone).filter(Boolean));

        for (const row of data) {
            const phone = row.phone?.trim();
            if (!row.firstName || !row.lastName) {
                analysis.errorRows.push(row);
                continue;
            }
            const existingByPhone = phone ? existingCustomers.find(c => c.phone === phone) : null;
            if (existingByPhone) {
                analysis.customersToUpdate.push({ id: existingByPhone.id, ...row });
            } else {
                analysis.customersToAdd.push(row);
            }
        }
        return analysis;
    }

    async processCustomerImport(toAdd: any[], toUpdate: any[]): Promise<void> {
        const addPromises = toAdd.map(c => this.addCustomer(c));
        const updatePromises = toUpdate.map(c => this.updateCustomer(c.id, c));
        await Promise.all([...addPromises, ...updatePromises]);
    }
    
    async analyzeProductImport(data: any[]): Promise<ProductImportAnalysis> {
        const analysis: ProductImportAnalysis = { productsToAdd: [], productsToUpdate: [], skippedRows: [], errorRows: [], totalRows: data.length };
        const existingProducts = await db.products.toArray();
        const existingBarcodes = new Map<string, number>();
        existingProducts.forEach(p => p.barcodes?.forEach(b => existingBarcodes.set(b, p.id as number)));

        for (const row of data) {
            const name = row.name?.trim();
            if (!name) {
                analysis.errorRows.push(row);
                continue;
            }
            
            const barcode = row.barcodes?.trim();
            const existingByBarcode = barcode ? existingProducts.find(p => p.barcodes?.includes(barcode)) : null;
            
            if (existingByBarcode) {
                analysis.productsToUpdate.push({ ...row, id: existingByBarcode.id });
            } else {
                analysis.productsToAdd.push(row);
            }
        }
        return analysis;
    }

    async processProductImport(toAdd: any[], toUpdate: any[]): Promise<void> {
        const parseRow = (row: any) => ({
            name: row.name || 'Sans nom',
            category: row.category || 'Non classé',
            price: parseFloat(row.price) || 0,
            purchasePrice: parseFloat(row.purchasePrice) || 0,
            quantity: parseInt(row.quantity) || 0,
            minStockLevel: parseInt(row.minStockLevel) || 10,
            barcodes: row.barcodes ? [row.barcodes.trim()] : [],
        });

        await db.transaction('rw', db.products, async () => {
            const productsToAdd = toAdd.map(parseRow);
            await db.products.bulkAdd(productsToAdd as any);

            for (const p of toUpdate) {
                await this.updateProduct(p.id, parseRow(p));
            }
        });
    }

    async exportProductsToCSV(): Promise<string> {
        const products = await db.products.toArray();
        const dataForCSV = products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            purchasePrice: p.purchasePrice,
            quantity: p.quantity,
            minStockLevel: p.minStockLevel,
            barcodes: p.barcodes?.join(','),
            fournisseurId: p.fournisseurId,
            dateExpiration: p.dateExpiration ? format(p.dateExpiration, 'yyyy-MM-dd') : '',
            unite: p.unite,
        }));
        return Papa.unparse(dataForCSV);
    }
    
    // =================== Zakat ===================
    async getZakatData(): Promise<ZakatData> {
        const products = await db.products.toArray();
        const inventoryValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        
        const customers = await db.customers.toArray();
        const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

        return { inventoryValue, totalReceivables };
    }

    // =================== Bread ===================
    async getManualBreadClients(): Promise<BreadClient[]> {
        return await db.clients_pain.where('type_recurrence').equals('aucun').and(c => c.actif === true).toArray();
    }
    
    async addManualBreadOrder(clientId: number, date: string, quantity: number): Promise<BreadOrder> {
         const existingOrder = await db.commandes_pain.where({ client_pain_id: clientId, date }).first();
        if (existingOrder) {
            throw new Error("Une commande manuelle existe déjà pour ce client aujourd'hui.");
        }
        
        const order: BreadOrder = {
            client_pain_id: clientId,
            date,
            quantite: quantity,
            est_paye: false,
            est_livre: false,
            vente_id: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const id = await db.commandes_pain.add(order);
        return { ...order, id };
    }
    
    async updateBreadOrderQuantity(orderId: number, newQuantity: number): Promise<void> {
        await db.commandes_pain.where('id').equals(orderId).modify(order => {
            if (order.quantite_origine === undefined) {
                order.quantite_origine = order.quantite;
            }
            order.quantite = newQuantity;
            order.updatedAt = new Date();
        });
    }

    async updateBreadOrderDeliveryStatus(orderId: number, delivered: boolean): Promise<void> {
        await db.commandes_pain.update(orderId, { est_livre: delivered, updatedAt: new Date() });
    }
    
    async getBreadClients(): Promise<BreadClient[]> {
        return await db.clients_pain.orderBy('nom').toArray();
    }
    
    async addBreadClient(client: Omit<BreadClient, 'id'>): Promise<BreadClient> {
        const now = new Date();
        const newClient = { ...client, createdAt: now, updatedAt: now };
        const id = await db.clients_pain.add(newClient as BreadClient);
        return { ...newClient, id };
    }

    async updateBreadClient(id: number, data: Partial<BreadClient>): Promise<void> {
        await db.clients_pain.update(id, { ...data, updatedAt: new Date() });
    }

    async deleteBreadClient(id: number): Promise<void> {
        await db.transaction('rw', db.clients_pain, db.commandes_pain, async () => {
            await db.commandes_pain.where('client_pain_id').equals(id).delete();
            await db.clients_pain.delete(id);
        });
    }
    
    async checkIfBreadOrdersExist(date: string): Promise<boolean> {
        const count = await db.commandes_pain.where('date').equals(date).count();
        return count > 0;
    }
    
    async createDayOrders(date: string): Promise<void> {
        const weekDay = format(new Date(date.replace(/-/g, '/')), 'eeee').toLowerCase() as keyof NonNullable<BreadClient['jours_semaine']>;

        const dailyClients = await db.clients_pain
            .where('type_recurrence').equals('quotidien')
            .and(c => c.actif === true)
            .toArray();

        const specificDayClients = await db.clients_pain
            .where('type_recurrence').equals('jours_specifiques')
            .and(c => c.actif === true && c.jours_semaine?.[weekDay]?.actif === true)
            .toArray();

        const orders: Omit<BreadOrder, 'id'>[] = [];
        
        dailyClients.forEach(c => {
            if (c.quantite_defaut && c.quantite_defaut > 0) {
                orders.push({
                    client_pain_id: c.id!,
                    date,
                    quantite: c.quantite_defaut,
                    est_paye: false, est_livre: false, vente_id: null,
                    createdAt: new Date(), updatedAt: new Date(),
                });
            }
        });

        specificDayClients.forEach(c => {
            if (c.jours_semaine?.[weekDay].quantite && c.jours_semaine[weekDay].quantite > 0) {
                orders.push({
                    client_pain_id: c.id!,
                    date,
                    quantite: c.jours_semaine[weekDay].quantite,
                    est_paye: false, est_livre: false, vente_id: null,
                    createdAt: new Date(), updatedAt: new Date(),
                });
            }
        });

        if (orders.length > 0) {
            await db.commandes_pain.bulkAdd(orders as BreadOrder[]);
        }
    }
    
    async getBreadOrdersForDate(date: string): Promise<BreadOrderWithClient[]> {
        const orders = await db.commandes_pain.where('date').equals(date).toArray();
        const clientIds = [...new Set(orders.map(o => o.client_pain_id))];
        const clients = await db.clients_pain.bulkGet(clientIds);
        const clientMap = new Map(clients.map(c => c && [c.id, c]).filter(Boolean) as [number, BreadClient][]);

        return orders
            .map(order => ({
                ...order,
                client: clientMap.get(order.client_pain_id),
            }))
            .filter((order): order is BreadOrderWithClient => !!order.client)
            .sort((a,b) => a.client.nom.localeCompare(b.client.nom));
    }
    
    async convertBreadOrdersToSales(orderIds: number[], breadPrice: number): Promise<void> {
        const breadProduct = await db.products.where('name').equalsIgnoreCase('pain').first();
        if (!breadProduct) {
            throw new Error("Produit 'Pain' non trouvé. Veuillez le créer avant de continuer.");
        }
        if (!breadProduct.id || typeof breadProduct.id !== 'number') {
             throw new Error("L'ID du produit 'Pain' est invalide.");
        }

        await db.transaction('rw', db.commandes_pain, db.sales, db.customers, db.products, async () => {
            const orders = await db.commandes_pain.bulkGet(orderIds);
            
            for (const order of orders) {
                if (!order || order.vente_id) continue;
                
                const client = await db.clients_pain.get(order.client_pain_id);
                const customer = client ? await db.customers.where('searchName').equals(client.nom.toLowerCase()).first() : undefined;
                
                const saleItem: SaleItem = {
                    id: breadProduct.id!,
                    name: breadProduct.name,
                    price: breadPrice,
                    purchasePrice: breadProduct.purchasePrice,
                    quantity: order.quantite,
                };
                
                const total = saleItem.price * saleItem.quantity;
                
                const saleData: any = {
                    items: [saleItem],
                    subtotal: total,
                    total: total,
                    amountPaid: 0,
                    payments: [],
                    clientPainId: order.client_pain_id,
                    customerId: customer?.id,
                    customerName: customer?.searchName || client?.nom,
                    dueDate: customer?.settlementDay ? new Date(new Date().getTime() + customer.settlementDay * 86400000) : undefined,
                };
                
                const { saleId } = await this._processSale(saleData);
                await db.commandes_pain.update(order.id!, { vente_id: saleId, est_paye: true });
            }
        });
    }

    // =================== Sales ===================
    async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        return await db.sales.where('invoiceNumber').equals(invoiceNumber).first();
    }
    
    async getSales(params: { query?: string, from?: Date, to?: Date }): Promise<Sale[]> {
        let collection = db.sales.orderBy('createdAt').reverse();
        
        if (params.from && params.to) {
             collection = collection.filter(s => s.createdAt! >= params.from! && s.createdAt! <= params.to!);
        }
        if (params.query) {
            const q = params.query.toLowerCase();
            collection = collection.filter(s => s.invoiceNumber.toLowerCase().includes(q) || s.customerName?.toLowerCase().includes(q));
        }
        return await collection.toArray();
    }

    async addSale(saleData: any): Promise<number> {
        return db.transaction('rw', db.sales, db.products, db.customers, async () => {
            const { saleId, invoiceNumber } = await this._processSale(saleData);
            toast.success(`Vente #${invoiceNumber} finalisée.`);
            return saleId;
        });
    }

    private async _processSale(saleData: any): Promise<{ saleId: number, invoiceNumber: string }> {
        const now = new Date();
        
        const productIds = saleData.items
            .map((item: SaleItem) => item.id)
            .filter((id: any): id is number => typeof id === 'number');
        
        if (productIds.length > 0) {
            const productsInDb = await db.products.bulkGet(productIds);
            const productMap = new Map(productsInDb.filter((p): p is Product => !!p).map(p => [p.id!, p]));

            for (const item of saleData.items as SaleItem[]) {
                if (typeof item.id === 'number') {
                    const product = productMap.get(item.id);
                    if (!product || product.quantity < item.quantity) {
                        throw new Error(`Stock insuffisant pour "${item.name}". Disponible: ${product?.quantity ?? 0}, Demandé: ${item.quantity}`);
                    }
                }
            }
        }

        const today = format(now, 'yyMMdd');
        const lastSaleToday = await db.sales.where('createdAt').between(startOfDay(now), endOfDay(now), true, true).last();
        let sequence = 1;
        if (lastSaleToday) {
            const lastSequence = parseInt(lastSaleToday.invoiceNumber.split('-')[1], 10);
            if (!isNaN(lastSequence)) {
                sequence = lastSequence + 1;
            }
        }
        const invoiceNumber = `${today}-${String(sequence).padStart(4, '0')}`;
        
        const remainingBalance = saleData.total - saleData.amountPaid;
        let paymentStatus: Sale['paymentStatus'];
        if (remainingBalance <= 0) {
            paymentStatus = 'paid';
        } else if (saleData.amountPaid > 0) {
            paymentStatus = 'partial';
        } else {
            paymentStatus = 'unpaid';
        }

        const customer = saleData.customerId ? await db.customers.get(saleData.customerId) : undefined;
        const dueDate = customer?.settlementDay ? new Date(now.getTime() + customer.settlementDay * 86400000) : saleData.dueDate;

        const finalSaleData: Sale = {
            ...saleData,
            invoiceNumber,
            createdAt: now,
            updatedAt: now,
            paymentStatus,
            remainingBalance,
            dueDate,
        };

        const saleId = await db.sales.add(finalSaleData);

        for (const item of finalSaleData.items) {
            if (typeof item.id === 'number') {
                await db.products.where('id').equals(item.id).modify(p => { p.quantity -= item.quantity; });
            }
        }
        
        if (customer) {
            const newBalance = customer.outstandingBalance + finalSaleData.remainingBalance;
            const isOverLimit = customer.creditLimit != null ? newBalance > customer.creditLimit : false;
            
            let debtStatus: Customer['debtStatus'] = 'none';
            if (newBalance > 0) {
                const unpaidSales = await db.sales.where('customerId').equals(customer.id!).and(s => s.paymentStatus !== 'paid' || s.id === saleId).toArray();
                const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < now);
                debtStatus = isOverdue ? 'overdue' : 'due_soon';
            }
            
            await db.customers.update(customer.id!, {
                outstandingBalance: newBalance,
                totalSpent: customer.totalSpent + finalSaleData.total,
                lastActivityDate: now,
                isOverLimit,
                debtStatus,
            });
        }
        
        return { saleId, invoiceNumber };
    }
    
    async deleteSale(saleId: number): Promise<void> {
        await db.transaction('rw', db.sales, db.products, db.customers, async () => {
            const sale = await db.sales.get(saleId);
            if (!sale) return;

            for (const item of sale.items) {
                if (typeof item.id === 'number') {
                    await db.products.where('id').equals(item.id).modify(p => { p.quantity += item.quantity; });
                }
            }

            if (sale.customerId) {
                const customer = await db.customers.get(sale.customerId);
                if (customer) {
                    const newBalance = customer.outstandingBalance - sale.remainingBalance;
                    const newTotalSpent = customer.totalSpent - sale.total;
                    const isOverLimit = customer.creditLimit != null ? newBalance > customer.creditLimit : false;
                    
                    let debtStatus: Customer['debtStatus'] = 'none';
                    if (newBalance > 0) {
                        const unpaidSales = await db.sales.where('customerId').equals(customer.id!).and(s => s.id !== saleId && s.paymentStatus !== 'paid').toArray();
                        const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < new Date());
                        debtStatus = isOverdue ? 'overdue' : 'due_soon';
                    }

                    await db.customers.update(customer.id!, {
                        outstandingBalance: newBalance,
                        totalSpent: newTotalSpent,
                        isOverLimit,
                        debtStatus,
                    });
                }
            }

            await db.sales.delete(saleId);
        });
    }

    // =================== Payments ===================
    async addPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
        return db.transaction('rw', db.payments, db.customers, db.sales, async () => {
            const now = new Date();
            const newPayment = { ...paymentData, createdAt: now, updatedAt: now };
            const id = await db.payments.add(newPayment as Payment);

            const customer = await db.customers.get(paymentData.customerId);
            if (customer) {
                const newBalance = customer.outstandingBalance - paymentData.amount;
                const isOverLimit = customer.creditLimit != null ? newBalance > customer.creditLimit : false;
                
                let debtStatus: Customer['debtStatus'] = 'none';
                if (newBalance > 0) {
                    const unpaidSales = await db.sales.where('customerId').equals(customer.id!).and(s => s.paymentStatus !== 'paid').toArray();
                    const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < new Date());
                    debtStatus = isOverdue ? 'overdue' : 'due_soon';
                }

                await db.customers.update(customer.id!, {
                    outstandingBalance: newBalance,
                    lastActivityDate: now,
                    isOverLimit,
                    debtStatus,
                });
            }

            return { ...newPayment, id };
        });
    }

    // =================== Stock Intake ===================
    async addStockIntake(intakeData: any, items: StockIntakeItem[]): Promise<StockIntake> {
        return db.transaction('rw', db.stockIntakes, db.products, db.suppliers, async () => {
            const now = new Date();

            let supplier = await db.suppliers.where('name').equalsIgnoreCase(intakeData.supplierName).first();
            if (!supplier) {
                const supplierId = await db.suppliers.add({ name: intakeData.supplierName, balance: 0, createdAt: now, updatedAt: now });
                supplier = await db.suppliers.get(supplierId);
            }

            const processedItems = [];
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
                        fournisseurId: supplier!.id,
                        unite: 'Pièce',
                    };
                    productId = await db.products.add(newProduct as Product) as number;
                }

                await db.products.where('id').equals(productId!).modify(p => {
                    p.quantity += (item.quantity - item.quantityDamaged);
                    p.purchasePrice = item.purchasePrice;
                    if (item.isNew) p.price = item.price;
                    p.dateMajPrix = now;
                    if (supplier?.id) p.fournisseurId = supplier.id;
                });
                
                processedItems.push({
                    productId: productId,
                    productName: item.name,
                    quantityReceived: item.quantity,
                    quantityDamaged: item.quantityDamaged,
                    purchasePrice: item.purchasePrice,
                });
            }

            const totalValue = processedItems.reduce((acc, item) => acc + item.quantityReceived * item.purchasePrice, 0);

            const newIntake: StockIntake = {
                ...intakeData,
                supplierId: supplier!.id!,
                items: processedItems,
                totalValue,
                createdAt: now,
                updatedAt: now,
            };

            const id = await db.stockIntakes.add(newIntake);
            return { ...newIntake, id };
        });
    }

    async getStockIntakes(params: { query?: string, from?: Date, to?: Date }): Promise<StockIntake[]> {
        let collection = db.stockIntakes.orderBy('createdAt').reverse();
        if (params.from && params.to) {
            collection = collection.filter(i => i.createdAt! >= params.from! && i.createdAt! <= params.to!);
        }
        if (params.query) {
            const q = params.query.toLowerCase();
            collection = collection.filter(i => i.supplierName?.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q));
        }
        return await collection.toArray();
    }

    // =================== Returns ===================
    async getReturns(params: { query?: string, from?: Date, to?: Date }): Promise<ProductReturn[]> {
        let collection = db.returns.orderBy('createdAt').reverse();
        if (params.from && params.to) {
             collection = collection.filter(s => s.createdAt! >= params.from! && s.createdAt! <= params.to!);
        }
        if (params.query) {
            const q = params.query.toLowerCase();
            collection = collection.filter(s => s.originalInvoiceNumber.toLowerCase().includes(q) || s.customerName?.toLowerCase().includes(q));
        }
        return await collection.toArray();
    }
    
    async addReturn(returnData: Omit<ProductReturn, 'id'>): Promise<ProductReturn> {
        return db.transaction('rw', db.returns, db.products, db.customers, db.sales, async () => {
            const now = new Date();
            const newReturn: ProductReturn = {
                ...returnData,
                createdAt: now,
                updatedAt: now,
            };

            for (const item of newReturn.items) {
                if (item.wasRestocked && item.productId) {
                    await db.products.where('id').equals(item.productId).modify(p => { p.quantity += item.quantity; });
                }
            }

            if (newReturn.customerId) {
                const customer = await db.customers.get(newReturn.customerId);
                if (customer) {
                    const balanceChange = newReturn.amountRefunded - newReturn.totalReturnValue;
                    const newBalance = customer.outstandingBalance + balanceChange;
                    const isOverLimit = customer.creditLimit != null ? newBalance > customer.creditLimit : false;

                    let debtStatus: Customer['debtStatus'] = 'none';
                    if (newBalance > 0) {
                        const unpaidSales = await db.sales.where('customerId').equals(customer.id!).and(s => s.paymentStatus !== 'paid').toArray();
                        const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < now);
                        debtStatus = isOverdue ? 'overdue' : 'due_soon';
                    }

                    await db.customers.update(customer.id!, {
                        outstandingBalance: newBalance,
                        lastActivityDate: now,
                        isOverLimit,
                        debtStatus,
                    });
                }
            }

            const id = await db.returns.add(newReturn);
            return { ...newReturn, id };
        });
    }

    async deleteReturn(returnId: number): Promise<void> {
         await db.transaction('rw', db.returns, db.products, db.customers, db.sales, async () => {
            const pr = await db.returns.get(returnId);
            if (!pr) return;
            
            for (const item of pr.items) {
                if (item.wasRestocked && item.productId) {
                    await db.products.where('id').equals(item.productId).modify(p => { p.quantity -= item.quantity; });
                }
            }

            if (pr.customerId) {
                const customer = await db.customers.get(pr.customerId);
                if (customer) {
                    const balanceChange = pr.amountRefunded - pr.totalReturnValue;
                    const newBalance = customer.outstandingBalance - balanceChange;
                    const isOverLimit = customer.creditLimit != null ? newBalance > customer.creditLimit : false;
                    
                    let debtStatus: Customer['debtStatus'] = 'none';
                    if (newBalance > 0) {
                        const unpaidSales = await db.sales.where('customerId').equals(customer.id!).and(s => s.paymentStatus !== 'paid').toArray();
                        const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < new Date());
                        debtStatus = isOverdue ? 'overdue' : 'due_soon';
                    }

                    await db.customers.update(customer.id!, {
                        outstandingBalance: newBalance,
                        isOverLimit,
                        debtStatus,
                    });
                }
            }

            await db.returns.delete(returnId);
        });
    }

    // =================== Expenses ===================
    async getExpenses(params: { category?: string, from?: Date, to?: Date }): Promise<Expense[]> {
        let collection = db.expenses.orderBy('expenseDate').reverse();
        if (params.from && params.to) {
            collection = collection.filter(e => e.expenseDate >= params.from! && e.expenseDate <= params.to!);
        }
        if (params.category && params.category !== 'all') {
            collection = collection.filter(e => e.category === params.category);
        }
        return await collection.toArray();
    }
    
    async getExpenseCategories(): Promise<string[]> {
        const expenses = await db.expenses.toArray();
        const categories = new Set(expenses.map(e => e.category));
        return Array.from(categories).sort();
    }
    
    async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
        const now = new Date();
        const newExpense = { ...expense, createdAt: now, updatedAt: now };
        const id = await db.expenses.add(newExpense as Expense);
        return { ...newExpense, id };
    }

    async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id'>>): Promise<void> {
        await db.expenses.update(id, { ...expenseData, updatedAt: new Date() });
    }

    async deleteExpense(id: number): Promise<void> {
        await db.expenses.delete(id);
    }
    
    // =================== Costing ===================
    async applyNewPurchasePrices(costingItems: CostingItem[]): Promise<void> {
        const now = new Date();
        await db.transaction('rw', db.products, async () => {
            const productIds = costingItems.map(item => item.productId).filter((id): id is number => !!id);
            if (productIds.length === 0) return;

            const products = await db.products.bulkGet(productIds);
            const productMap = new Map(products.filter((p): p is Product => !!p).map(p => [p.id!, p]));
            
            const updates: { key: number, changes: Partial<Product> }[] = [];

            for (const item of costingItems) {
                if (item.productId) {
                    const product = productMap.get(item.productId);
                    if (product && product.purchasePrice !== item.finalCostPerUnit) {
                         updates.push({
                             key: item.productId,
                             changes: {
                                 purchasePrice: item.finalCostPerUnit,
                                 dateMajPrix: now,
                                 updatedAt: now
                             }
                         });
                    }
                }
            }
            
            if (updates.length > 0) {
                 await db.products.bulkUpdate(updates);
            }
        });
    }

    // =================== Dashboard ===================
    async getGlobalActivity(limit: number): Promise<GlobalActivityItem[]> {
        const sales = await db.sales.orderBy('createdAt').reverse().limit(limit).toArray();
        const intakes = await db.stockIntakes.orderBy('createdAt').reverse().limit(limit).toArray();
        const returns = await db.returns.orderBy('createdAt').reverse().limit(limit).toArray();
        const customers = await db.customers.orderBy('createdAt').reverse().limit(limit).toArray();
        const payments = await db.payments.orderBy('createdAt').reverse().limit(limit).toArray();

        const activities: GlobalActivityItem[] = [
            ...sales.map(s => ({ type: 'sale', date: s.createdAt!, id: s.id!, description: `Vente #${s.invoiceNumber}`, details: `Client: ${s.customerName || 'N/A'}`, amount: s.total, amountClass: 'text-primary' } as GlobalActivityItem)),
            ...intakes.map(i => ({ type: 'stock_intake', date: i.createdAt!, id: i.id!, description: `Réception de ${i.supplierName}`, details: `${i.items.length} article(s)`, amount: i.totalValue, amountClass: 'text-chart-secondary' } as GlobalActivityItem)),
            ...returns.map(r => ({ type: 'return', date: r.createdAt!, id: r.id!, description: `Retour sur facture #${r.originalInvoiceNumber}`, details: `Client: ${r.customerName || 'N/A'}`, amount: -r.totalReturnValue, amountClass: 'text-destructive' } as GlobalActivityItem)),
            ...customers.map(c => ({ type: 'customer', date: c.createdAt!, id: c.id!, description: `Nouveau client`, details: `${c.firstName} ${c.lastName}`, amount: undefined } as GlobalActivityItem)),
            ...payments.map(p => ({ type: 'payment', date: p.createdAt!, id: p.id!, description: `Paiement reçu`, details: `Client: ${p.customerName}`, amount: p.amount, amountClass: 'text-chart-quaternary' } as GlobalActivityItem)),
        ];

        return activities.sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
    }
    
    // =================== Backup / Restore ===================
    async exportData(): Promise<any> {
        const data: any = {};
        const tablesToExport = db.tables.filter(table => table.name !== 'carts');
        for (const table of tablesToExport) {
            data[table.name] = await table.toArray();
        }
        return data;
    }
    
    async restoreTables(data: any): Promise<void> {
        await db.transaction('rw', db.tables, async () => {
             const tablesToRestore = db.tables.filter(table => table.name !== 'carts');
            for (const table of tablesToRestore) {
                if (data[table.name]) {
                    await table.clear();
                    await table.bulkAdd(data[table.name]);
                }
            }
        });
    }

    async resetDatabase(): Promise<void> {
        await db.delete();
        await db.open();
    }
}

export const dataService = new DataService();
