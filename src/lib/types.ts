
/**
 * @fileOverview Application Type Definitions
 * Reconstructed for strict typing and architectural consistency.
 */

export type AppRole = 'admin' | 'manager' | 'cashier';

export interface Product {
    uuid: string;
    user_id: string;
    name: string;
    category?: string;
    price: number;
    purchasePrice: number;
    quantity: number; 
    minStockLevel: number;
    barcodes?: string[];
    imageUrl?: string;
    unite?: 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
    dateExpiration?: Date;
    supplierUuid?: string;
    dateMajPrix?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
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
    category?: string;
    settlementDay?: number;
    creditLimit?: number;
    totalSpent: number;
    outstandingBalance: number;
    lastActivityDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    debtStatus?: 'none' | 'due_soon' | 'overdue';
    isOverLimit?: boolean;
    isBreadClient?: boolean;
    bread_type_recurrence?: 'quotidien' | 'jours_specifiques' | 'aucun';
    bread_quantite_defaut?: number;
    bread_jours_semaine?: Record<string, { actif: boolean; quantite: number }>;
}

export interface SaleItem {
    productUuid: string | null;
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
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
    discount: {
        type: 'fixed' | 'percentage';
        value: number;
    };
}

export interface SalePayment {
    method: 'cash' | 'card' | 'other';
    amount: number;
}

export interface Sale {
    uuid: string;
    user_id: string;
    invoiceNumber: string;
    items: SaleItem[];
    subtotal: number;
    discountType?: 'percentage' | 'fixed';
    discountAmount?: number;
    total: number;
    amountPaid: number;
    remainingBalance: number;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    payments: SalePayment[];
    customerUuid?: string;
    createdAt?: Date;
    updatedAt?: Date;
    dueDate?: Date;
}

export interface CompanyProfile {
    uuid: string;
    user_id: string;
    companyName: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    vatNumber?: string;
    rcNumber?: string;
    artImposition?: string;
    goldPricePerGram?: number;
    prix_pain?: number;
    updatedAt?: Date;
    role: AppRole;
}

export interface StockIntakeItem {
    productUuid?: string;
    productName: string;
    quantityReceived: number;
    quantityDamaged: number;
    purchasePrice: number;
    costPrice?: number;
}

export interface StockIntake {
    uuid: string;
    user_id: string;
    supplierUuid?: string;
    invoiceNumber: string;
    invoiceDate: Date;
    items: StockIntakeItem[];
    totalValue: number;
    transportFees: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProductReturn {
    uuid: string;
    user_id: string;
    originalSaleUuid?: string;
    originalInvoiceNumber: string;
    items: {
        productUuid: string | null;
        productName: string;
        quantity: number;
        price: number;
        purchasePrice: number;
        wasRestocked: boolean;
    }[];
    totalReturnValue: number;
    amountRefunded: number;
    customerUuid?: string;
    createdAt?: Date;
    updatedAt?: Date;
    notes?: string;
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
    createdAt: Date;
}

export interface DashboardData {
    stats: {
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        saleCount: number;
        totalOutstandingDebt: number;
        totalInventoryValue: number;
        totalRevenueChange?: number;
        netProfitChange?: number;
        totalExpensesChange?: number;
        saleCountChange?: number;
    };
    salesByDay: { date: string; total: number; profit: number }[];
    recentSales: any[];
    recentReturns: any[];
    topProducts: any[];
    topCustomers: any[];
    lowStockProducts: any[];
}
