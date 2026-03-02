import type { Product, Customer, Sale, Payment, StockIntake, ProductReturn, BreadCustomer, DailyBreadOrder, CompanyProfile, Expense, Notification, Setting } from "@/lib/types";

export interface DB {
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    payments: Payment[];
    stockIntakes: StockIntake[];
    returns: ProductReturn[];
    breadCustomers: BreadCustomer[];
    dailyBreadOrders: DailyBreadOrder[];
    expenses: Expense[];
    notifications: Notification[];
    settings: Setting[];
    companyProfile: CompanyProfile;
}

export type CollectionName = Exclude<keyof DB, 'companyProfile'>;


export const initialData: DB = {
    products: [],
    customers: [],
    sales: [],
    payments: [],
    stockIntakes: [],
    returns: [],
    breadCustomers: [],
    dailyBreadOrders: [],
    expenses: [],
    notifications: [],
    settings: [],
    companyProfile: {
        id: 1,
        companyName: "Mon Magasin",
        country: "Algérie"
    }
};
