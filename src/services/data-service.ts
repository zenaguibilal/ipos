import { db } from '@/lib/database';
import { toast } from 'sonner';
import type { SaleItem, SalePayment, Sale, StockIntakeItem, Product, BreadOrder, CompanyProfile, ProductReturn, DailyBreadOrder, ReturnItem, Expense } from '@/lib/types';
import type { ImportAnalysis } from '@/components/customers/import-preview-dialog';

type TableName = 'products' | 'customers' | 'sales' | 'payments' | 'stockIntakes' | 'returns' | 'breadCustomers' | 'dailyBreadOrders' | 'companyProfile' | 'carts' | 'expenses';

class DataService {

  async save<T extends { id?: number }>(table: TableName, data: Omit<T, 'id'>): Promise<number> {
    return db.table(table).add(data as T);
  }

  async getAll<T>(table: TableName): Promise<T[]> {
    return db.table(table).toArray();
  }

  async getById<T>(table: TableName, id: number): Promise<T | undefined> {
    return db.table(table).get(id);
  }

  async update<T>(table: TableName, id: number, newData: Partial<T>): Promise<number> {
    return db.table(table).update(id, newData);
  }

  async remove(table: TableName, id: number): Promise<void> {
    await db.table(table).delete(id);
  }

  async finalizeSale(saleData: {
    items: SaleItem[]; subtotal: number; discountType?: 'fixed' | 'percentage';
    discountAmount?: number; total: number; amountPaid: number;
    payments: SalePayment[]; customerId?: number; customerName?: string;
  }): Promise<void> {
    return db.transaction('rw', db.products, db.sales, async () => {
      for (const item of saleData.items) {
        if (!String(item.id).startsWith('custom-')) {
          const productId = Number(item.id);
          const product = await db.products.get(productId);
          if (product) {
            if (product.quantity < item.quantity) throw new Error(`Stock insuffisant pour ${product.name}.`);
            await db.products.update(productId, { quantity: product.quantity - item.quantity });
          }
        }
      }
      const newSale: Omit<Sale, 'id'> = {
        ...saleData,
        invoiceNumber: `INV-${Date.now()}`,
        remainingBalance: saleData.total - saleData.amountPaid,
        paymentStatus: saleData.total - saleData.amountPaid <= 0.01 ? 'paid' : saleData.amountPaid > 0 ? 'partial' : 'unpaid',
      };
      await db.sales.add(newSale as Sale);
    });
  }

  async cancelSale(saleId: number): Promise<void> {
    return db.transaction('rw', db.sales, db.products, async () => {
        const sale = await db.sales.get(saleId);
        if (!sale) throw new Error("Vente non trouvée.");

        for (const item of sale.items) {
            if (!String(item.id).startsWith('custom-')) {
                const product = await db.products.get(Number(item.id));
                if (product) await db.products.update(Number(item.id), { quantity: product.quantity + item.quantity });
            }
        }
        await db.sales.delete(saleId);
    });
  }

  async recordReturn(returnData: {
    foundSale: Sale; returnedItems: ReturnItem[]; totalReturnValue: number; amountRefunded: number; notes: string;
  }): Promise<void> {
      return db.transaction('rw', db.products, db.returns, async () => {
        for (const item of returnData.returnedItems) {
            if (item.wasRestocked && item.productId) {
                const product = await db.products.get(item.productId);
                if (product) await db.products.update(item.productId, { quantity: product.quantity + item.quantity });
            }
        }
        const newReturn: Omit<ProductReturn, 'id'> = {
            originalSaleId: returnData.foundSale.id,
            originalInvoiceNumber: returnData.foundSale.invoiceNumber,
            items: returnData.returnedItems,
            totalReturnValue: returnData.totalReturnValue,
            amountRefunded: returnData.amountRefunded,
            customerId: returnData.foundSale.customerId,
            customerName: returnData.foundSale.customerName,
            notes: returnData.notes,
        };
        await db.returns.add(newReturn as ProductReturn);
    });
  }
  
