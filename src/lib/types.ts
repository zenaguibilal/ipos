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
    dateMajPrix?: string;
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
    debtStatus: 'none' | 'due_soon' | 'overdue';
    isOverLimit: boolean;
    isBreadClient?: boolean;
    bread_type_recurrence?: 'quotidien' | 'jours_specifiques' | 'aucun';
    bread_quantite_defaut?: number;
    bread_jours_semaine?: Record<string, { actif: boolean; quantite: number }>;
}

export interface StaffMember {
    uuid: string;
    user_id: string;
    email: string;
    displayName: string;
    role: AppRole;
    permissions: string[]; // List of allowed page slugs
    isActive: boolean;
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

export interface StockIntake {
    uuid: string;
    user_id: string;
    supplierUuid?: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalValue: number;
    transportFees: number;
    items: StockIntakeItem[];
    createdAt: string;
    updatedAt: string;
}

export interface StockIntakeItem {
    productUuid?: string;
    productName: string;
    quantityReceived: number;
    quantityDamaged: number;
    purchasePrice: number;
    costPrice?: number;
}

export interface InventoryLog {
    uuid: string;
    user_id: string;
    productUuid: string;
    change: number;
    newQuantity: number;
    reason: 'sale' | 'return' | 'stock_intake' | 'cancellation' | 'manual_adjustment';
    relatedUuid?: string;
    createdAt: string;
}

export interface ProductReturn {
    uuid: string;
    user_id: string;
    originalSaleUuid: string;
    originalInvoiceNumber: string;
    totalReturnValue: number;
    amountRefunded: number;
    customerUuid?: string;
    items: ReturnItem[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReturnItem {
    productUuid: string | null;
    productName: string;
    quantity: number;
    price: number;
    purchasePrice: number;
    wasRestocked: boolean;
}

export interface BreadOrder {
    uuid: string;
    user_id: string;
    customerUuid: string | null;
    orderName: string;
    date: string;
    quantite: number;
    quantite_origine?: number;
    est_paye: boolean;
    est_livre: boolean;
    venteUuid: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CompanyProfile {
    uuid: string;
    user_id: string;
    companyName: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    vatNumber?: string;
    rcNumber?: string;
    artImposition?: string;
    goldPricePerGram?: number;
    prix_pain?: number;
    currencySymbol?: string;
    decimalPlaces?: number;
    zakatAnniversary?: string;
    role: AppRole;
    permissions?: string[];
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

export interface Payment {
    uuid: string;
    user_id: string;
    customerUuid: string;
    amount: number;
    paymentDate: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SupplierPayment {
    uuid: string;
    user_id: string;
    supplierUuid: string;
    amount: number;
    paymentDate: string;
    method: 'cash' | 'card' | 'bank_transfer';
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Cart {
    id: string;
    name: string;
    items: CartItem[];
    customerUuid: string | null;
    discount: {
        type: 'fixed' | 'percentage';
        value: number;
    };
}

export interface CartItem extends Product {
    cartQuantity: number;
    flash?: boolean;
}

export interface SavedZakatCalculation {
    uuid: string;
    zakatBase: number;
    zakatAmount: number;
    createdAt: string;
    details?: any;
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

export interface Recipe {
    uuid: string;
    user_id: string;
    name: string;
    description?: string;
    yieldQuantity: number;
    targetMargin: number;
    ingredients: Ingredient[];
    unitCost: number;
    suggestedPrice: number;
    updatedAt?: string;
}

export interface Ingredient {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    unitCost: number;
}
