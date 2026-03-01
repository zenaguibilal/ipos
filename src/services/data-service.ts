import { db } from '@/lib/database';
import { toast } from 'sonner';
import type { StockIntakeItem, Product, BreadOrder, CompanyProfile, ProductReturn, DailyBreadOrder, ReturnItem, Expense, Setting } from '@/lib/types';
import type { ImportAnalysis } from '@/components/customers/import-preview-dialog';

type TableName = 'products' | 'customers' | 'payments' | 'stockIntakes' | 'returns' | 'breadCustomers' | 'dailyBreadOrders' | 'companyProfile' | 'expenses' | 'settings';

class DataService {

  async save<T extends { id?: number | string }>(table: TableName, data: Omit<T, 'id'>): Promise<number | string> {
    return db.table(table).add(data as T);
  }

  async getAll<T>(table: TableName): Promise<T[]> {
    return db.table(table).toArray();
  }

  async getById<T>(table: TableName, id: number | string): Promise<T | undefined> {
    return db.table(table).get(id);
  }

  async update<T>(table: TableName, id: number | string, newData: Partial<T>): Promise<number> {
    return db.table(table).update(id, newData);
  }

  async remove(table: TableName, id: number | string): Promise<void> {
    await db.table(table).delete(id);
  }

  async getSetting(key: string): Promise<any> {
    const setting = await db.settings.get(key);
    return setting?.value;
  }

  async setSetting(key: string, value: any): Promise<string> {
      return db.settings.put({ id: key, value });
  }

  async recordReturn(returnData: {
    foundSale: any; // Type simplified as Sale is removed
    returnedItems: ReturnItem[]; 
    totalReturnValue: number; 
    amountRefunded: number; 
    notes: string;
  }): Promise<void> {
      return db.transaction('rw', db.products, db.returns, async () => {
        for (const item of returnData.returnedItems) {
            if (item.wasRestocked && item.productId) {
                const product = await db.products.get(item.productId);
                if (product) await db.products.update(item.productId, { quantity: product.quantity + item.quantity });
            }
        }
        const newReturn: Omit<ProductReturn, 'id'> = {
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
    
    return db.transaction('rw', db.customers, db.payments, async () => {
      for (const item of customersToUpdate) {
        const { existingCustomer, phone, settlementDay } = item;
        const customerId = existingCustomer.id;
        const updatePayload: any = {};
        if (phone && existingCustomer.phone !== phone) updatePayload.phone = phone;
        if (settlementDay !== undefined && existingCustomer.settlementDay !== settlementDay) updatePayload.settlementDay = settlementDay;
        if (Object.keys(updatePayload).length > 0) await db.customers.update(customerId, updatePayload);
        updatedCount++;
      }
      
      for (const item of customersToAdd) {
        const { firstName, lastName, phone, settlementDay } = item;
        await db.customers.add({ firstName, lastName, phone, settlementDay } as any);
        importedCount++;
      }
    }).then(() => ({ importedCount, updatedCount }));
  }

  // --- Bread-specific methods ---

  async handleBreadOrderStatusUpdate(params: {
      order: BreadOrder; field: 'isPaid' | 'isDelivered'; value: boolean; dateString: string; companyProfile?: CompanyProfile | null;
  }) {
      const { order, field, value, dateString, companyProfile } = params;
      const { breadPrice } = companyProfile || {};
      if (field === 'isPaid' && value && (!breadPrice || breadPrice <= 0)) throw new Error("Prix du pain non défini.");

      return db.transaction('rw', db.dailyBreadOrders, async () => {
        const todaysOrder = order.todaysOrder;
        const quantity = todaysOrder?.quantity ?? order.defaultOrderQuantity;
        
        if (todaysOrder?.id) {
            await db.dailyBreadOrders.update(todaysOrder.id, { [field]: value });
        } else {
            const newOrder: Omit<DailyBreadOrder, 'id'> = { 
                breadCustomerId: order.id, 
                customerName: order.name, 
                date: dateString, 
                quantity, 
                isPaid: field === 'isPaid' ? value : false, 
                isDelivered: field === 'isDelivered' ? value : false
            };
            await db.dailyBreadOrders.add(newOrder as DailyBreadOrder);
        }
    });
  }

  async bulkUpdateBreadOrders(params: {
      customers: BreadOrder[]; field: 'isPaid' | 'isDelivered'; value: boolean; dateString: string; companyProfile?: CompanyProfile | null;
  }) {
      const { customers, field, value, dateString, companyProfile } = params;
      const { breadPrice } = companyProfile || {};
      if (field === 'isPaid' && value && (!breadPrice || breadPrice <= 0)) throw new Error("Prix du pain non défini.");

      return db.transaction('rw', db.dailyBreadOrders, async () => {
        for (const customer of customers) {
            const todaysOrder = customer.todaysOrder;
            const quantity = todaysOrder?.quantity ?? customer.defaultOrderQuantity;

            if (todaysOrder?.id) {
                await db.dailyBreadOrders.update(todaysOrder.id, { [field]: value });
            } else {
                 const newOrder: Omit<DailyBreadOrder, 'id'> = { 
                    breadCustomerId: customer.id, 
                    customerName: customer.name, 
                    date: dateString, 
                    quantity, 
                    isPaid: field === 'isPaid' ? value : false, 
                    isDelivered: field === 'isDelivered' ? value : false
                };
                await db.dailyBreadOrders.add(newOrder as DailyBreadOrder);
            }
        }
    });
  }

  async resetBreadOrdersForDay(dateString: string): Promise<void> {
    return db.transaction('rw', db.dailyBreadOrders, async () => {
      const ordersToDelete = await db.dailyBreadOrders.where('date').equals(dateString).toArray();
      const orderIds = ordersToDelete.map(o => o.id!);
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
      return db.transaction('rw', db.breadCustomers, db.dailyBreadOrders, async () => {
        const dailyOrders = await db.dailyBreadOrders.where('breadCustomerId').equals(customerId).toArray();
        const dailyOrderIds = dailyOrders.map(o => o.id!);

        if (dailyOrderIds.length > 0) await db.dailyBreadOrders.bulkDelete(dailyOrderIds);
        await db.breadCustomers.delete(customerId);
    });
  }

  async resetDatabase(): Promise<void> {
    const tablesToClear = db.tables.filter(t => t.name !== 'settings');
    await Promise.all(tablesToClear.map(table => table.clear()));
    await db.companyProfile.add({ id: 1, companyName: "Mon Magasin", country: "France" } as CompanyProfile);
  }

  async exportData(): Promise<string> {
    const data: { [key: string]: any[] } = {};
    const tablesToExport = db.tables;
    for (const table of tablesToExport) {
      data[table.name] = await table.toArray();
    }
    return JSON.stringify(data, (key, value) => {
      if (value instanceof Date) return value.toISOString();
      return value;
    }, 2);
  }

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json);
    const tablesToImport = db.tables;
    return db.transaction('rw', ...tablesToImport, async () => {
      await Promise.all(tablesToImport.map(table => table.clear()));
      for (const tableName in data) {
        if (db.table(tableName)) {
          const tableData = data[tableName].map((item: any) => {
            // Convert ISO strings back to Date objects
            for(const key in item) {
                if (typeof item[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(item[key])) {
                    item[key] = new Date(item[key]);
                }
            }
            return item;
          });
          await db.table(tableName).bulkAdd(tableData);
        }
      }
    });
  }
}

export const dataService = new DataService();