  async cancelReturn(returnId: number): Promise<void> {
      return db.transaction('rw', db.returns, db.products, async () => {
        const returnDoc = await db.returns.get(returnId);
        if (!returnDoc) throw new Error("Retour non trouvé.");
        
        for (const item of returnDoc.items) {
            if (item.wasRestocked && item.productId) {
                const product = await db.products.get(item.productId);
                if (product) await db.products.update(item.productId, { quantity: Math.max(0, product.quantity - item.quantity) });
            }
        }
        await db.returns.delete(returnId);
    });
  }

  async recordStockIntake(intakeData: {
    supplier: string; invoiceNumber: string; invoiceDate: Date; items: StockIntakeItem[]; totalValue: number;
  }): Promise<void> {
      return db.transaction('rw', db.products, db.stockIntakes, async () => {
        const intakeItemsForDb = [];
        for (const item of intakeData.items) {
            if (!item.name || item.quantity <= 0 || item.purchasePrice < 0 || item.price < 0) throw new Error(`Ligne invalide pour: ${item.name || 'inconnu'}.`);
            
            let productId = item.productId;
            if (item.isNew) {
                productId = await db.products.add({
                    name: item.name, category: item.category, price: item.price,
                    purchasePrice: item.purchasePrice, quantity: item.quantity,
                    minStockLevel: 1, barcodes: item.barcodes, imageUrl: '',
                } as Product);
            } else if (productId) {
                const product = await db.products.get(productId);
                if (!product) throw new Error(`Produit avec ID ${productId} non trouvé.`);
                await db.products.update(productId, {
                    quantity: product.quantity + item.quantity,
                    purchasePrice: item.purchasePrice, price: item.price,
                });
            }
            intakeItemsForDb.push({ productId, productName: item.name, quantityReceived: item.quantity, purchasePrice: item.purchasePrice });
        }
        await db.stockIntakes.add({ ...intakeData, items: intakeItemsForDb });
    });
  }

  async importCustomers(analysis: ImportAnalysis) {
    let importedCount = 0;
    let updatedCount = 0;
    const { customersToAdd, customersToUpdate } = analysis;
    
    return db.transaction('rw', db.customers, db.sales, db.payments, async () => {
      for (const item of customersToUpdate) {
        const { existingCustomer, phone, settlementDay, debtAmount } = item;
        const customerId = existingCustomer.id;
        const updatePayload: any = {};
        if (phone && existingCustomer.phone !== phone) updatePayload.phone = phone;
        if (settlementDay !== undefined && existingCustomer.settlementDay !== settlementDay) updatePayload.settlementDay = settlementDay;
        if (Object.keys(updatePayload).length > 0) await db.customers.update(customerId, updatePayload);
        
        const debtDifference = debtAmount !== null ? debtAmount - existingCustomer.outstandingBalance : null;
        if (debtAmount !== null && debtDifference !== null && Math.abs(debtDifference) > 0.01) {
          if (debtDifference > 0) {
            await db.sales.add({ invoiceNumber: `DEBT-ADJ-${Date.now()}`, items: [{ id: 'debt-adjustment', name: 'Ajustement de solde (Import)', price: debtDifference, purchasePrice: 0, quantity: 1 }], subtotal: debtDifference, total: debtDifference, amountPaid: 0, remainingBalance: debtDifference, paymentStatus: 'unpaid', payments: [], customerId });
          } else {
            await db.payments.add({ customerId, amount: -debtDifference, customerName: `${existingCustomer.firstName} ${existingCustomer.lastName}` });
          }
        }
        updatedCount++;
      }
      
      for (const item of customersToAdd) {
        const { firstName, lastName, phone, settlementDay, debtAmount } = item;
        const newCustomerId = await db.customers.add({ firstName, lastName, phone, settlementDay } as any);
        if (debtAmount !== null && debtAmount > 0) {
          await db.sales.add({ invoiceNumber: `DEBT-IMPORT-${Date.now()}`, items: [{ id: 'imported-debt', name: 'Solde initial importé', price: debtAmount, purchasePrice: 0, quantity: 1 }], subtotal: debtAmount, total: debtAmount, amountPaid: 0, remainingBalance: debtAmount, paymentStatus: 'unpaid', payments: [], customerId: newCustomerId, customerName: `${firstName} ${lastName}` });
        }
        importedCount++;
      }
    }).then(() => ({ importedCount, updatedCount }));
  }

