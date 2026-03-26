
'use client';

import React from 'react';
import type { StockIntake, SupplierPayment } from '@/lib/types';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from '@/components/ui/timeline';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Package, Banknote, History, ArrowDownToLine } from 'lucide-react';

interface SupplierActivityProps {
  activity: any[];
  onIntakeClick: (intake: StockIntake) => void;
}

export function SupplierActivity({ activity, onIntakeClick }: SupplierActivityProps) {
  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center rounded-3xl border-2 border-dashed bg-muted/10 border-white/5">
        <History className="h-12 w-12 text-muted-foreground/30" />
        <h3 className="mt-4 text-lg font-bold uppercase tracking-tight">Aucune activité</h3>
        <p className="text-sm text-muted-foreground max-w-xs">Aucune réception ou paiement enregistré pour ce partenaire.</p>
      </div>
    );
  }

  return (
    <Timeline>
      {activity.map((item, index) => {
        const isLast = index === activity.length - 1;
        const activityDate = safeToDate(item.date);
        const formattedDate = format(activityDate, 'd MMM yyyy, HH:mm', { locale: fr });
        
        if (item.type === 'intake') {
           const intake = item as StockIntake;
          return (
            <TimelineItem key={`intake-${intake.uuid}`}>
              {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon className="bg-primary/10 border-primary/20">
                  <Package className="h-5 w-5 text-primary" />
                </TimelineIcon>
                <TimelineTitle className="font-bold">Réception #{intake.invoiceNumber}</TimelineTitle>
                 <span className="text-[10px] font-black uppercase text-muted-foreground ml-auto opacity-60">{formattedDate}</span>
              </TimelineHeader>
              <TimelineBody>
                <div 
                  className="p-4 luxury-glass bg-background/40 hover:bg-muted/30 transition-all cursor-pointer group"
                  onClick={() => onIntakeClick(intake)}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-black text-lg text-primary">{formatCurrency(intake.totalValue)}</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest">
                            <ArrowDownToLine className="h-2.5 w-2.5" />
                            Entrée Stock
                        </div>
                    </div>
                     <p className="text-xs text-muted-foreground font-medium">
                        {intake.items?.length || 0} article(s) reçus. Transport: {formatCurrency(intake.transportFees || 0)}
                    </p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else if (item.type === 'payment') {
          const payment = item as SupplierPayment;
          return (
             <TimelineItem key={`payment-${payment.uuid}`}>
               {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon className="bg-chart-quaternary/10 border-chart-quaternary/20">
                  <Banknote className="h-5 w-5 text-chart-quaternary" />
                </TimelineIcon>
                <TimelineTitle className="font-bold">Paiement au fournisseur</TimelineTitle>
                 <span className="text-[10px] font-black uppercase text-muted-foreground ml-auto opacity-60">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div className="p-4 luxury-glass bg-chart-quaternary/5 border-chart-quaternary/10">
                     <p className="font-black text-lg text-chart-quaternary">-{formatCurrency(payment.amount)}</p>
                     <p className="text-xs text-muted-foreground font-medium mt-1">
                        Mode: <span className="uppercase">{payment.method.replace('_', ' ')}</span>
                        {payment.notes && ` • ${payment.notes}`}
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
