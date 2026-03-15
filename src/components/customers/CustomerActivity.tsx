'use client';

import React from 'react';
import type { Sale, Payment, ProductReturn } from '@/lib/types';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from '@/components/ui/timeline';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HandCoins, ShoppingBag, Receipt, Undo2 } from 'lucide-react';

type ActivityItem = Sale | Payment | ProductReturn;

interface CustomerActivityProps {
  activity: ActivityItem[];
  onSaleClick: (sale: Sale) => void;
  onReturnClick: (pr: ProductReturn) => void;
}

const isSale = (item: ActivityItem): item is Sale => 'invoiceNumber' in item;
const isPayment = (item: ActivityItem): item is Payment => 'paymentDate' in item;
const isReturn = (item: ActivityItem): item is ProductReturn => 'originalInvoiceNumber' in item;

const getActivityDate = (item: ActivityItem): Date => {
  if (isPayment(item)) return safeToDate(item.paymentDate);
  return safeToDate(item.createdAt!);
};

export function CustomerActivity({ activity, onSaleClick, onReturnClick }: CustomerActivityProps) {
  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center rounded-lg border-2 border-dashed">
        <Receipt className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Aucune activité</h3>
        <p className="text-muted-foreground">Ce client n'a pas encore d'historique de ventes ou de paiements.</p>
      </div>
    );
  }

  return (
    <Timeline>
      {activity.map((item, index) => {
        const isLast = index === activity.length - 1;
        const activityDate = getActivityDate(item);
        const formattedDate = format(activityDate, 'd MMM yyyy, HH:mm', { locale: fr });
        
        if (isSale(item)) {
           const Icon = ShoppingBag;
           const title = `Achat - Facture #${item.invoiceNumber}`;
          return (
            <TimelineItem key={`sale-${item.id}`}>
              {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <Icon className="h-5 w-5" />
                </TimelineIcon>
                <TimelineTitle>{title}</TimelineTitle>
                 <span className="text-sm text-muted-foreground ml-auto">{formattedDate}</span>
              </TimelineHeader>
              <TimelineBody>
                <div 
                  className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => onSaleClick(item)}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-lg">{formatCurrency(item.total)}</span>
                         <span className={cn('px-2 py-1 text-xs rounded-full font-semibold', {
                            'bg-chart-quaternary/10 text-chart-quaternary': item.paymentStatus === 'paid',
                            'bg-chart-secondary/10 text-chart-secondary': item.paymentStatus === 'partial',
                            'bg-destructive/10 text-destructive': item.paymentStatus === 'unpaid',
                         })}>
                            {item.paymentStatus === 'paid' ? 'Payé' : item.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                        </span>
                    </div>
                     <p className="text-sm text-muted-foreground">
                        {item.items.length} article(s). {item.paymentStatus !== 'paid' && `Solde restant: ${formatCurrency(item.remainingBalance)}`}
                    </p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else if (isReturn(item)) {
           return (
             <TimelineItem key={`return-${item.id}`}>
               {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <Undo2 className="h-5 w-5 text-chart-secondary" />
                </TimelineIcon>
                <TimelineTitle>Retour sur Facture #{item.originalInvoiceNumber}</TimelineTitle>
                 <span className="text-sm text-muted-foreground ml-auto">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div 
                  className="p-4 bg-chart-secondary/10 rounded-lg hover:bg-chart-secondary/20 transition-colors cursor-pointer"
                  onClick={() => onReturnClick(item)}
                >
                     <p className="font-semibold text-lg text-chart-secondary">- {formatCurrency(item.totalReturnValue)}</p>
                     <p className="text-sm text-muted-foreground">Remboursé: {formatCurrency(item.amountRefunded)} | {item.items.length} article(s) retourné(s).</p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else if (isPayment(item)) {
          return (
             <TimelineItem key={`payment-${item.id}`}>
               {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <HandCoins className="h-5 w-5 text-chart-quaternary" />
                </TimelineIcon>
                <TimelineTitle>Paiement reçu</TimelineTitle>
                 <span className="text-sm text-muted-foreground ml-auto">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div className="p-4 bg-chart-quaternary/10 rounded-lg">
                     <p className="font-semibold text-lg text-chart-quaternary">{formatCurrency(item.amount)}</p>
                     <p className="text-sm text-muted-foreground">{item.notes || 'Paiement enregistré.'}</p>
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
