export interface Product {
  id: string;
  name: string;
  price: number; // in cents - Selling Price
  purchasePrice: number; // in cents
  quantity: number;
  minStock: number;
  imageUrl: string;
  description: string;
  supplierId: string;
  barcode?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  avatarHint?: string;
  debt?: number; // in cents
  settlementDay?: number;
}

export interface Supplier {
  id:string;
  name: string;
  contactName: string;
  contactPhone: string;
  debt?: number; // in cents
  visitingDays?: string; // Comma-separated days
}

export interface Sale {
  id: string;
  invoiceNumber: number;
  customerId: string;
  totalAmount: number; // in cents
  saleDate: string;
  paymentMethod: 'cash' | 'credit';
  saleLineItemIds: string[];
}

export interface SaleLineItem {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number; // in cents
    discount: number;
}


// --- Detailed Types for UI ---

export interface SaleLineItemWithProduct extends SaleLineItem {
    product?: Product;
}

export interface SaleWithDetails extends Sale {
    customer?: Customer;
    lineItems?: SaleLineItemWithProduct[];
}

export interface InvoiceCounter {
    id: string;
    lastNumber: number;
}

export interface BakeryOrder {
  id: string;
  customerName: string;
  quantity: number;
  type: 'bread' | 'meloui';
  orderDate: string;
  isFulfilled: boolean;
}

    