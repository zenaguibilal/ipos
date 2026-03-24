'use client';

// This file has been stubbed out because Dexie.js was removed.
// The application's data persistence functionality has been disabled.

import type { Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, InventoryLog, StockIntakeItem, ZakatData, CostingItem, Draft, Supplier, ImportAnalysis, BreadClient, BreadOrder, BreadOrderWithClient, ProductImportAnalysis, GlobalActivityItem, DashboardData, DB } from '@/lib/types';
import { toast } from 'sonner';

class DataService {

  notify() {
      toast.error("Fonctionnalité désactivée", { description: "La base de données a été supprimée de l'application." });
  }

  // Generic methods
  async getAll<T>(table: keyof DB): Promise<T[]> {
    this.notify();
    return [];
  }

  async getById<T>(table: keyof DB, id: any): Promise<T | undefined> {
    this.notify();
    return undefined;
  }
  
  // Settings
  async getSetting(id: string): Promise<Setting | undefined> { return undefined; }
  async setSetting(id: string, value: any): Promise<void> { this.notify(); }

  // Company Profile
  async getCompanyProfile(): Promise<CompanyProfile | null> { return { id: 1 }; }
  async updateCompanyProfile(profileData: Partial<Omit<CompanyProfile, 'id'>>): Promise<void> { this.notify(); }
  
  // Cart
  async getCart(id: string): Promise<Cart | undefined> { return undefined; }
  async saveCart(cart: Cart): Promise<string> { this.notify(); return cart.id; }
  async deleteCart(id: string): Promise<void> { this.notify(); }
  async addProductToCart(cartId: string, product: Product, quantity: number): Promise<void> { this.notify(); }
  async updateCartItemQuantity(cartId: string, itemId: string | number, newQuantity: number): Promise<{capped: boolean, maxQuantity?: number}> { this.notify(); return {capped: false}; }
  async removeCartItem(cartId: string, itemId: string | number): Promise<void> { this.notify(); }
  async clearCart(cartId: string): Promise<void> { this.notify(); }
  async setCartCustomer(cartId: string, customer: Customer | null): Promise<void> { this.notify(); }
  async setCartDiscount(discount: { type: 'fixed' | 'percentage'; value: number }): Promise<void> { this.notify(); }
  async removeFlashFromCartItems(cartId: string): Promise<void> { }

  // Product
  async getProductByBarcode(barcode: string): Promise<Product | undefined> { this.notify(); return undefined; }
  async addProduct(productData: Omit<Product, 'id'>): Promise<Product> { this.notify(); throw new Error("Database removed."); }
  async updateProduct(id: number, productData: Partial<Omit<Product, 'id'>>): Promise<void> { this.notify(); }
  async deleteProduct(id: number): Promise<void> { this.notify(); }
  async deleteProducts(ids: number[]): Promise<void> { this.notify(); }
  async getProducts(params: any): Promise<Product[]> { return []; }
  async getProductsByIds(ids: number[]): Promise<Product[]> { return []; }
  async getProductCategories(): Promise<string[]> { return []; }
  async getSuppliers(): Promise<Supplier[]> { return []; }

