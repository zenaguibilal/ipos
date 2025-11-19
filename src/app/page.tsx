'use client';

import { useState } from 'react';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { useDashboardData, type TimeRange } from '@/lib/data';
import { Loader } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  const {
    totalRevenue,
    netProfit,
    productsValue,
    totalSales,
    totalCustomers,
    totalSuppliers,
    lowStockItems,
    salesChartData,
    isLoading,
  } = useDashboardData(timeRange);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 xl:grid-cols-6">
        <SummaryCard
          icon={<DollarSign />}
          title="Revenu Total"
          value={(totalRevenue / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}
          description={`Basé sur ${totalSales} ventes`}
        />
         <SummaryCard
          icon={<TrendingUp />}
          title="Bénéfice Net"
          value={(netProfit / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}
          description="Revenu total moins le coût des marchandises"
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
            <div className="flex items-center justify-between">
              <CardTitle>Aperçu</CardTitle>
              <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)} className="w-auto">
                <TabsList>
                  <TabsTrigger value="daily">Aujourd'hui</TabsTrigger>
                  <TabsTrigger value="monthly">Ce mois</TabsTrigger>
                  <TabsTrigger value="yearly">Cette année</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart data={salesChartData} />
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
    </div>
  );
}
