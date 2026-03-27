/**
 * @fileOverview THE TYPE SINGULARITY
 * Absolute authority for all system interfaces.
 */

export type AppRole = 'admin' | 'manager' | 'cashier';

export interface Product {
    uuid: string;
    user_id: string;
    name: string;
    category: string;
    price: number;
    purchasePrice: number;
    quantity: number;
    minStockLevel: number;
    barcodes: string[];
    imageUrl?: string;
    unite: 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
    dateExpiration?: Date | string;
    supplierUuid?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface Customer {
    uuid: string;
    user_id: string;
    firstName: string;
    lastName: string;
    searchName: string;
    phone?: string;
    address?: string;
    notes?: string;
    category: string;
    creditLimit: number;
    totalSpent: number;
    outstandingBalance: number;
    lastActivityDate?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    debtStatus: 'none' | 'due_soon' | 'overdue';
    isOverLimit: boolean;
    isBreadClient: boolean;
    bread_type_recurrence?: 'quotidien' | 'jours_specifiques' | 'aucun';
    bread_quantite_defaut?: number;
    bread_jours_semaine?: Record<string, { actif: boolean; quantite: number }>;
}

export interface Payment {
    uuid: string;
    user_id: string;
    customerUuid: string;
    amount: number;
    paymentDate: Date | string;
    notes?: string;
    createdAt?: Date | string;
}

export interface SaleItem {
    productUuid: string | null;
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
}

export interface Sale {
    uuid: string;
    user_id: string;
    invoiceNumber: string;
    items: SaleItem[];
    subtotal: number;
    discountType: 'percentage' | 'fixed';
    discountAmount: number;
    total: number;
    amountPaid: number;
    remainingBalance: number;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    payments: { method: 'cash' | 'card' | 'other'; amount: number }[];
    customerUuid?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dueDate?: Date | string;
}

export interface ProductReturn {
    uuid: string;
    user_id: string;
    originalSaleUuid: string;
    originalInvoiceNumber: string;
    totalReturnValue: number;
    amountRefunded: number;
    customerUuid?: string;
    notes?: string;
    items: ReturnItem[];
    createdAt?: Date | string;
}

export interface ReturnItem {
    productUuid: string | null;
    productName: string;
    quantity: number;
    price: number;
    purchasePrice: number;
    wasRestocked: boolean;
}

export interface Supplier {
    uuid: string;
    user_id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    balance: number;
    createdAt?: Date | string;
}

export interface SupplierPayment {
    uuid: string;
    user_id: string;
    supplierUuid: string;
    amount: number;
    paymentDate: Date | string;
    method: 'cash' | 'card' | 'bank_transfer';
    notes?: string;
}

export interface Expense {
    uuid: string;
    user_id: string;
    description: string;
    category: string;
    amount: number;
    expenseDate: Date | string;
    createdAt?: Date | string;
}

export interface CompanyProfile {
    uuid: string;
    user_id: string;
    companyName: string;
    address?: string;
    city?: string;
    phone?: string;
    role: AppRole;
    prix_pain: number;
    goldPricePerGram: number;
}

export interface DashboardData {
    stats: {
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        saleCount: number;
        totalOutstandingDebt: number;
        totalInventoryValue: number;
        totalRevenueChange: number;
        netProfitChange: number;
        totalExpensesChange: number;
        saleCountChange: number;
    };
    salesByDay: { date: string; total: number; profit: number }[];
    recentSales: RecentSale[];
    recentReturns: RecentReturn[];
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
    lowStockProducts: LowStockProduct[];
}

export interface RecentSale {
    uuid: string;
    invoiceNumber: string;
    total: number;
    createdAt: string | Date;
    customerName: string;
}

export interface RecentReturn {
    uuid: string;
    originalInvoiceNumber: string;
    totalReturnValue: number;
    createdAt: string | Date;
    customerName: string;
}

export interface TopProduct {
    productUuid: string;
    name: string;
    quantitySold: number;
    revenueGenerated: number;
    imageUrl?: string;
    category: string;
}

export interface TopCustomer {
    customerUuid: string;
    name: string;
    totalSpent: number;
}

export interface LowStockProduct {
    uuid: string;
    name: string;
    quantity: number;
    minStockLevel: number;
    unite: string;
}

export interface Recipe {
    uuid: string;
    user_id: string;
    name: string;
    description?: string;
    ingredients: Ingredient[];
    yieldQuantity: number;
    unitCost: number;
    suggestedPrice: number;
    targetMargin: number;
    updatedAt?: Date | string;
}

export interface Ingredient {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    unitCost: number;
}

export interface BreadOrder {
    uuid: string;
    user_id: string;
    customerUuid: string | null;
    orderName: string;
    date: string;
    quantite: number;
    quantite_origine?: number;
    est_paye: boolean;
    est_livre: boolean;
    venteUuid: string | null;
    createdAt?: Date | string;
}

export interface StockIntake {
    uuid: string;
    user_id: string;
    supplierUuid?: string;
    invoiceNumber: string;
    invoiceDate: Date | string;
    totalValue: number;
    transportFees: number;
    items: StockIntakeItem[];
    createdAt?: Date | string;
}

export interface StockIntakeItem {
    productUuid?: string;
    productName: string;
    quantityReceived: number;
    quantityDamaged: number;
    purchasePrice: number;
    costPrice?: number;
}

export interface InventoryLog {
    uuid: string;
    user_id: string;
    productUuid: string;
    change: number;
    newQuantity: number;
    reason: 'sale' | 'return' | 'stock_intake' | 'cancellation' | 'manual_adjustment';
    relatedUuid?: string;
    createdAt: Date | string;
}

export type CustomerTopProduct = {
    productUuid: string;
    name: string;
    quantity: number;
    totalAmount: number;
    category: string;
};

export interface ImportAnalysis {
    customersToAdd: any[];
    customersToUpdate: any[];
    skippedRows: any[];
    errorRows: any[];
    totalRows: number;
}

export interface ProductImportAnalysis {
    productsToAdd: any[];
    productsToUpdate: any[];
    skippedRows: any[];
    errorRows: any[];
    totalRows: number;
}

export interface ZakatCalculation {
    inventoryValue: number;
    customerDebts: number;
    badDebts: number;
    cashOnHand: number;
    supplierDebts: number;
    otherDebts: number;
    goldPrice: number;
    nisab: number;
    zakatBase: number;
    zakatAmount: number;
    isNisabReached: boolean;
}

export interface SavedZakatCalculation extends ZakatCalculation {
    uuid: string;
    user_id: string;
    createdAt: Date | string;
}
