'use client';

import React from 'react';
import type { Sale, Payment, ProductReturn } from '@/lib/types';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from '@/components/ui/timeline';
import { safeToDate, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HandCoins, ShoppingBag, Receipt, Truck, Undo2 } from 'lucide-react';

type ActivityItem = Sale | Payment | ProductReturn;

interface CustomerActivityProps {
  activity: ActivityItem[];
}

const isSale = (item: ActivityItem): item is Sale => 'invoiceNumber' in item;
const isPayment = (item: ActivityItem): item is Payment => 'amount' in item && !('invoiceNumber' in item);
const isReturn = (item: ActivityItem): item is ProductReturn => 'originalInvoiceNumber' in item;

export function CustomerActivity({ activity }: CustomerActivityProps) {
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
        const createdAt = safeToDate(item.createdAt!);
        const formattedDate = format(createdAt, 'd MMM yyyy, HH:mm', { locale: fr });
        
        if (isSale(item)) {
           const Icon = item.breadOrderDate ? Truck : ShoppingBag;
           const title = item.breadOrderDate ? `Commande de pain` : `Achat - Facture #${item.invoiceNumber}`;
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
                <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-lg">{formatCurrency(item.total)}</span>
                         <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            item.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            item.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
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
                  <Undo2 className="h-5 w-5 text-orange-600" />
                </TimelineIcon>
                <TimelineTitle>Retour sur Facture #{item.originalInvoiceNumber}</TimelineTitle>
                 <span className="text-sm text-muted-foreground ml-auto">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div className="p-4 bg-orange-100/50 rounded-lg">
                     <p className="font-semibold text-lg text-orange-700">- {formatCurrency(item.totalReturnValue)}</p>
                     <p className="text-sm text-muted-foreground">{item.items.length} article(s) retourné(s). Remboursé: {formatCurrency(item.amountRefunded)}</p>
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
                  <HandCoins className="h-5 w-5 text-green-600" />
                </TimelineIcon>
                <TimelineTitle>Paiement reçu</TimelineTitle>
                 <span className="text-sm text-muted-foreground ml-auto">{formattedDate}</span>
              </TimelineHeader>
               <TimelineBody>
                <div className="p-4 bg-green-100/50 rounded-lg">
                     <p className="font-semibold text-lg text-green-700">{formatCurrency(item.amount)}</p>
                     <p className="text-sm text-muted-foreground">Paiement enregistré.</p>
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
