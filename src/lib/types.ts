
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
    category?: string; // e.g., 'Wholesale', 'Regular', 'VIP'
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
    bread_jours_semaine?: {
        [key: string]: { actif: boolean; quantite: number };
    };
}

export interface CustomerTopProduct {
    productUuid: string;
    name: string;
    quantity: number;
    totalAmount: number;
}

export interface SaleItem {
    productUuid: string | null;
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
}

// Represents an item in the live shopping cart
export interface CartItem extends Product {
    cartQuantity: number;
    flash?: boolean; // For UI animation
}

// Represents a single shopping cart session
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

export interface Payment {
    uuid: string;
    user_id: string;
    customerUuid: string;
    amount: number;
    paymentDate: Date;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
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
    goldPricePerGram?: number;
    prix_pain?: number;
    updatedAt?: Date;
    role: AppRole;
}

export interface StockIntakeItem {
    id: string; // Unique ID for the item row in UI, not persisted
    productUuid?: string; // UUID of the product if it exists
    barcodes: string[];
    name: string;
    category?: string;
    quantity: number;
    quantityDamaged: number;
    purchasePrice: number;
    price: number;
    isNew: boolean;
    unite?: 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
}

export interface StockIntake {
    uuid: string;
    user_id: string;
    supplierUuid?: string;
    invoiceNumber: string;
    invoiceDate: Date;
    items: {
        productUuid?: string;
        productName: string;
        quantityReceived: number;
        quantityDamaged: number;
        purchasePrice: number;
    }[];
    totalValue: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ReturnItem {
    productUuid: string | null;
    productName: string;
    quantity: number;
    price: number; // The price at which it was sold
    purchasePrice: number;
    wasRestocked: boolean;
}

export interface ProductReturn {
    uuid: string;
    user_id: string;
    originalSaleUuid?: string;
    originalInvoiceNumber: string;
    items: ReturnItem[];
    totalReturnValue: number;
    amountRefunded: number;
    customerUuid?: string;
    createdAt?: Date;
    updatedAt?: Date;
    notes?: string;
}

export type ExpenseCategory = 'Loyer' | 'Salaires' | 'Fournisseurs' | 'Services Publics' | 'Marketing' | 'Maintenance' | 'Autre' | string;

export interface Expense {
    uuid: string;
    user_id: string;
    description: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export type InventoryLogReason = 'sale' | 'return' | 'stock_intake' | 'cancellation' | 'manual_adjustment';

export interface InventoryLog {
    uuid: string;
    user_id: string;
    productUuid: string;
    change: number; // e.g., -2 for sale, +50 for stock intake
    newQuantity: number;
    reason: InventoryLogReason;
    relatedUuid?: string; // UUID of the sale, return, intake, etc.
    createdAt: Date;
}

export interface Supplier {
    uuid: string;
    user_id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    balance: number; // Solde de la dette envers le fournisseur
    createdAt?: Date;
    updatedAt?: Date;
}

// =================== Bread Types ===================

export interface BreadOrder {
    uuid: string;
    user_id: string;
    orderName: string; // Nom de la commande (ex: Resto X)
    date: string; // YYYY-MM-DD
    quantite: number;
    quantite_origine?: number;
    est_paye: boolean;
    est_livre: boolean;
    venteUuid: string | null;
    createdAt?: Date;
    updatedAt?: Date;
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

// =================== Dashboard Types ===================

export interface RecentSale extends Pick<Sale, 'uuid' | 'invoiceNumber' | 'total' | 'createdAt'> {
    customerName: string;
}

export interface RecentReturn extends Pick<ProductReturn, 'uuid' | 'originalInvoiceNumber' | 'totalReturnValue' | 'createdAt'> {
    customerName: string;
}

export interface SalesByDay {
    date: string;
    total: number;
    profit: number;
}

export interface TopProduct {
    productUuid: string;
    name: string;
    quantitySold: number;
    revenueGenerated: number;
    imageUrl?: string;
    category?: string;
}

export interface TopCustomer {
  customerUuid: string;
  name: string;
  totalSpent: number;
}

export interface LowStockProduct extends Pick<Product, 'uuid' | 'name' | 'quantity' | 'minStockLevel' | 'imageUrl' | 'category' | 'unite'> {}

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
    salesByDay: SalesByDay[];
    recentSales: RecentSale[];
    recentReturns: RecentReturn[];
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
    lowStockProducts: LowStockProduct[];
}
