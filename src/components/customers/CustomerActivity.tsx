
'use client';

import React from 'react';
import type { Sale, Payment, ProductReturn } from '@/lib/types';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from '@/components/ui/timeline';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HandCoins, ShoppingBag, Undo2, Receipt, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface CustomerActivityProps {
  activity: any[];
  onSaleClick: (sale: Sale) => void;
  onReturnClick: (pr: ProductReturn) => void;
}

export function CustomerActivity({ activity, onSaleClick, onReturnClick }: CustomerActivityProps) {
  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30 grayscale">
        <Receipt className="h-16 w-16 text-muted-foreground" />
        <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-widest">Aucune activité</h3>
            <p className="text-[10px] font-bold uppercase tracking-tighter">Le journal des flux est vierge pour ce terminal.</p>
        </div>
      </div>
    );
  }

  return (
    <Timeline>
      {activity.map((item, index) => {
        const isLast = index === activity.length - 1;
        const activityDate = safeToDate(item.date);
        const formattedDate = format(activityDate, 'd MMM yyyy, HH:mm', { locale: fr });
        
        if (item.type === 'sale') {
           const sale = item as Sale;
          return (
            <TimelineItem key={`sale-${item.uuid}`}>
              {!isLast && <TimelineConnector className="bg-primary/10" />}
              <TimelineHeader>
                <TimelineIcon className="bg-primary/10 border-primary/20 text-primary">
                  <ArrowUpFromLine className="h-4 w-4" />
                </TimelineIcon>
                <TimelineTitle className="text-sm font-black uppercase tracking-tight">Vente #{sale.invoiceNumber}</TimelineTitle>
                 <span className="text-[10px] font-black uppercase text-muted-foreground ml-auto opacity-60">{formattedDate}</span>
              </TimelineHeader>
              <TimelineBody>
                <div 
                  className="p-5 luxury-glass bg-background/40 hover:bg-primary/5 transition-all cursor-pointer border border-white/5 hover:border-primary/30 group"
                  onClick={() => onSaleClick(sale)}
                >
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-black text-xl tracking-tighter text-primary">{formatCurrency(sale.total)}</span>
                         <Badge className={cn('px-3 py-1 text-[9px] font-black uppercase tracking-widest border-0', {
                            'bg-green-500/20 text-green-500': sale.paymentStatus === 'paid',
                            'bg-orange-500/20 text-orange-500': sale.paymentStatus === 'partial',
                            'bg-destructive/20 text-destructive': sale.paymentStatus === 'unpaid',
                         })}>
                            {sale.paymentStatus === 'paid' ? 'Soldé' : sale.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                        </Badge>
                    </div>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <ShoppingBag className="h-3 w-3" />
                        {sale.items?.length || 0} article(s) • {sale.paymentStatus !== 'paid' ? `Reste: ${formatCurrency(sale.remainingBalance)}` : 'Transaction finalisée'}
                    </p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else if (item.type === 'return') {
            const pr = item as ProductReturn;
           return (
             <TimelineItem key={`return-${item.uuid}`}>
               {!isLast && <TimelineConnector className="bg-destructive/10" />}
              <TimelineHeader>
                <TimelineIcon className="bg-destructive/10 border-destructive/20 text-destructive">
                  <Undo2 className="h-4 w-4" />
                </TimelineIcon>
                <TimelineTitle className="text-sm font-black uppercase tracking-tight">Retour Marchandise</TimelineTitle>
                 <span className="text-[10px] font-black uppercase text-muted-foreground ml-auto opacity-60">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div 
                  className="p-5 luxury-glass bg-destructive/5 hover:bg-destructive/10 transition-all cursor-pointer border border-destructive/10 group"
                  onClick={() => onReturnClick(pr)}
                >
                     <div className="flex justify-between items-center mb-2">
                        <p className="font-black text-xl tracking-tighter text-destructive">-{formatCurrency(pr.totalReturnValue)}</p>
                        <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/10 text-[9px] font-black h-5 uppercase">Réf #{pr.originalInvoiceNumber}</Badge>
                     </div>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{pr.items?.length || 0} articles réintégrés au stock.</p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else if (item.type === 'payment') {
          const payment = item as Payment;
          return (
             <TimelineItem key={`payment-${item.uuid}`}>
               {!isLast && <TimelineConnector className="bg-chart-quaternary/10" />}
              <TimelineHeader>
                <TimelineIcon className="bg-chart-quaternary/10 border-chart-quaternary/20 text-chart-quaternary">
                  <ArrowDownToLine className="h-4 w-4" />
                </TimelineIcon>
                <TimelineTitle className="text-sm font-black uppercase tracking-tight">Versement de Solde</TimelineTitle>
                 <span className="text-[10px] font-black uppercase text-muted-foreground ml-auto opacity-60">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div className="p-5 luxury-glass bg-chart-quaternary/5 border border-chart-quaternary/10 group">
                     <p className="font-black text-xl tracking-tighter text-chart-quaternary">+{formatCurrency(payment.amount)}</p>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2 italic">
                        <HandCoins className="h-3 w-3" />
                        {payment.notes || 'Règlement effectué au terminal iPOS.'}
                     </p>
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
