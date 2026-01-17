
import { Timestamp } from "firebase/firestore";

export interface Product {
    id: string;
    name: string;
    category?: string;
    price: number;
    purchasePrice: number;
    quantity: number; 
    minStockLevel: number;
    barcodes?: string[];
    imageUrl?: string;
}

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    settlementDay?: number;
    createdAt: Timestamp;
}

export interface SaleItem {
    id: string;
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
    cartQuantity?: number;
}

export interface Sale {
    id: string;
    invoiceNumber: string;
    items: SaleItem[];
    subtotal: number;
    discountType?: 'percentage' | 'fixed';
    discountAmount?: number;
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

export interface BreadOrder {
    id: string;
    name: string;
    quantity: number;
    isPaid: boolean;
    isDelivered: boolean;
    isRecurring: boolean;
    createdAt: Timestamp;
}

export interface CustomerWithSalesData extends Customer {
    totalSpent: number;
    outstandingBalance: number;
    lastActivityDate?: Date | null;
    daysLate?: number;
    isReminderDue?: boolean;
}


export interface ChartData {
  date: string;
  revenue: number;
  profit?: number;
}

export interface TopProduct extends Product {
    totalRevenue: number;
    unitsSold: number;
    totalProfit: number;
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
    email?: string;
    website?: string;
    vatNumber?: string;
    rcNumber?: string;
    breadPrice?: number;
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
    supplier: string;
    items: PurchaseOrderItem[];
    totalValue: number;
    status: 'pending' | 'received';
    createdAt: Timestamp;
}

export interface StockIntakeItem {
    id: string; // Unique ID for the item row
    productId?: string; // ID of the product if it exists
    barcodes: string[];
    name: string;
    category?: string;
    quantity: number;
    purchasePrice: number;
    price: number;
    isNew: boolean;
}

export interface StockIntake {
    id: string;
    invoiceNumber: string;
    invoiceDate: Timestamp | Date;
    items: {
        productId?: string;
        productName: string;
        quantityReceived: number;
        purchasePrice: number;
    }[];
    totalValue: number;
    createdAt: Timestamp | Date;
}

export interface InventoryValueData {
    name: string;
    value: number;
}
