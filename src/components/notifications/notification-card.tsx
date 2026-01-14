
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, User, ArrowRight } from 'lucide-react';
import type { NotificationItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NotificationCardProps {
    notification: NotificationItem;
}

export function NotificationCard({ notification }: NotificationCardProps) {
    const router = useRouter();

    const handleActionClick = () => {
        if (notification.type === 'stock') {
            router.push('/products');
        } else if (notification.type === 'payment') {
            router.push(`/customers/${notification.relatedId}`);
        }
    };

    const isStock = notification.type === 'stock';

    return (
        <Card className={cn(
            "flex flex-col justify-between",
            isStock ? "bg-yellow-500/10 border-yellow-500/30" : "bg-destructive/10 border-destructive/50"
        )}>
            <CardHeader className="flex-row items-start gap-4 space-y-0">
                <div className={cn(
                    "w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center",
                    isStock ? "bg-yellow-500/20" : "bg-destructive/20"
                )}>
                    {isStock ? 
                        <Archive className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /> : 
                        <User className="h-5 w-5 text-destructive" />
                    }
                </div>
                <div className="flex-1">
                    <CardTitle className="text-base font-bold mb-1">
                        {isStock ? 'Alerte de Stock Faible' : 'Alerte de Paiement'}
                    </CardTitle>
                    <CardDescription className={cn(
                        isStock ? "text-yellow-800 dark:text-yellow-300" : "text-destructive"
                    )}>
                        {notification.message}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardFooter>
                <Button variant="outline" size="sm" className="w-full" onClick={handleActionClick}>
                    {isStock ? 'Voir les produits' : 'Voir le client'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
