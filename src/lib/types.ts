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
    dateExpiration?: string;
    supplierUuid?: string;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
    createdAt: string;
    updatedAt: string;
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
    lastActivityDate?: string;
    createdAt: string;
    updatedAt: string;
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
    payments: SalePayment[];
    customerUuid?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SaleItem {
    productUuid: string | null;
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
}

export interface SalePayment {
    method: 'cash' | 'card' | 'other';
    amount: number;
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
    createdAt: string;
    updatedAt: string;
}

export interface Expense {
    uuid: string;
    user_id: string;
    description: string;
    category: string;
    amount: number;
    expenseDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface CompanyProfile {
    uuid: string;
    user_id: string;
    companyName: string;
    address?: string;
    city?: string;
    phone?: string;
    role: AppRole;
    updatedAt: string;
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