  // Customer
  async getCustomerById(id: number): Promise<Customer | undefined> { this.notify(); return undefined; }
  async getCustomerActivity(customerId: number): Promise<(Sale | Payment | ProductReturn)[]> { return []; }
  async getCustomerStatementData(customerId: number): Promise<{ customer: Customer, unpaidSales: Sale[]}> { this.notify(); throw new Error("Database removed."); }
  async getCustomers(params: any): Promise<Customer[]> { return []; }
  async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<Customer> { this.notify(); throw new Error("Database removed."); }
  async updateCustomer(id: number, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> { this.notify(); }
  async deleteCustomer(id: number): Promise<void> { this.notify(); }

  // Import/Export
  async analyzeCustomerImport(data: any[]): Promise<ImportAnalysis> { this.notify(); return { customersToAdd: [], customersToUpdate: [], skippedRows: [], errorRows: data, totalRows: data.length }; }
  async processCustomerImport(toAdd: any[], toUpdate: any[]): Promise<void> { this.notify(); }
  async analyzeProductImport(data: any[]): Promise<ProductImportAnalysis> { this.notify(); return { productsToAdd: [], productsToUpdate: [], skippedRows: [], errorRows: data, totalRows: data.length }; }
  async processProductImport(toAdd: any[], toUpdate: any[]): Promise<void> { this.notify(); }
  async exportProductsToCSV(): Promise<string> { this.notify(); return ""; }
    
  // Zakat
  async getZakatData(): Promise<ZakatData> { return { inventoryValue: 0, totalReceivables: 0 }; }
  
  // Bread
  async getBreadClients(): Promise<BreadClient[]> { return []; }
  async addBreadClient(client: Omit<BreadClient, 'id'>): Promise<BreadClient> { this.notify(); throw new Error("Database removed."); }
  async updateBreadClient(id: number, data: Partial<BreadClient>): Promise<void> { this.notify(); }
  async deleteBreadClient(id: number): Promise<void> { this.notify(); }
  async getManualBreadClients(): Promise<BreadClient[]> { return []; }
  async addManualBreadOrder(clientId: number, date: string, quantity: number): Promise<BreadOrder> { this.notify(); throw new Error("Database removed."); }
  async updateBreadOrderQuantity(orderId: number, newQuantity: number): Promise<void> { this.notify(); }
  async updateBreadOrderDeliveryStatus(orderId: number, delivered: boolean): Promise<void> { this.notify(); }
  async checkIfBreadOrdersExist(date: string): Promise<boolean> { return true; } // prevent creating new ones
  async createDayOrders(date: string): Promise<void> { }
  async getBreadOrdersForDate(date: string): Promise<BreadOrderWithClient[]> { return []; }
  async convertBreadOrdersToSales(orderIds: number[], breadPrice: number): Promise<void> { this.notify(); }
  
  // Sales
  async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> { this.notify(); return undefined; }
  async getSales(params: any): Promise<Sale[]> { return []; }
  async addSale(saleData: any): Promise<Sale> { this.notify(); throw new Error("Database removed."); }
  async deleteSale(saleId: number): Promise<void> { this.notify(); }
  
  // Payments
  async addPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> { this.notify(); throw new Error("Database removed."); }
    
  // Drafts
  async getDrafts(): Promise<Draft[]> { return []; }
  async saveDraft(cart: Cart, notes?: string): Promise<Draft> { this.notify(); throw new Error("Database removed."); }
  async deleteDraft(id: number): Promise<void> { this.notify(); }
  async getDraftAndClear(draftId: number): Promise<Omit<Draft, 'id' | 'createdAt' | 'updatedAt'> | null> { this.notify(); return null; }
  async loadDraftContentToCart(cartId: string, draftContent: any): Promise<void> { this.notify(); }
    
  // Stock Intake
  async addStockIntake(intakeData: any, items: StockIntakeItem[]): Promise<StockIntake> { this.notify(); throw new Error("Database removed."); }
  async getStockIntakes(params: any): Promise<StockIntake[]> { return []; }
    
  // Returns
  async getReturns(params: any): Promise<ProductReturn[]> { return []; }
  async addReturn(returnData: Omit<ProductReturn, 'id'>): Promise<ProductReturn> { this.notify(); throw new Error("Database removed."); }
  async deleteReturn(returnId: number): Promise<void> { this.notify(); }
    
  // Expenses
  async getExpenses(params: any): Promise<Expense[]> { return []; }
  async getExpenseCategories(): Promise<string[]> { return []; }
  async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> { this.notify(); throw new Error("Database removed."); }
  async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id'>>): Promise<void> { this.notify(); }
  async deleteExpense(id: number): Promise<void> { this.notify(); }
    
  // Costing
  async applyNewPurchasePrices(costingItems: CostingItem[]): Promise<void> { this.notify(); }
    
  // Backup & Restore
  async exportData(): Promise<string> { this.notify(); return "{}"; }
  async restoreTables(backupFile: any, tablesToRestore: string[], onProgress: (progress: any) => void): Promise<void> { this.notify(); }
  async resetDatabase(): Promise<void> { this.notify(); }
    
  // Dashboard
  async getDashboardData(from: Date, to: Date): Promise<DashboardData | undefined> {
    this.notify();
    const stats = { totalRevenue: 0, totalProfit: 0, salesCount: 0, inventoryValue: 0, totalExpenses: 0 };
    return {
        stats: stats, sales: [], expenses: [], topProducts: [], topCustomers: [], lowStockProducts: [], recentActivity: [],
    };
  }
    
  async getGlobalActivity(limit: number): Promise<GlobalActivityItem[]> { return []; }
}

export const dataService = new DataService();
