export interface Product {
    id?: number | string; // string for custom products
    name: string;
    category?: string;
    price: number;
    purchasePrice: number;
    quantity: number; 
    minStockLevel: number;
    barcodes?: string[];
    imageUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
    unite?: 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
    dateExpiration?: Date;
    fournisseurId?: number;
    dateMajPrix?: Date;
}

export interface Customer {
    id?: number;
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
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Supplier {
    id?: number;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    createdAt?: Date;
    updatedAt?: Date;
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

// Represents a single shopping cart session
export interface Cart {
    id:string;
    name: string;
    items: CartItem[];
    customerId: number | null;
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
    customerId?: number;
    customerName?: string;
    createdAt?: Date;
    updatedAt?: Date;
    dueDate?: Date;
}

export interface Payment {
    id?: number;
    customerId: number;
    customerName?: string;
    amount: number;
    paymentDate: Date;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Draft {
  id?: number;
  date: Date;
  customerId: number | null;
  customerName: string;
  items: CartItem[];
  discount: { type: 'fixed' | 'percentage'; value: number };
  total: number;
  notes?: string;
}


export interface CustomerWithSalesData extends Customer {
    id: number; // Make id mandatory here
    debtStatus?: 'none' | 'ok' | 'due_soon' | 'overdue';
    isOverLimit?: boolean;
}


export interface ChartData {
  date: string;
  revenue: number;
  profit?: number;
}

export interface TopProduct {
    id: number;
    name: string;
    totalRevenue: number;
    unitsSold: number;
    totalProfit: number;
}

export interface TopCustomer {
    id: number;
    name: string;
    totalSpent: number;
}

export interface CompanyProfile {
    id?: 1;
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
    syncUrl?: string;
    lastSyncDate?: string;
    prix_pain?: number;
    prix_achat_pain?: number;
    goldPricePerGram?: number;
    updatedAt?: Date;
}

export interface StockIntakeItem {
    id: string; // Unique ID for the item row in UI, not persisted
    productId?: number; // ID of the product if it exists
    barcodes: string[];
    name: string;
    category?: string;
    quantity: number;
    purchasePrice: number;
    price: number;
    isNew: boolean;
}

export interface StockIntake {
    id?: number;
    supplier: string;
    invoiceNumber: string;
    invoiceDate: Date;
    items: {
        productId?: number;
        productName: string;
        quantityReceived: number;
        purchasePrice: number;
    }[];
    totalValue: number;
    createdAt?: Date;
    updatedAt?: Date;
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
    originalSaleId?: number;
    originalInvoiceNumber: string;
    items: ReturnItem[];
    totalReturnValue: number;
    amountRefunded: number;
    customerId?: number;
    customerName?: string;
    createdAt?: Date;
    updatedAt?: Date;
    notes?: string;
}

export type Weekday = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';

export interface PainClient {
    id?: number;
    nom: string;
    actif: boolean;
    type_recurrence: 'quotidien' | 'jours_specifiques' | 'aucun';
    quantite_defaut: number;
    jours_semaine: {
        [key in Weekday]: { actif: boolean; quantite: number };
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CommandePain {
    id?: number;
    client_pain_id: number;
    nom_client: string;
    date: string; // YYYY-MM-DD
    quantite: number;
    statut: 'en_attente' | 'livre' | 'paye';
    vente_id?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface LigneCommandePain extends PainClient {
    id: number; // customer id
    commandeDuJour?: CommandePain;
    estModifie: boolean;
}


export type ExpenseCategory = 'Loyer' | 'Salaires' | 'Fournisseurs' | 'Services Publics' | 'Marketing' | 'Maintenance' | 'Autre';

export interface Expense {
    id?: number;
    description: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Setting {
    id: string; // The key for the setting
    value: any;
}

export interface Notification {
    id?: number;
    type: 'low-stock' | 'unpaid-invoice' | 'info';
    message: string;
    isRead: boolean;
    createdAt: Date;
    relatedId?: number | string; // e.g., product.id or customer.id
}

export type InventoryLogReason = 'sale' | 'return' | 'stock_intake' | 'cancellation' | 'manual_adjustment';

export interface InventoryLog {
    id?: number;
    productId: number;
    change: number; // e.g., -2 for sale, +50 for stock intake
    newQuantity: number;
    reason: InventoryLogReason;
    relatedId?: number | string; // ID of the sale, return, intake, etc.
    createdAt: Date;
}

export interface CostingItem extends SaleItem {
    totalPurchasePrice: number;
    allocatedDeliveryCost: number;
    finalCostPerUnit: number;
    totalFinalCost: number;
    productId?: number;
}

export interface DashboardStats {
    totalRevenue: number;
    totalProfit: number;
    salesCount: number;
    inventoryValue: number;
    totalExpenses: number;
}

export interface DashboardData {
    stats: DashboardStats;
    sales: Sale[];
    expenses: Expense[];
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
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

export interface GlobalActivityItem {
    type: 'sale' | 'stock_intake' | 'return' | 'customer';
    date: Date;
    id: number | string;
    description: string;
    details: string;
    amount?: number;
    amountClass?: string;
}

export interface ZakatData {
    inventoryValue: number;
    totalReceivables: number;
}
