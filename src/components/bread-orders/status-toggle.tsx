
'use client';

import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

interface StatusToggleProps {
    userId: string;
    orderId: string;
    field: 'isPaid' | 'isDelivered';
    currentStatus: boolean;
}

export function StatusToggle({ userId, orderId, field, currentStatus }: StatusToggleProps) {
    const firestore = useFirestore();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
        if (!firestore) {
            toast.error("Le service de base de données n'est pas disponible.");
            return;
        }
        setIsLoading(true);
        const orderDocRef = doc(firestore, 'users', userId, 'breadOrders', orderId);
        
        updateDocumentNonBlocking(orderDocRef, {
            [field]: !currentStatus
        }, {
            onSuccess: () => {
                setIsLoading(false);
                toast.success(`Statut mis à jour.`);
            },
            onError: (err) => {
                setIsLoading(false);
                toast.error(`Échec de la mise à jour du statut.`);
                console.error(err);
            }
        });
    };

    if (isLoading) {
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }

    return (
        <button onClick={handleClick} className="flex items-center justify-center">
            {currentStatus ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
                <XCircle className="h-5 w-5 text-red-500" />
            )}
        </button>
    );
}