  // --- Bread-specific methods ---

  async handleBreadOrderStatusUpdate(params: {
      order: BreadOrder; field: 'isPaid' | 'isDelivered'; value: boolean; dateString: string; companyProfile?: CompanyProfile | null;
  }) {
      const { order, field, value, dateString, companyProfile } = params;
      const { breadPrice, breadPurchasePrice } = companyProfile || {};
      if (field === 'isPaid' && value && (!breadPrice || breadPrice <= 0)) throw new Error("Prix du pain non défini.");

      return db.transaction('rw', db.dailyBreadOrders, db.sales, async () => {
        const todaysOrder = order.todaysOrder;
        
        if (field === 'isPaid') {
          if (value) { // Mark as paid
            if (todaysOrder?.isPaid) return;
            const quantity = todaysOrder?.quantity ?? order.defaultOrderQuantity;
            const total = quantity * breadPrice!;
            const newSaleId = await db.sales.add({
              invoiceNumber: `PAIN-${Date.now()}`,
              items: [{ id: 'BREAD_PRODUCT', name: 'Pain', price: breadPrice!, purchasePrice: breadPurchasePrice ?? 0, quantity }],
              subtotal: total, total, amountPaid: total, remainingBalance: 0, paymentStatus: 'paid',
              payments: [{ method: 'cash', amount: total }], customerId: order.id, customerName: order.name, breadOrderDate: dateString,
            } as Sale);

            if (todaysOrder?.id) {
              await db.dailyBreadOrders.update(todaysOrder.id, { isPaid: true, saleId: newSaleId });
            } else {
              await db.dailyBreadOrders.add({ breadCustomerId: order.id, customerName: order.name, date: dateString, quantity, isPaid: true, isDelivered: false, saleId: newSaleId } as DailyBreadOrder);
            }
          } else { // Mark as unpaid
            if (!todaysOrder?.isPaid || !todaysOrder.id) return;
            if (todaysOrder.saleId) await db.sales.delete(todaysOrder.saleId);
            await db.dailyBreadOrders.update(todaysOrder.id, { isPaid: false, saleId: undefined });
          }
        } else { // Update delivery status
            const quantity = todaysOrder?.quantity ?? order.defaultOrderQuantity;
            if (todaysOrder?.id) {
                await db.dailyBreadOrders.update(todaysOrder.id, { isDelivered: value });
            } else {
                await db.dailyBreadOrders.add({ breadCustomerId: order.id, customerName: order.name, date: dateString, quantity, isPaid: false, isDelivered: value } as DailyBreadOrder);
            }
        }
    });
  }

  async bulkUpdateBreadOrders(params: {
      customers: BreadOrder[]; field: 'isPaid' | 'isDelivered'; value: boolean; dateString: string; companyProfile?: CompanyProfile | null;
  }) {
      const { customers, field, value, dateString, companyProfile } = params;
      const { breadPrice, breadPurchasePrice } = companyProfile || {};
      if (field === 'isPaid' && value && (!breadPrice || breadPrice <= 0)) throw new Error("Prix du pain non défini.");

      return db.transaction('rw', db.dailyBreadOrders, db.sales, async () => {
        for (const customer of customers) {
            const todaysOrder = customer.todaysOrder;
            const quantity = todaysOrder?.quantity ?? customer.defaultOrderQuantity;

            if (field === 'isPaid') {
                if (value) { // Mark as paid
                    if (todaysOrder?.isPaid) continue;
                    const total = quantity * breadPrice!;
                    const newSaleId = await db.sales.add({
                        invoiceNumber: `PAIN-${Date.now()}-${customer.id}`, items: [{ id: 'BREAD_PRODUCT', name: 'Pain', price: breadPrice!, purchasePrice: breadPurchasePrice ?? 0, quantity }],
                        subtotal: total, total, amountPaid: total, remainingBalance: 0, paymentStatus: 'paid', payments: [{ method: 'cash', amount: total }],
                        customerId: customer.id, customerName: customer.name, breadOrderDate: dateString,
                    } as Sale);
                    if (todaysOrder?.id) {
                        await db.dailyBreadOrders.update(todaysOrder.id, { isPaid: true, saleId: newSaleId });
                    } else {
                        await db.dailyBreadOrders.add({ breadCustomerId: customer.id, customerName: customer.name, date: dateString, quantity, isPaid: true, isDelivered: false, saleId: newSaleId } as DailyBreadOrder);
                    }
                } else { // Mark as unpaid
                    if (!todaysOrder?.isPaid || !todaysOrder.id) continue;
                    if (todaysOrder.saleId) await db.sales.delete(todaysOrder.saleId);
                    await db.dailyBreadOrders.update(todaysOrder.id, { isPaid: false, saleId: undefined });
                }
            } else { // Update delivery
                if (todaysOrder?.id) {
                    await db.dailyBreadOrders.update(todaysOrder.id, { isDelivered: value });
                } else {
                    await db.dailyBreadOrders.add({ breadCustomerId: customer.id, customerName: customer.name, date: dateString, quantity, isPaid: false, isDelivered: value } as DailyBreadOrder);
                }
            }
        }
    });
  }

