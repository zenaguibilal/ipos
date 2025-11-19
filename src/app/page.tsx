'use client';

import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  Truck,
  Archive,
  TrendingUp,
  Package,
} from 'lucide-react';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { useDashboardData } from '@/lib/data';
import { Loader } from 'lucide-react';


export default function DashboardPage() {

  const {
    productsValue,
    totalCustomers,
    totalSuppliers,
    lowStockItems,
    isLoading,
  } = useDashboardData();

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <SummaryCard
          icon={<Package />}
          title="Valeur du Stock"
          value={(productsValue / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}
          description="Valeur d'achat totale des produits en stock"
        />
        <SummaryCard
          icon={<Users />}
          title="Clients"
          value={`+${totalCustomers}`}
          description="Nombre total de clients"
        />
        <SummaryCard
          icon={<Truck />}
          title="Fournisseurs"
          value={`+${totalSuppliers}`}
          description="Nombre total de fournisseurs"
        />
        <SummaryCard
          icon={<Archive />}
          title="Stock Faible"
          value={`${lowStockItems}`}
          description="Articles nécessitant une attention"
        />
      </div>
       <div className="grid grid-cols-1 gap-4">
        {/* You can add other components here, like alerts or quick actions */}
      </div>
    </div>
  );
}
