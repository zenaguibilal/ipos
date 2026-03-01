

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
    todaysOrder?: DailyBreadOrder;
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