  async resetBreadOrdersForDay(dateString: string): Promise<void> {
    return db.transaction('rw', db.dailyBreadOrders, db.sales, async () => {
      const ordersToDelete = await db.dailyBreadOrders.where('date').equals(dateString).toArray();
      const orderIds = ordersToDelete.map(o => o.id!);
      const saleIds = ordersToDelete.map(o => o.saleId).filter((id): id is number => !!id);
      
      if (saleIds.length > 0) await db.sales.bulkDelete(saleIds);
      if (orderIds.length > 0) await db.dailyBreadOrders.bulkDelete(orderIds);
    });
  }

  async updateDailyBreadOrderQuantity(order: BreadOrder, quantity: number, dateString: string) {
      if (order.todaysOrder?.id) {
          return db.dailyBreadOrders.update(order.todaysOrder.id, { quantity });
      }
      return db.dailyBreadOrders.add({
          breadCustomerId: order.id, customerName: order.name, quantity, date: dateString,
          isPaid: false, isDelivered: false,
      } as DailyBreadOrder);
  }

  async deleteBreadCustomer(customerId: number): Promise<void> {
      return db.transaction('rw', db.breadCustomers, db.dailyBreadOrders, db.sales, async () => {
        const dailyOrders = await db.dailyBreadOrders.where('breadCustomerId').equals(customerId).toArray();
        const dailyOrderIds = dailyOrders.map(o => o.id!);
        const saleIds = dailyOrders.map(o => o.saleId).filter((id): id is number => !!id);

        if (saleIds.length > 0) await db.sales.bulkDelete(saleIds);
        if (dailyOrderIds.length > 0) await db.dailyBreadOrders.bulkDelete(dailyOrderIds);
        await db.breadCustomers.delete(customerId);
    });
  }

  async resetDatabase(): Promise<void> {
    await Promise.all(db.tables.map(table => table.clear()));
    await db.companyProfile.add({ id: 1, companyName: "Mon Magasin", country: "France" } as CompanyProfile);
  }

  async exportData(): Promise<string> {
    const data: { [key: string]: any[] } = {};
    for (const table of db.tables) {
      data[table.name] = await table.toArray();
    }
    return JSON.stringify(data, (key, value) => {
      if (value instanceof Date) return value.toISOString();
      return value;
    }, 2);
  }

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json);
    return db.transaction('rw', ...db.tables, async () => {
      await Promise.all(db.tables.map(table => table.clear()));
      for (const tableName in data) {
        if (db.table(tableName)) {
          const tableData = data[tableName].map((item: any) => {
            // Convert ISO strings back to Date objects
            for(const key in item) {
                if (typeof item[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(item[key])) {
                    item[key] = new Date(item[key]);
                }
            }
            // Remove primary key to let Dexie auto-generate it
            delete item.id; 
            return item;
          });
          await db.table(tableName).bulkAdd(tableData);
        }
      }
    });
  }
}

export const dataService = new DataService();
