import { Timestamp } from "firebase/firestore";

export interface Product {
    id: string;
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number; 
    minStockLevel: number;
    barcodes?: string[];
}

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    settlementDay?: number;
}

export interface SaleItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    cartQuantity?: number;
}

export interface Sale {
    id: string;
    invoiceNumber: string;
    items: SaleItem[];
    total: number;
    amountPaid: number;
    remainingBalance: number;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    customerId?: string;
    customerName?: string;
    createdAt: Timestamp | Date;
}

export interface Payment {
    id: string;
    customerId: string;
    customerName?: string;
    amount: number;
    createdAt: Timestamp;
}

export interface CustomerWithSalesData extends Customer {
    totalSpent: number;
    outstandingBalance: number;
    lastActivityDate?: Date | null;
    daysLate?: number;      // Optional: Days overdue for payment
    isReminderDue?: boolean; // Optional: Flag to show reminder
}

export interface ChartData {
  date: string;
  revenue: number;
}

export interface BreadOrder {
    id: string;
    name: string;
    quantity: number;
    isPaid: boolean;
    isDelivered: boolean;
    isRecurring: boolean;
}

export interface TopProduct extends Product {
    totalRevenue: number;
    unitsSold: number;
}

export interface TopCustomer extends Customer {
    totalSpent: number;
}

export interface CompanyProfile {
    companyName?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    vatNumber?: string;
}

export interface StockIntakeItem {
    id: string; // Unique ID for the item row
    productId?: string; // ID of the product if it exists
    barcodes: string[];
    name: string;
    quantity: number;
    purchasePrice: number;
    price: number;
    isNew: boolean;
}

export interface StockIntake {
    id: string;
    invoiceNumber: string;
    invoiceDate: Timestamp;
    items: {
        productId?: string;
        productName: string;
        quantityReceived: number;
        purchasePrice: number;
    }[];
    totalValue: number;
    createdAt: Timestamp;
}

export interface PurchaseOrderItem {
    productId: string;
    productName: string;
    quantity: number;
    purchasePrice: number;
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplierName: string;
    status: 'draft' | 'sent' | 'received';
    items: PurchaseOrderItem[];
    totalValue: number;
    notes?: string;
    createdAt: Timestamp;
}

export type PurchaseOrderStatus = PurchaseOrder['status'];

