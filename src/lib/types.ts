

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
    unite?: 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
    dateExpiration?: Date;
    fournisseurId?: number;
    dateMajPrix?: Date;
    createdAt?: Date;
    updatedAt?: Date;
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
    clientPainId?: number;
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
  total: number;
  discount: {
      type: 'fixed' | 'percentage';
      value: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
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
    goldPricePerGram?: number;
    prix_pain?: number;
    updatedAt?: Date;
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
    supplierId: number;
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

export interface DashboardData {
    stats: DashboardStats;
    sales: Sale[];
    expenses: Expense[];
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
    lowStockProducts: Product[];
    recentActivity: GlobalActivityItem[];
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
    type: 'sale' | 'stock_intake' | 'return' | 'customer' | 'payment';
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

export interface Supplier {
    id?: number;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    balance: number; // Solde de la dette envers le fournisseur
    createdAt?: Date;
    updatedAt?: Date;
}

// =================== Bread Types ===================

export interface BreadClient {
    id?: number;
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
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BreadOrder {
    id?: number;
    client_pain_id: number;
    date: string; // YYYY-MM-DD
    quantite: number;
    quantite_origine?: number;
    est_paye: boolean;
    est_livre: boolean;
    vente_id: number | null;
    createdAt?: Date;
    updatedAt?: Date;
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
    suppliers: Supplier[];
    clients_pain: BreadClient[];
    commandes_pain: BreadOrder[];
}
