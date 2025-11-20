
import { Timestamp } from "firebase/firestore";

export interface Product {
    id: string;
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
    minStockLevel: number;
    barcode?: string;
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
    createdAt: Timestamp;
}

export interface Payment {
    id: string;
    customerId: string;
    amount: number;
}

export interface CustomerWithSalesData extends Customer {
    totalSpent: number;
    outstandingBalance: number;
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
