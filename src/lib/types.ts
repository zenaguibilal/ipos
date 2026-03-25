import { type User } from "@supabase/supabase-js";

export type { User };

export interface Product {
    id: number;
    user_id: string;
    created_at?: string;
    name: string;
    category?: string;
    price: number;
    purchase_price: number;
    quantity: number; 
    min_stock_level: number;
    barcodes?: string[];
    image_url?: string;
    unite?: 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
    date_expiration?: string;
    supplier_id?: number;
}

export interface Customer {
    id: number;
    user_id: string;
    created_at?: string;
    first_name: string;
    last_name: string;
    search_name?: string;
    phone?: string;
    address?: string;
    settlement_day?: number;
    credit_limit?: number;
    total_spent: number;
    outstanding_balance: number;
    last_activity_date?: string;
    debt_status?: 'none' | 'due_soon' | 'overdue';
    is_over_limit?: boolean;
}

export interface SaleItem {
    id: number | string; // string for custom items
    name: string;
    price: number;
    purchase_price: number;
    quantity: number;
}

// Represents an item in the live shopping cart
export interface CartItem extends Product {
    id: number | string; // Can be a string for custom products
    cartQuantity: number;
}

// Represents a single shopping cart session
export interface Cart {
    id:string;
    name: string;
    items: CartItem[];
    customer_id: number | null;
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
    id: number;
    user_id: string;
    created_at?: string;
    invoice_number: string;
    items: SaleItem[];
    subtotal: number;
    discount_type?: 'percentage' | 'fixed';
    discount_amount?: number;
    total: number;
    amount_paid: number;
    remaining_balance: number;
    payment_status: 'paid' | 'partial' | 'unpaid';
    payments: SalePayment[];
    customer_id?: number;
    customerName?: string;
    client_pain_id?: number;
    due_date?: string;
}

export interface Payment {
    id: number;
    user_id: string;
    created_at?: string;
    customer_id: number;
    customerName?: string;
    amount: number;
    payment_date: string;
    notes?: string;
}

export interface Draft {
  id?: number;
  date: Date;
  customer_id: number | null;
  customerName: string;
  items: CartItem[];
  total: number;
  discount: {
      type: 'fixed' | 'percentage';
      value: number;
  };
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyProfile {
    id: number;
    user_id: string;
    updated_at?: string;
    company_name?: string;
    address?: string;
    city?: string;
    zip_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    vat_number?: string;
    rc_number?: string;
    gold_price_per_gram?: number;
    prix_pain?: number;
}

export interface StockIntakeItem {
    id: string; // Unique ID for the item row in UI, not persisted
    product_id?: number; // ID of the product if it exists
    barcodes: string[];
    name: string;
    category?: string;
    quantity: number;
    quantity_damaged: number;
    purchase_price: number;
    price: number;
    is_new: boolean;
}

export interface StockIntake {
    id: number;
    user_id: string;
    created_at?: string;
    supplier_id: number;
    supplierName?: string;
    invoice_number: string;
    invoice_date: string;
    items: {
        product_id?: number;
        product_name: string;
        quantity_received: number;
        quantity_damaged: number;
        purchase_price: number;
    }[];
    total_value: number;
}

export interface ReturnItem {
    product_id: number | null;
    product_name: string;
    quantity: number;
    price: number; // The price at which it was sold
    purchase_price: number;
    was_restocked: boolean;
}

export interface ProductReturn {
    id: number;
    user_id: string;
    created_at?: string;
    original_sale_id?: number;
    original_invoice_number: string;
    items: ReturnItem[];
    total_return_value: number;
    amount_refunded: number;
    customer_id?: number;
    customerName?: string;
    notes?: string;
}

export type ExpenseCategory = 'Loyer' | 'Salaires' | 'Fournisseurs' | 'Services Publics' | 'Marketing' | 'Maintenance' | 'Autre';

export interface Expense {
    id: number;
    user_id: string;
    created_at?: string;
    description: string;
    category: ExpenseCategory;
    amount: number;
    expense_date: string;
}

export type InventoryLogReason = 'sale' | 'return' | 'stock_intake' | 'cancellation' | 'manual_adjustment';

export interface InventoryLog {
    id: number;
    user_id: string;
    created_at: string;
    product_id: number;
    change: number; // e.g., -2 for sale, +50 for stock intake
    new_quantity: number;
    reason: InventoryLogReason;
    related_id?: number | string; // ID of the sale, return, intake, etc.
}

export interface ImportAnalysis {
    customersToAdd: any[];
    customersToUpdate: any[];
    skippedRows: any[];
    errorRows: any[];
    totalRows: number;
}

export interface ProductImportAnalysis {
    productsToAdd: any[];
    productsToUpdate: any[];
    skippedRows: any[];
    errorRows: any[];
    totalRows: number;
}

export interface Supplier {
    id: number;
    user_id: string;
    created_at?: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    balance: number; // Solde de la dette envers le fournisseur
}

// =================== Bread Types ===================

export interface BreadClient {
    id: number;
    user_id: string;
    created_at?: string;
    nom: string;
    actif: boolean;
    type_recurrence: 'quotidien' | 'jours_specifiques' | 'aucun';
    quantite_defaut?: number;
    jours_semaine?: {
        lundi:    { actif: boolean, quantite: number },
        mardi:    { actif: boolean, quantite: number },
        mercredi: { actif: boolean, quantite: number },
        jeudi:    { actif: boolean, quantite: number },
        vendredi: { actif: boolean, quantite: number },
        samedi:   { actif: boolean, quantite: number },
        dimanche: { actif: boolean, quantite: number }
    };
}

export interface BreadOrder {
    id: number;
    user_id: string;
    created_at?: string;
    client_pain_id: number;
    date: string; // YYYY-MM-DD
    quantite: number;
    quantite_origine?: number;
    est_paye: boolean;
    est_livre: boolean;
    vente_id: number | null;
}

export interface BreadOrderWithClient extends BreadOrder {
    client: BreadClient;
}

export interface DB {
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    payments: Payment[];
    stockIntakes: StockIntake[];
    returns: ProductReturn[];
    carts: Cart[];
    drafts: Draft[];
    companyProfile: CompanyProfile[];
    expenses: Expense[];
    inventoryLogs: InventoryLog[];
    suppliers: Supplier[];
    clients_pain: BreadClient[];
    commandes_pain: BreadOrder[];
}
