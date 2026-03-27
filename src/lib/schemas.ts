import { z } from 'zod';

/**
 * @fileOverview DETERMINISTIC SCHEMA DEFINITIONS
 * Absolute authority for data validation across the API Wall.
 */

export const ProductSchema = z.object({
    name: z.string().min(1),
    category: z.string().default('Non classé'),
    price: z.number().nonnegative(),
    purchasePrice: z.number().nonnegative(),
    quantity: z.number().int(),
    minStockLevel: z.number().int().default(10),
    barcodes: z.array(z.string()).default([]),
    imageUrl: z.string().url().optional().or(z.literal('')),
    unite: z.enum(['Pièce', 'Kg', 'Litre', 'Boîte', 'Carton', 'Sachet', 'Bouteille']).default('Pièce'),
    dateExpiration: z.string().datetime().optional(),
    supplierUuid: z.string().uuid().optional(),
});

export const CustomerSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    category: z.string().default('Standard'),
    creditLimit: z.number().nonnegative().default(0),
    settlementDay: z.number().int().min(0).max(31).optional(),
});

export const SupplierSchema = z.object({
    name: z.string().min(1),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
});

export const ExpenseSchema = z.object({
    description: z.string().min(1),
    category: z.string().default('Autre'),
    amount: z.number().positive(),
    expenseDate: z.string().datetime(),
});

export const SaleSchema = z.object({
    items: z.array(z.object({
        productUuid: z.string().uuid().nullable(),
        name: z.string(),
        price: z.number().nonnegative(),
        purchasePrice: z.number().nonnegative(),
        quantity: z.number().positive(),
    })).min(1),
    subtotal: z.number().nonnegative(),
    discountType: z.enum(['percentage', 'fixed']),
    discountAmount: z.number().nonnegative(),
    total: z.number().nonnegative(),
    amountPaid: z.number().nonnegative(),
    remainingBalance: z.number().nonnegative(),
    paymentStatus: z.enum(['paid', 'partial', 'unpaid']),
    payments: z.array(z.object({
        method: z.enum(['cash', 'card', 'other']),
        amount: z.number().nonnegative(),
    })),
    customerUuid: z.string().uuid().nullable(),
    dueDate: z.string().datetime().optional(),
});

export const StockIntakeSchema = z.object({
    supplierUuid: z.string().uuid().optional(),
    supplierName: z.string(),
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().datetime(),
    totalValue: z.number().nonnegative(),
    transportFees: z.number().nonnegative().default(0),
    items: z.array(z.object({
        productUuid: z.string().uuid().optional(),
        productName: z.string(),
        quantityReceived: z.number().positive(),
        quantityDamaged: z.number().nonnegative().default(0),
        purchasePrice: z.number().nonnegative(),
        costPrice: z.number().nonnegative(),
    })).min(1),
});

export const PaymentSchema = z.object({
    customerUuid: z.string().uuid(),
    amount: z.number().positive(),
    paymentDate: z.string().datetime().optional(),
    notes: z.string().optional(),
});

export const SupplierPaymentSchema = z.object({
    supplierUuid: z.string().uuid(),
    amount: z.number().positive(),
    paymentDate: z.string().datetime(),
    method: z.enum(['cash', 'card', 'bank_transfer']),
    notes: z.string().optional(),
});

export const ReturnSchema = z.object({
    originalSaleUuid: z.string().uuid(),
    originalInvoiceNumber: z.string(),
    items: z.array(z.object({
        productUuid: z.string().uuid().nullable(),
        productName: z.string(),
        quantity: z.number().positive(),
        price: z.number().nonnegative(),
        purchasePrice: z.number().nonnegative(),
        wasRestocked: z.boolean(),
    })).min(1),
    totalReturnValue: z.number().nonnegative(),
    amountRefunded: z.number().nonnegative(),
    customerUuid: z.string().uuid().nullable().optional(),
    notes: z.string().optional(),
});

export const BreadOrderSchema = z.object({
    orderName: z.string().min(1),
    quantite: z.number().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    customerUuid: z.string().uuid().nullable().optional(),
});

export const ProfileSchema = z.object({
    companyName: z.string().min(1),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
    vatNumber: z.string().optional(),
    rcNumber: z.string().optional(),
    artImposition: z.string().optional(),
    goldPricePerGram: z.number().nonnegative().optional(),
    prix_pain: z.number().nonnegative().optional(),
});

export const RecipeSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    yieldQuantity: z.number().positive(),
    targetMargin: z.number().min(0).max(100),
    ingredients: z.array(z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number().positive(),
        unit: z.string(),
        unitCost: z.number().nonnegative(),
    })),
    unitCost: z.number().nonnegative(),
    suggestedPrice: z.number().nonnegative(),
});