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
import { useDashboardData, useSalesChartData, useSales } from '@/lib/data';
import { Loader } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';


export default function DashboardPage() {

  const {
    productsValue,
    totalCustomers,
    totalSuppliers,
    lowStockItems,
    dailyRevenue,
    isLoading: isDashboardLoading,
  } = useDashboardData();
  
  const { chartData, isLoading: isChartLoading } = useSalesChartData();
  const { sales: recentSales, isLoading: isRecentSalesLoading } = useSales(5);

  const isLoading = isDashboardLoading || isChartLoading || isRecentSalesLoading;


  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <SummaryCard
          icon={<DollarSign />}
          title="Ventes Aujourd'hui"
          value={(dailyRevenue / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}
          description="Total des ventes pour aujourd'hui"
        />
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
          icon={<Archive />}
          title="Stock Faible"
          value={`${lowStockItems}`}
          description="Articles nécessitant une attention"
        />
      </div>
       <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Ventes des 7 derniers jours</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart data={chartData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ventes Récentes</CardTitle>
              <CardDescription>
                Vous avez effectué {chartData.reduce((acc, d) => acc + d.total, 0) > 0 ? 'des' : 'aucune'} ventes cette semaine.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentSales sales={recentSales} />
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
