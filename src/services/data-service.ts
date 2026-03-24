
'use client';

// This file has been stubbed out because Dexie.js was removed.
// The application's data persistence functionality has been disabled.

import type { Product, Sale, StockIntake, ProductReturn, Expense, Cart, Customer, Payment, CompanyProfile, Setting, InventoryLog, StockIntakeItem, ZakatData, CostingItem, Draft, Supplier, ImportAnalysis, BreadClient, BreadOrder, BreadOrderWithClient, ProductImportAnalysis, GlobalActivityItem, DashboardData, DB } from '@/lib/types';

class DataService {

  // Generic methods
  async getAll<T>(table: keyof DB): Promise<T[]> {
    return [];
  }

  async getById<T>(table: keyof DB, id: any): Promise<T | undefined> {
    return undefined;
  }
  
  // Settings
  async getSetting(id: string): Promise<Setting | undefined> { return undefined; }
  async setSetting(id: string, value: any): Promise<void> { }

  // Company Profile
  async getCompanyProfile(): Promise<CompanyProfile | null> { return { id: 1 }; }
  async updateCompanyProfile(profileData: Partial<Omit<CompanyProfile, 'id'>>): Promise<void> { }
  
  // Cart
  async getCart(id: string): Promise<Cart | undefined> { return undefined; }
  async saveCart(cart: Cart): Promise<string> { return cart.id; }
  async deleteCart(id: string): Promise<void> { }
  async addProductToCart(cartId: string, product: Product, quantity: number): Promise<void> { }
  async updateCartItemQuantity(cartId: string, itemId: string | number, newQuantity: number): Promise<{capped: boolean, maxQuantity?: number}> { return {capped: false}; }
  async removeCartItem(cartId: string, itemId: string | number): Promise<void> { }
  async clearCart(cartId: string): Promise<void> { }
  async setCartCustomer(cartId: string, customer: Customer | null): Promise<void> { }
  async setCartDiscount(discount: { type: 'fixed' | 'percentage'; value: number }): Promise<void> { }
  async removeFlashFromCartItems(cartId: string): Promise<void> { }

  // Product
  async getProductByBarcode(barcode: string): Promise<Product | undefined> { return undefined; }
  async addProduct(productData: Omit<Product, 'id'>): Promise<Product> { throw new Error("Fonctionnalité de base de données désactivée."); }
  async updateProduct(id: number, productData: Partial<Omit<Product, 'id'>>): Promise<void> { }
  async deleteProduct(id: number): Promise<void> { }
  async deleteProducts(ids: number[]): Promise<void> { }
  async getProducts(params: any): Promise<Product[]> { return []; }
  async getProductsByIds(ids: number[]): Promise<Product[]> { return []; }
  async getProductCategories(): Promise<string[]> { return []; }
  async getSuppliers(): Promise<Supplier[]> { return []; }

