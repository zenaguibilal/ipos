'use client';

import React from 'react';
import type { Sale, Payment } from '@/lib/types';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from '@/components/ui/timeline';
import { safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HandCoins, ShoppingBag, Receipt, Truck } from 'lucide-react';

interface CustomerActivityProps {
  activity: (Sale | Payment)[];
}

const isSale = (item: Sale | Payment): item is Sale => {
    return 'invoiceNumber' in item;
};

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
                 <span className="text-sm text-muted-foreground ml-auto">{format(safeToDate(item.createdAt!), 'd MMM yyyy, HH:mm', { locale: fr })}</span>
              </TimelineHeader>
              <TimelineBody>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-lg">{item.total.toFixed(1)} DA</span>
                         <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            item.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            item.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {item.paymentStatus === 'paid' ? 'Payé' : item.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                        </span>
                    </div>
                     <p className="text-sm text-muted-foreground">
                        {item.items.length} article(s). {item.paymentStatus !== 'paid' && `Solde restant: ${item.remainingBalance.toFixed(1)} DA`}
                    </p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        } else {
          return (
             <TimelineItem key={`payment-${item.id}`}>
               {!isLast && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>
                  <HandCoins className="h-5 w-5 text-green-600" />
                </TimelineIcon>
                <TimelineTitle>Paiement reçu</TimelineTitle>
                 <span className="text-sm text-muted-foreground ml-auto">{format(safeToDate(item.createdAt!), 'd MMM yyyy, HH:mm', { locale: fr })}</span>
              </TimelineHeader>
               <TimelineBody>
                <div className="p-4 bg-green-100/50 rounded-lg">
                     <p className="font-semibold text-lg text-green-700">{item.amount.toFixed(1)} DA</p>
                     <p className="text-sm text-muted-foreground">Paiement enregistré.</p>
                </div>
              </TimelineBody>
            </TimelineItem>
          );
        }
      })}
    </Timeline>
  );
}
