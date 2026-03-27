/**
 * @fileOverview THE TYPE SINGULARITY
 * Absolute authority for all system interfaces.
 * Strictly enforced for deterministic builds.
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

export interface ReturnItem {
    productUuid: string | null;
    productName: string;
    quantity: number;
    price: number;
    purchasePrice: number;
    wasRestocked: boolean;
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

export interface CartItem extends Product {
    cartQuantity: number;
    flash?: boolean;
}

export interface Cart {
    id: string;
    name: string;
    items: CartItem[];
    customerUuid: string | null;
    discount: { type: 'fixed' | 'percentage'; value: number };
}

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
