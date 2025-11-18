export interface Product {
  id: string;
  name: string;
  price: number; // in cents
  stock: number;
  salesVelocity: number; // units per day
  reorderThreshold: number;
  imageUrl: string;
  imageHint: string;
  supplierId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  avatarHint: string;
  loyaltyPoints: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export interface Sale {
  id: string;
  customer: Pick<Customer, 'name' | 'email' | 'avatarUrl' | 'avatarHint'>;
  amount: number; // in cents
  date: Date;
}
