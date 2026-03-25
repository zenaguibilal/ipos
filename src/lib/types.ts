
export type SyncStatus = 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';

export interface Product {
    id?: number;
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
    name: string;
    category?: string;
    price: number;
    purchasePrice: number;
    quantity: number; 
    minStockLevel: number;
    barcodes?: string[];
    imageUrl?: string;
    unite?: 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
    dateExpiration?: Date;
    supplierUuid?: string;
    dateMajPrix?: Date;
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface Customer {
    id?: number;
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
    firstName: string;
    lastName: string;
    searchName?: string;
    phone?: string;
    address?: string;
    settlementDay?: number;
    creditLimit?: number;
    totalSpent: number;
    outstandingBalance: number;
    lastActivityDate?: Date;
    debtStatus?: 'none' | 'due_soon' | 'overdue';
    isOverLimit?: boolean;
}

export interface SaleItem {
    id: number | string; // string for custom items
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
}

// Represents an item in the live shopping cart
export interface CartItem extends Product {
    id: number | string; // Can be a string for custom products
    cartQuantity: number;
    flash?: boolean; // For UI animation
}

// Represents a single shopping cart session - LOCAL ONLY
export interface Cart {
    id:string;
    name: string;
    items: CartItem[];
    customerUuid: string | null;
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
    id?: number;
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
    invoiceNumber: string;
    items: SaleItem[];
    subtotal: number;
    discountType?: 'percentage' | 'fixed';
    discountAmount?: number;
    total: number;
    amountPaid: number;
    remainingBalance: number;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    payments: SalePayment[];
    customerUuid?: string;
    customerName?: string;
    clientPainUuid?: string;
    dueDate?: Date;
}

export interface Payment {
    id?: number;
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
    customerUuid: string;
    customerName?: string;
    amount: number;
    paymentDate: Date;
    notes?: string;
}

// LOCAL ONLY
export interface Draft {
  id?: number;
  date: Date;
  customerUuid: string | null;
  customerName: string;
  items: CartItem[];
  total: number;
  discount: {
      type: 'fixed' | 'percentage';
      value: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompanyProfile {
    id: 1;
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
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
    goldPricePerGram?: number;
    prix_pain?: number;
}

export interface StockIntakeItem {
    id: string; // Unique ID for the item row in UI, not persisted
    productId?: number; // ID of the product if it exists
    barcodes: string[];
    name: string;
    category?: string;
    quantity: number;
    quantityDamaged: number;
    purchasePrice: number;
    price: number;
    isNew: boolean;
}

export interface StockIntake {
    id?: number;
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
    supplierUuid: string;
    supplierName?: string;
    invoiceNumber: string;
    invoiceDate: Date;
    items: {
        productId?: number;
        productName: string;
        quantityReceived: number;
        quantityDamaged: number;
        purchasePrice: number;
    }[];
    totalValue: number;
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
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
    originalSaleId?: number;
    originalInvoiceNumber: string;
    items: ReturnItem[];
    totalReturnValue: number;
    amountRefunded: number;
    customerUuid?: string;
    customerName?: string;
    notes?: string;
}

export type ExpenseCategory = 'Loyer' | 'Salaires' | 'Fournisseurs' | 'Services Publics' | 'Marketing' | 'Maintenance' | 'Autre';

export interface Expense {
    id?: number;
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
    description: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date;
}

export type InventoryLogReason = 'sale' | 'return' | 'stock_intake' | 'cancellation' | 'manual_adjustment';

export interface InventoryLog {
    id?: number;
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
    productId: number;
    change: number; // e.g., -2 for a sale, +50 for stock intake
    newQuantity: number;
    reason: InventoryLogReason;
    relatedId?: number | string; // ID of the sale, return, intake, etc.
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
    id?: number;
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    balance: number; // Solde de la dette envers le fournisseur
}

// =================== Bread Types ===================

export interface BreadClient {
    id?: number;
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
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
    id?: number;
    uuid: string; // For remote identification
    createdAt?: Date;
    updatedAt?: Date;
    sync_status?: SyncStatus;
    last_modified_by?: string; // To track origin of last change (local device ID)
    clientPainUuid: string;
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

export interface SyncQueueItem {
    id?: number;
    tableName: string;
    recordUuid: string;
    action: 'create' | 'update' | 'delete';
    payload: any;
    createdAt: Date;
    attempts?: number;
}
