import type { Product, Customer, Sale, Payment, StockIntake, ProductReturn, CompanyProfile, Expense, Notification, Setting, InventoryLog } from "@/lib/types";

export interface DB {
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    payments: Payment[];
    stockIntakes: StockIntake[];
    returns: ProductReturn[];
    expenses: Expense[];
    notifications: Notification[];
    settings: Setting[];
    inventoryLogs: InventoryLog[];
    companyProfile: CompanyProfile;
}

export type CollectionName = Exclude<keyof DB, 'companyProfile'>;


export const initialData: Partial<DB> = {
    products: [],
    customers: [],
    sales: [],
    payments: [],
    stockIntakes: [],
    returns: [],
    expenses: [],
    notifications: [],
    settings: [],
    inventoryLogs: [],
    companyProfile: {
        id: 1,
        companyName: "Mon Magasin",
        country: "Algérie"
    }
};
