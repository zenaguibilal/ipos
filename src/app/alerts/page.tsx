'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Product, Customer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Archive, CircleDollarSign, Loader } from 'lucide-react';
import Link from 'next/link';

function LowStockAlerts({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد تنبيهات بخصوص انخفاض المخزون.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>المنتج</TableHead>
          <TableHead>المخزون الحالي</TableHead>
          <TableHead>أدنى مخزون</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>
              <Badge variant="destructive">{product.quantity}</Badge>
            </TableCell>
            <TableCell>{product.minStock}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DueDebtAlerts({ customers }: { customers: Customer[] }) {
  if (customers.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد تنبيهات بخصوص الديون المستحقة.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>العميل</TableHead>
          <TableHead>الهاتف</TableHead>
          <TableHead>يوم التسوية</TableHead>
          <TableHead className="text-right">الدين المستحق</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell>
                <Link href="/customers" className="font-medium hover:underline text-primary">
                    {customer.name}
                </Link>
            </TableCell>
            <TableCell>{customer.phone}</TableCell>
            <TableCell>
                <Badge variant="outline">اليوم {customer.settlementDay}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="destructive">
                {((customer.debt || 0) / 100).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'DZD',
                  minimumFractionDigits: 0,
                })}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AlertsPage() {
  const firestore = useFirestore();

  // Fetch low stock products
  const productsRef = useMemoFirebase(
    () => collection(firestore, 'suppliers/supp_1/products'),
    [firestore]
  );
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsRef);

  const lowStockProducts = useMemo(
    () => products?.filter((p) => p.quantity <= p.minStock) || [],
    [products]
  );

  // Fetch customers with due debts
  const customersRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersRef);

  const dueDebtCustomers = useMemo(() => {
    const today = new Date().getDate();
    return (
      customers?.filter(
        (c) => c.debt && c.debt > 0 && c.settlementDay && c.settlementDay <= today
      ) || []
    );
  }, [customers]);

  const isLoading = productsLoading || customersLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-6 w-6 text-destructive" />
            تنبيهات المخزون المنخفض ({lowStockProducts.length})
          </CardTitle>
          <CardDescription>
            المنتجات التي وصلت إلى الحد الأدنى للمخزون أو أقل.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LowStockAlerts products={lowStockProducts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign className="h-6 w-6 text-destructive" />
            تنبيهات الديون المستحقة ({dueDebtCustomers.length})
          </CardTitle>
          <CardDescription>
            العملاء الذين استحق موعد تسوية ديونهم هذا الشهر.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DueDebtAlerts customers={dueDebtCustomers} />
        </CardContent>
      </Card>
    </div>
  );
}
