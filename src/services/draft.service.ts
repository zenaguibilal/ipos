'use client';

import { db } from '@/lib/database';
import type { Cart, Draft } from '@/lib/types';
import { toast } from 'sonner';
import { calculateCartTotals } from '@/lib/utils';

export class DraftService {
    async saveCartAsDraft(cart: Cart): Promise<void> {
        if (cart.items.length === 0) {
            toast.error("Impossible de sauvegarder un panier vide.");
            return;
        }
        const { total } = calculateCartTotals(cart);
        const draft: Draft = {
            date: new Date(),
            customerId: cart.customerId,
            customerName: cart.customerName,
            items: cart.items,
            total: total,
            discount: cart.discount,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await db.drafts.add(draft);
        toast.success("Brouillon sauvegardé.");
    }
    
    async loadDraftToCart(draftId: number, cartId: string): Promise<void> {
        await db.transaction('rw', db.carts, db.drafts, async () => {
            const draft = await db.drafts.get(draftId);
            if (!draft) {
                throw new Error("Brouillon non trouvé.");
            }
            await db.carts.update(cartId, {
                items: draft.items,
                customerId: draft.customerId,
                customerName: draft.customerName,
                discount: draft.discount,
            });
            await db.drafts.delete(draftId);
            toast.success("Brouillon chargé dans le panier actif.");
        });
    }
    
    async deleteDraft(draftId: number): Promise<void> {
        await db.drafts.delete(draftId);
    }
}
