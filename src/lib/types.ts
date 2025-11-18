export interface Product {
  id: string;
  name: string;
  price: number; // in cents
  quantity: number;
  imageUrl: string;
  description: string;
  supplierId: string;
  barcode?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  avatarHint?: string;
  loyaltyCardNumber: string;
  debt?: number; // in cents
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export interface Sale {
  id: string;
  customerId: string;
  customer?: Pick<Customer, 'name' | 'email' | 'avatarUrl' | 'avatarHint'>;
  totalAmount: number; // in cents
  saleDate: string;
  paymentMethod: 'cash' | 'credit';
  saleLineItemIds: string[];
}
