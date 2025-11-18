'use client';

import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  Truck,
  Archive,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { RestockAlertForm } from '@/components/ai/restock-alert-form';
import { useDashboardData } from '@/lib/data';
import { Loader } from 'lucide-react';

export default function DashboardPage() {
  const {
    totalRevenue,
    totalSales,
    totalCustomers,
    totalSuppliers,
    lowStockItems,
    monthlySales,
    isLoading,
  } = useDashboardData();

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <SummaryCard
          icon={<DollarSign />}
          title="Revenu Total"
          value={(totalRevenue / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}
          description="+20.1% depuis le mois dernier"
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart data={monthlySales} />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Ventes Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSales />
          </CardContent>
        </Card>
      </div>
      <div>
        <RestockAlertForm />
      </div>
    </div>
  );
}
