export interface Product {
    id?: number | string; // string for custom products
    name: string;
    category?: string;
    price: number;
    purchasePrice: number;
    quantity: number; 
    minStockLevel: number;
    barcodes?: string[];
    imageUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Customer {
    id?: number;
    searchName?: string; // For optimized searching
    firstName: string;
    lastName: string;
    phone?: string;
    settlementDay?: number;
    creditLimit?: number;
    totalSpent: number;
    outstandingBalance: number;
    lastActivityDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SaleItem {
    id: number | string; // string for custom items
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
}

// Represents an item in the live shopping cart
export interface CartItem extends Product {
    id: number | string; // Can be a string for custom products
    cartQuantity: number;
    flash?: boolean; // For UI animation
}

// Represents a single shopping cart session
export interface Cart {
    id:string;
    name: string;
    items: CartItem[];
    customerId: number | null;
    customerName: string;
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
    id?: number;
    invoiceNumber: string;
    items: SaleItem[];
    subtotal: number;
    discountType?: 'percentage' | 'fixed';
    discountAmount?: number;
    total: number;
    totalProfit?: number;
    amountPaid: number;
    remainingBalance: number;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    payments: SalePayment[];
    customerId?: number;
    customerName?: string;
    createdAt?: Date;
    updatedAt?: Date;
    breadOrderDate?: string;
}

export interface Payment {
    id?: number;
    customerId: number;
    customerName?: string;
    amount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CustomerWithSalesData extends Customer {
    id: number; // Make id mandatory here
    isReminderDue?: boolean;
}


export interface ChartData {
  date: string;
  revenue: number;
  profit?: number;
}

export interface CompanyProfile {
    id?: 1;
    companyName?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    vatNumber?: string;
    rcNumber?: string;
    breadPrice?: number;
    breadPurchasePrice?: number;
    syncUrl?: string;
    lastSyncDate?: Date;
    updatedAt?: Date;
}

export interface StockIntakeItem {
    id: string; // Unique ID for the item row in UI, not persisted
    productId?: number; // ID of the product if it exists
    barcodes: string[];
    name: string;
    category?: string;
    quantity: number;
    purchasePrice: number;
    price: number;
    isNew: boolean;
}

export interface StockIntake {
    id?: number;
    supplier: string;
    invoiceNumber: string;
    invoiceDate: Date;
    items: {
        productId?: number;
        productName: string;
        quantityReceived: number;
        purchasePrice: number;
    }[];
    totalValue: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ReturnItem {
    productId: number | null;
    productName: string;
    quantity: number;
    price: number; // The price at which it was sold
    purchasePrice: number;
    wasRestocked: boolean;
}

export interface ProductReturn {
    id?: number;
    originalSaleId?: number;
    originalInvoiceNumber: string;
    items: ReturnItem[];
    totalReturnValue: number;
    amountRefunded: number;
    customerId?: number;
    customerName?: string;
    createdAt?: Date;
    updatedAt?: Date;
    notes?: string;
}

export interface BreadCustomer {
    id?: number;
    name: string;
    isActive: boolean;
    defaultOrderQuantity: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// Represents the order information for a customer on a given day
export interface BreadOrder extends BreadCustomer {
    id: number;
    todaysOrder?: DailyBreadOrder & { saleId?: number };
}


export interface DailyBreadOrder {
    id?: number;
    breadCustomerId: number;
    customerName: string;
    quantity: number;
    date: string; // YYYY-MM-DD
    createdAt?: Date;
    updatedAt?: Date;
    saleId?: number;
    isPaid: boolean;
    isDelivered: boolean;
}

export type ExpenseCategory = 'Loyer' | 'Salaires' | 'Fournisseurs' | 'Services Publics' | 'Marketing' | 'Maintenance' | 'Autre';

export interface Expense {
    id?: number;
    description: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Setting {
    id: string; // The key for the setting
    value: any;
}

export interface Notification {
    id?: number;
    type: 'low-stock' | 'unpaid-invoice' | 'info';
    message: string;
    isRead: boolean;
    createdAt: Date;
    relatedId?: number | string; // e.g., product.id or customer.id
}

export type InventoryLogReason = 'sale' | 'return' | 'stock_intake' | 'cancellation' | 'manual_adjustment';

export interface InventoryLog {
    id?: number;
    productId: number;
    change: number; // e.g., -2 for sale, +50 for stock intake
    newQuantity: number;
    reason: InventoryLogReason;
    relatedId?: number | string; // ID of the sale, return, intake, etc.
    createdAt: Date;
}

export interface DashboardDateRangeData {
    totalRevenue: number;
    totalProfit: number;
    salesCount: number;
    sales: Sale[];
}

export interface ImportAnalysis {
    customersToAdd: any[];
    customersToUpdate: any[];
    skippedRows: any[];
    errorRows: any[];
    totalRows: number;
}