  // Customer
  async getCustomerById(id: number): Promise<Customer | undefined> { return undefined; }
  async getCustomerActivity(customerId: number): Promise<(Sale | Payment | ProductReturn)[]> { return []; }
  async getCustomerStatementData(customerId: number): Promise<{ customer: Customer, unpaidSales: Sale[]}> { throw new Error("Fonctionnalité de base de données désactivée."); }
  async getCustomers(params: any): Promise<Customer[]> { return []; }
  async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<Customer> { throw new Error("Fonctionnalité de base de données désactivée."); }
  async updateCustomer(id: number, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> { }
  async deleteCustomer(id: number): Promise<void> { }

  // Import/Export
  async analyzeCustomerImport(data: any[]): Promise<ImportAnalysis> { return { customersToAdd: [], customersToUpdate: [], skippedRows: [], errorRows: data, totalRows: data.length }; }
  async processCustomerImport(toAdd: any[], toUpdate: any[]): Promise<void> { }
  async analyzeProductImport(data: any[]): Promise<ProductImportAnalysis> { return { productsToAdd: [], productsToUpdate: [], skippedRows: [], errorRows: data, totalRows: data.length }; }
  async processProductImport(toAdd: any[], toUpdate: any[]): Promise<void> { }
  async exportProductsToCSV(): Promise<string> { return ""; }
    
  // Zakat
  async getZakatData(): Promise<ZakatData> { return { inventoryValue: 0, totalReceivables: 0 }; }
  
  // Bread
  async getBreadClients(): Promise<BreadClient[]> { return []; }
  async addBreadClient(client: Omit<BreadClient, 'id'>): Promise<BreadClient> { throw new Error("Fonctionnalité de base de données désactivée."); }
  async updateBreadClient(id: number, data: Partial<BreadClient>): Promise<void> { }
  async deleteBreadClient(id: number): Promise<void> { }
  async getManualBreadClients(): Promise<BreadClient[]> { return []; }
  async addManualBreadOrder(clientId: number, date: string, quantity: number): Promise<BreadOrder> { throw new Error("Fonctionnalité de base de données désactivée."); }
  async updateBreadOrderQuantity(orderId: number, newQuantity: number): Promise<void> { }
  async updateBreadOrderDeliveryStatus(orderId: number, delivered: boolean): Promise<void> { }
  async checkIfBreadOrdersExist(date: string): Promise<boolean> { return true; } // prevent creating new ones
  async createDayOrders(date: string): Promise<void> { }
  async getBreadOrdersForDate(date: string): Promise<BreadOrderWithClient[]> { return []; }
  async convertBreadOrdersToSales(orderIds: number[], breadPrice: number): Promise<void> { }
  
  // Sales
  async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> { return undefined; }
  async getSales(params: any): Promise<Sale[]> { return []; }
  async addSale(saleData: any): Promise<Sale> { throw new Error("Fonctionnalité de base de données désactivée."); }
  async deleteSale(saleId: number): Promise<void> { }
  
  // Payments
  async addPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> { throw new Error("Fonctionnalité de base de données désactivée."); }
    
  // Drafts
  async getDrafts(): Promise<Draft[]> { return []; }
  async saveDraft(cart: Cart, notes?: string): Promise<Draft> { throw new Error("Fonctionnalité de base de données désactivée."); }
  async deleteDraft(id: number): Promise<void> { }
  async getDraftAndClear(draftId: number): Promise<Omit<Draft, 'id' | 'createdAt' | 'updatedAt'> | null> { return null; }
  async loadDraftContentToCart(cartId: string, draftContent: any): Promise<void> { }
    
  // Stock Intake
  async addStockIntake(intakeData: any, items: StockIntakeItem[]): Promise<StockIntake> { throw new Error("Fonctionnalité de base de données désactivée."); }
  async getStockIntakes(params: any): Promise<StockIntake[]> { return []; }
    
  // Returns
  async getReturns(params: any): Promise<ProductReturn[]> { return []; }
  async addReturn(returnData: Omit<ProductReturn, 'id'>): Promise<ProductReturn> { throw new Error("Fonctionnalité de base de données désactivée."); }
  async deleteReturn(returnId: number): Promise<void> { }
    
  // Expenses
  async getExpenses(params: any): Promise<Expense[]> { return []; }
  async getExpenseCategories(): Promise<string[]> { return []; }
  async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> { throw new Error("Fonctionnalité de base de données désactivée."); }
  async updateExpense(id: number, expenseData: Partial<Omit<Expense, 'id'>>): Promise<void> { }
  async deleteExpense(id: number): Promise<void> { }
    
  // Costing
  async applyNewPurchasePrices(costingItems: CostingItem[]): Promise<void> { }
    
  // Backup & Restore
  async exportData(): Promise<string> { return "{}"; }
  async restoreTables(backupFile: any, tablesToRestore: string[], onProgress: (progress: any) => void): Promise<void> { }
  async resetDatabase(): Promise<void> { }
    
  // Dashboard
  async getDashboardData(from: Date, to: Date): Promise<DashboardData | undefined> {
    const stats = { totalRevenue: 0, totalProfit: 0, salesCount: 0, inventoryValue: 0, totalExpenses: 0 };
    return {
        stats: stats, sales: [], expenses: [], topProducts: [], topCustomers: [], lowStockProducts: [], recentActivity: [],
    };
  }
    
  async getGlobalActivity(limit: number): Promise<GlobalActivityItem[]> { return []; }
}

export const dataService = new DataService();
