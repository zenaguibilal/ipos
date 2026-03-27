/**
 * @fileOverview Absolute Type Authority
 * Production-grade POS system definitions.
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
    searchName?: string;
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

export interface CartItem extends Product {
    cartQuantity: number;
}

export interface Cart {
    id: string;
    items: CartItem[];
    customerUuid: string | null;
    discount: {
        type: 'fixed' | 'percentage';
        value: number;
    };
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
    salesByDay: any[];
    recentSales: any[];
    recentReturns: any[];
    topProducts: any[];
    topCustomers: any[];
    lowStockProducts: any[];
}
