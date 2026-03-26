
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { BreadOrder, CartItem } from '@/lib/types';
import { breadOrderRepository } from '@/repositories/breadOrder.repository';
import { salesService } from './sales.service';
import { useAppStore } from '@/stores/appStore';

class BreadService {
    
    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }
    
    async getOrdersForDate(date: string): Promise<BreadOrder[]> {
        try {
            return await breadOrderRepository.getOrdersForDate(date);
        } catch (error) {
            throw error;
        }
    }
    
    async addOrder(data: { orderName: string, quantite: number, date: string }): Promise<BreadOrder> {
        try {
            const newOrder: BreadOrder = {
                uuid: uuidv4(),
                user_id: this.getUserId(),
                orderName: data.orderName,
                date: data.date,
                quantite: data.quantite,
                est_paye: false,
                est_livre: false,
                venteUuid: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            
            return await breadOrderRepository.addOrder(newOrder);
        } catch (error) {
            throw error;
        }
    }

    async updateOrder(uuid: string, data: Partial<BreadOrder>): Promise<void> {
        try {
            await breadOrderRepository.updateOrder(uuid, { ...data, updatedAt: new Date() });
        } catch (error) {
            throw error;
        }
    }

    async bulkDeleteOrders(uuids: string[]): Promise<void> {
        try {
            await breadOrderRepository.bulkDelete(uuids);
        } catch (error) {
            throw error;
        }
    }

    async convertBreadOrdersToSales(orderUuids: string[], breadPrice: number): Promise<void> {
        try {
            const orders = await breadOrderRepository.getOrdersByUuids(orderUuids);
            
            // Regrouper par nom pour créer une vente par entité
            const ordersByName = orders.reduce((acc, order) => {
                if (!acc[order.orderName]) acc[order.orderName] = [];
                acc[order.orderName].push(order);
                return acc;
            }, {} as Record<string, BreadOrder[]>);
            
            for (const [name, customerOrders] of Object.entries(ordersByName)) {
                const totalQuantity = customerOrders.reduce((sum, o) => sum + o.quantite, 0);

                if (totalQuantity <= 0) continue;

                // Créer un item de panier virtuel pour le pain
                const breadCartItem: CartItem = {
                    uuid: 'BREAD_PRODUCT',
                    user_id: this.getUserId(),
                    name: `Pain (${name})`,
                    price: breadPrice,
                    purchasePrice: 0, 
                    quantity: Infinity,
                    cartQuantity: totalQuantity,
                    minStockLevel: 0,
                };

                // Créer la vente (Vente de passage car pas de client lié)
                const sale = await salesService.createSale({
                    items: [breadCartItem],
                    discountType: 'fixed',
                    discountValue: 0,
                    amountPaid: 0, // Vente à crédit par défaut pour le pain si non payé d'avance
                    payments: [],
                    customerUuid: null, // Client de passage
                });

                // Marquer les commandes comme payées et liées à cette vente
                await breadOrderRepository.bulkUpdateSaleRelation(
                    customerOrders.map(o => o.uuid),
                    sale.uuid
                );
            }
        } catch (error) {
            throw error;
        }
    }
}

export const breadService = new BreadService();
