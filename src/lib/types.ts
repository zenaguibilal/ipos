

export interface Product {
    id?: number;
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
    firstName: string;
    lastName: string;
    phone?: string;
    settlementDay?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CustomerWithSalesData extends Customer {
    id: number; // Make id mandatory here
    totalSpent: number;
    outstandingBalance: number;
    lastActivityDate?: Date | null;
    isReminderDue?: boolean;
}

export interface Payment {
    id?: number;
    customerId: number;
    customerName?: string;
    amount: number;
    createdAt?: Date;
    updatedAt?: Date;
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
    isPaid: boolean;
    isDelivered: boolean;
}

export interface Setting {
    id: string; // The key for the setting
    value: any;
}
