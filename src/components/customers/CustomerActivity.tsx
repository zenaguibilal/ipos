
'use client';

import React from 'react';
import type { Sale, Payment, ProductReturn } from '@/lib/types';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from '@/components/ui/timeline';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HandCoins, ShoppingBag, Undo2, Receipt, ArrowDownToLine, ArrowUpFromLine, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CustomerActivityProps {
  activity: any[];
  onSaleClick: (sale: Sale) => void;
  onReturnClick: (pr: ProductReturn) => void;
}

export function CustomerActivity({ activity, onSaleClick, onReturnClick }: CustomerActivityProps) {
  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-30 grayscale">
        <Receipt className="h-16 w-16 text-muted-foreground" />
        <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-widest">Flux Vierge</h3>
            <p className="text-[10px] font-bold uppercase tracking-tighter">Aucune interaction enregistrée pour ce compte.</p>
        </div>
      </div>
    );
  }

  return (
    <Timeline className="px-2">
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
                <TimelineIcon className="bg-primary/10 border-primary/20 text-primary shadow-lg shadow-primary/5">
                  <ArrowUpFromLine className="h-4 w-4" />
                </TimelineIcon>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-grow gap-2">
                    <TimelineTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                        Facture #{sale.invoiceNumber}
                        {sale.paymentStatus === 'paid' && <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                    </TimelineTitle>
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60">{formattedDate}</span>
                </div>
              </TimelineHeader>
              <TimelineBody>
                <div 
                  className="p-5 luxury-glass bg-background/40 hover:bg-primary/[0.03] transition-all cursor-pointer border border-white/5 hover:border-primary/30 group relative overflow-hidden mt-2"
                  onClick={() => onSaleClick(sale)}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                        <FileText className="h-12 w-12 text-primary" />
                    </div>
                    <div className="flex justify-between items-center mb-3 relative z-10">
                        <span className="font-black text-2xl tracking-tighter text-primary">{formatCurrency(sale.total)}</span>
                         <Badge className={cn('px-3 py-1 text-[9px] font-black uppercase tracking-widest border-0', {
                            'bg-green-500/20 text-green-500': sale.paymentStatus === 'paid',
                            'bg-orange-500/20 text-orange-500': sale.paymentStatus === 'partial',
                            'bg-destructive/20 text-destructive': sale.paymentStatus === 'unpaid',
                         })}>
                            {sale.paymentStatus === 'paid' ? 'Soldé' : sale.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                        </Badge>
                    </div>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 relative z-10">
                        <ShoppingBag className="h-3 w-3 text-primary/40" />
                        {sale.items?.length || 0} article(s) • {sale.paymentStatus !== 'paid' ? `Reliquat: ${formatCurrency(sale.remainingBalance)}` : 'Transaction finale'}
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
                <TimelineIcon className="bg-destructive/10 border-destructive/20 text-destructive shadow-lg shadow-destructive/5">
                  <Undo2 className="h-4 w-4" />
                </TimelineIcon>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-grow gap-2">
                    <TimelineTitle className="text-sm font-black uppercase tracking-tight text-destructive">Retour Marchandise</TimelineTitle>
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60">{formattedDate}</span>
                </div>
              </TimelineHeader>
               <TimelineBody>
                <div 
                  className="p-5 luxury-glass bg-destructive/[0.02] hover:bg-destructive/[0.05] transition-all cursor-pointer border border-destructive/10 group mt-2"
                  onClick={() => onReturnClick(pr)}
                >
                     <div className="flex justify-between items-center mb-2">
                        <p className="font-black text-2xl tracking-tighter text-destructive">-{formatCurrency(pr.totalReturnValue)}</p>
                        <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/10 text-[9px] font-black h-5 uppercase">Ref #{pr.originalInvoiceNumber}</Badge>
                     </div>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Undo2 className="h-3 w-3 text-destructive/40" />
                        {pr.items?.length || 0} articles régularisés • Inventaire mis à jour
                     </p>
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
                <TimelineIcon className="bg-chart-quaternary/10 border-chart-quaternary/20 text-chart-quaternary shadow-lg shadow-chart-quaternary/5">
                  <ArrowDownToLine className="h-4 w-4" />
                </TimelineIcon>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-grow gap-2">
                    <TimelineTitle className="text-sm font-black uppercase tracking-tight text-chart-quaternary">Versement de Solde</TimelineTitle>
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60">{formattedDate}</span>
                </div>
              </TimelineHeader>
               <TimelineBody>
                <div className="p-5 luxury-glass bg-chart-quaternary/[0.02] border border-chart-quaternary/10 mt-2 relative group overflow-hidden">
                     <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <HandCoins className="h-16 w-16 text-chart-quaternary" />
                     </div>
                     <p className="font-black text-2xl tracking-tighter text-chart-quaternary">+{formatCurrency(payment.amount)}</p>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2 italic">
                        <HandCoins className="h-3 w-3 text-chart-quaternary/40" />
                        {payment.notes || 'Règlement au terminal iPOS Cloud.'}
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
