// This service will be populated in subsequent steps.
// For now, it establishes the architectural layer.
// All database write operations MUST go through this service
// and be wrapped in a transaction.

import { db } from '@/lib/database';
import type { Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, DailyBreadOrder, BreadOrder, BreadCustomer, SaleItem, SalePayment, StockIntakeItem, ReturnItem } from '@/lib/types';
import { toast } from 'sonner';

type TableName = 'products' | 'customers' | 'sales' | 'payments' | 'stockIntakes' | 'returns' | 'breadCustomers' | 'dailyBreadOrders' | 'companyProfile' | 'carts' | 'expenses' | 'settings';

class DataService {
  // Generic write methods (transaction-wrapped)
  private async saveData<T>(table: TableName, data: T): Promise<number | string> {
      return db.transaction('rw', db.table(table), () => {
          return db.table(table).put(data);
      });
  }

  // Generic Readers
  async getAll<T>(table: TableName): Promise<T[]> {
    return db.table(table).toArray();
  }

  async getById<T>(table: TableName, id: number | string): Promise<T | undefined> {
    return db.table(table).get(id);
  }

   // Placeholder for complex transactional logic
  async addSale(saleData: any): Promise<number> {
    return db.transaction('rw', db.sales, db.products, db.customers, async () => {
      // 1. Update product stock
      // 2. Create sale record
      // 3. Update customer balance
      toast.info("addSale not fully implemented.");
      const id = await db.sales.add(saleData);
      return id;
    });
  }
}

export const dataService = new DataService();
