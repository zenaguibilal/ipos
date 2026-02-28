import { Product, Customer, Sale, Payment, StockIntake, ProductReturn, BreadCustomer, DailyBreadOrder, CompanyProfile } from "@/lib/types";

export interface DB {
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    payments: Payment[];
    stockIntakes: StockIntake[];
    returns: ProductReturn[];
    breadCustomers: BreadCustomer[];
    dailyBreadOrders: DailyBreadOrder[];
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
    companyProfile: {
        companyName: "Mon Magasin",
        country: "Algérie"
    }
};
