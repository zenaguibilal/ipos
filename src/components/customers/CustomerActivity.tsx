
'use client';

import React from 'react';
import type { Sale, Payment, ProductReturn } from '@/lib/types';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from '@/components/ui/timeline';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { HandCoins, ShoppingBag, Undo2 } from 'lucide-react';

interface CustomerActivityProps {
  activity: any[];
  onSaleClick: (sale: Sale) => void;
  onReturnClick: (pr: ProductReturn) => void;
}

export function CustomerActivity({ activity, onSaleClick, onReturnClick }: CustomerActivityProps) {
  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center rounded-lg border-2 border-dashed bg-muted/20">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">لا يوجد نشاط مسجل</h3>
        <p className="text-muted-foreground">لا توجد عمليات مبيعات أو مدفوعات لهذا العميل بعد.</p>
      </div>
    );
  }

  return (
    <Timeline>
      {activity.map((item, index) => {
        const isLast = index === activity.length - 1;
        const activityDate = safeToDate(item.date);
        const formattedDate = format(activityDate, 'd MMM yyyy, HH:mm', { locale: ar });
        
        if (item.type === 'sale') {
           const sale = item as Sale;
          return (
            <TimelineItem key={`sale-${item.uuid}`}>
              {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </TimelineIcon>
                <TimelineTitle>فاتورة بيع #{sale.invoiceNumber}</TimelineTitle>
                 <span className="text-xs text-muted-foreground mr-auto">{formattedDate}</span>
              </TimelineHeader>
              <TimelineBody>
                <div 
                  className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-primary/20"
                  onClick={() => onSaleClick(sale)}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">{formatCurrency(sale.total)}</span>
                         <span className={cn('px-2 py-0.5 text-[10px] rounded-full font-bold uppercase', {
                            'bg-green-500/10 text-green-500': sale.paymentStatus === 'paid',
                            'bg-orange-500/10 text-orange-500': sale.paymentStatus === 'partial',
                            'bg-destructive/10 text-destructive': sale.paymentStatus === 'unpaid',
                         })}>
                            {sale.paymentStatus === 'paid' ? 'مدفوعة' : sale.paymentStatus === 'partial' ? 'جزئية' : 'غير مدفوعة'}
                        </span>
                    </div>
                     <p className="text-xs text-muted-foreground">
                        {sale.items?.length || 0} صنف. {sale.paymentStatus !== 'paid' && `المتبقي: ${formatCurrency(sale.remainingBalance)}`}
                    </p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else if (item.type === 'return') {
            const pr = item as ProductReturn;
           return (
             <TimelineItem key={`return-${item.uuid}`}>
               {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <Undo2 className="h-5 w-5 text-destructive" />
                </TimelineIcon>
                <TimelineTitle>مرتجع فاتورة #{pr.originalInvoiceNumber}</TimelineTitle>
                 <span className="text-xs text-muted-foreground mr-auto">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div 
                  className="p-4 bg-destructive/5 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer border border-transparent hover:border-destructive/20"
                  onClick={() => onReturnClick(pr)}
                >
                     <p className="font-bold text-lg text-destructive">- {formatCurrency(pr.totalReturnValue)}</p>
                     <p className="text-xs text-muted-foreground">تم إرجاع {pr.items?.length || 0} صنف. المبلغ المعاد: {formatCurrency(pr.amountRefunded)}</p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else if (item.type === 'payment') {
          const payment = item as Payment;
          return (
             <TimelineItem key={`payment-${item.uuid}`}>
               {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <HandCoins className="h-5 w-5 text-green-500" />
                </TimelineIcon>
                <TimelineTitle>قبض دفعة نقدية</TimelineTitle>
                 <span className="text-xs text-muted-foreground mr-auto">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/10">
                     <p className="font-bold text-lg text-green-500">+{formatCurrency(payment.amount)}</p>
                     <p className="text-xs text-muted-foreground">{payment.notes || 'تم استلام الدفعة وتسويتها مع الرصيد.'}</p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        }
        return null;
      })}
    </Timeline>
  );
}
