import type { Product, Customer, Supplier, Sale } from './types';

// Mock Data
export const products: Product[] = [
  {
    id: 'prod_1',
    name: 'Wireless Headphones',
    price: 9999,
    stock: 150,
    salesVelocity: 5,
    reorderThreshold: 20,
    imageUrl: 'https://picsum.photos/seed/1/400/400',
    imageHint: 'headphones audio',
    supplierId: 'supp_1'
  },
  {
    id: 'prod_2',
    name: 'Smartwatch Series 8',
    price: 39900,
    stock: 8,
    salesVelocity: 2,
    reorderThreshold: 10,
    imageUrl: 'https://picsum.photos/seed/2/400/400',
    imageHint: 'smartwatch tech'
  },
  {
    id: 'prod_3',
    name: 'Mechanical Keyboard',
    price: 12950,
    stock: 45,
    salesVelocity: 3,
    reorderThreshold: 15,
    imageUrl: 'https://picsum.photos/seed/3/400/400',
    imageHint: 'keyboard office'
  },
  {
    id: 'prod_4',
    name: 'Bluetooth Speaker',
    price: 4999,
    stock: 200,
    salesVelocity: 8,
    reorderThreshold: 30,
    imageUrl: 'https://picsum.photos/seed/4/400/400',
    imageHint: 'speaker music',
    supplierId: 'supp_2'
  },
  {
    id: 'prod_5',
    name: '4K UHD Monitor',
    price: 29900,
    stock: 30,
    salesVelocity: 1,
    reorderThreshold: 5,
    imageUrl: 'https://picsum.photos/seed/5/400/400',
    imageHint: 'monitor screen',
    supplierId: 'supp_1'
  },
  {
    id: 'prod_6',
    name: 'DSLR Camera',
    price: 89900,
    stock: 15,
    salesVelocity: 0.5,
    reorderThreshold: 5,
    imageUrl: 'https://picsum.photos/seed/6/400/400',
    imageHint: 'camera photography',
    supplierId: 'supp_3'
  }
];

export const customers: Customer[] = [
  {
    id: 'cust_1',
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    phone: '+1 (555) 123-4567',
    avatarUrl: 'https://picsum.photos/seed/101/100/100',
    avatarHint: 'woman portrait',
    loyaltyPoints: 1250,
  },
  {
    id: 'cust_2',
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    phone: '+1 (555) 234-5678',
    avatarUrl: 'https://picsum.photos/seed/102/100/100',
    avatarHint: 'man portrait',
    loyaltyPoints: 800,
  },
  {
    id: 'cust_3',
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    phone: '+1 (555) 345-6789',
    avatarUrl: 'https://picsum.photos/seed/103/100/100',
    avatarHint: 'woman smile',
    loyaltyPoints: 2400,
  },
  {
    id: 'cust_4',
    name: 'William Kim',
    email: 'will@email.com',
    phone: '+1 (555) 456-7890',
    avatarUrl: 'https://picsum.photos/seed/104/100/100',
    avatarHint: 'man professional',
    loyaltyPoints: 350,
  },
  {
    id: 'cust_5',
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    phone: '+1 (555) 567-8901',
    avatarUrl: 'https://picsum.photos/seed/105/100/100',
    avatarHint: 'woman glasses',
    loyaltyPoints: 5200,
  },
];

export const suppliers: Supplier[] = [
    {
        id: 'supp_1',
        name: 'Techtronics Inc.',
        contactPerson: 'John Smith',
        email: 'sales@techtronics.com',
        phone: '+1 (555) 111-2222',
    },
    {
        id: 'supp_2',
        name: 'AudioPhile Gear',
        contactPerson: 'Jane Doe',
        email: 'contact@audiophile.co',
        phone: '+1 (555) 333-4444',
    },
    {
        id: 'supp_3',
        name: 'Camera World',
        contactPerson: 'Peter Jones',
        email: 'support@cameraworld.com',
        phone: '+1 (555) 555-6666',
    }
];

export const sales: Sale[] = [
  {
    id: 'sale_1',
    customer: customers[0],
    amount: 25000,
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
  },
  {
    id: 'sale_2',
    customer: customers[1],
    amount: 39900,
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
  },
  {
    id: 'sale_3',
    customer: customers[2],
    amount: 12950,
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
  },
  {
    id: 'sale_4',
    customer: customers[3],
    amount: 4999,
    date: new Date(new Date().setDate(new Date().getDate() - 3)),
  },
  {
    id: 'sale_5',
    customer: customers[4],
    amount: 29900,
    date: new Date(new Date().setDate(new Date().getDate() - 4)),
  },
];


// Server-side data fetching functions
export async function getProducts(): Promise<Product[]> {
  // In a real app, you'd fetch this from a database
  return Promise.resolve(products);
}

export async function getCustomers(): Promise<Customer[]> {
  return Promise.resolve(customers);
}

export async function getSuppliers(): Promise<Supplier[]> {
    return Promise.resolve(suppliers);
}

export async function getSales(): Promise<Sale[]> {
  return Promise.resolve(sales);
}

export async function getDashboardData() {
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);
    const lowStockItems = products.filter(p => p.stock < p.reorderThreshold).length;

    return {
        totalRevenue: totalRevenue,
        totalSales: sales.length,
        totalCustomers: customers.length,
        totalSuppliers: suppliers.length,
        lowStockItems: lowStockItems
    }
}
