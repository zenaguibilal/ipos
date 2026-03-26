
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { BreadOrder, CartItem, Customer } from '@/lib/types';
import { breadOrderRepository } from '@/repositories/breadOrder.repository';
import { salesService } from './sales.service';
import { customerRepository } from '@/repositories/customer.repository';
import { useAppStore } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

class BreadService {
    
    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("Utilisateur non authentifié");
        }
        return session.user.id;
    }
    
    async getOrdersForDate(date: string): Promise<BreadOrder[]> {
        try {
            return await breadOrderRepository.getOrdersForDate(date);
        } catch (error) {
            console.error("Error fetching orders for date:", error);
            throw error;
        }
    }
    
    async addOrder(data: { orderName: string, quantite: number, date: string, customerUuid?: string | null }): Promise<BreadOrder> {
        try {
            const newOrder: BreadOrder = {
                uuid: uuidv4(),
                user_id: this.getUserId(),
                customerUuid: data.customerUuid || null,
                orderName: data.orderName,
                date: data.date,
                quantite: data.quantite,
                quantite_origine: data.quantite,
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

    async generateOrdersFromRecurrence(date: string): Promise<number> {
        try {
            // Récupérer tous les clients qui ont l'option Pain activée
            const customersResult = await customerRepository.filter({ status: 'is_bread_client' });
            const customers = customersResult.data;
            
            // Récupérer les commandes existantes pour cette date pour éviter les doublons
            const existingOrders = await this.getOrdersForDate(date);
            const existingCustomerUuids = new Set(existingOrders.map(o => o.customerUuid).filter(Boolean));

            // Déterminer le jour de la semaine en français minuscule (lundi, mardi...)
            const dateObj = new Date(date.replace(/-/g, '/'));
            const dayOfWeek = format(dateObj, 'eeee', { locale: fr }).toLowerCase();
            
            let count = 0;

            for (const customer of customers) {
                // Sauter si le client a déjà une commande pour ce jour
                if (existingCustomerUuids.has(customer.uuid)) continue;

                let quantity = 0;
                if (customer.bread_type_recurrence === 'quotidien') {
                    quantity = customer.bread_quantite_defaut || 0;
                } else if (customer.bread_type_recurrence === 'jours_specifiques') {
                    const settings = customer.bread_jours_semaine?.[dayOfWeek];
                    if (settings?.actif) {
                        quantity = settings.quantite;
                    }
                }

                if (quantity > 0) {
                    await this.addOrder({
                        date,
                        customerUuid: customer.uuid,
                        orderName: `${customer.firstName} ${customer.lastName}`,
                        quantite: quantity
                    });
                    count++;
                }
            }
            return count;
        } catch (error) {
            console.error("Error generating bread orders:", error);
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

    /**
     * Convertit une sélection de commandes en ventes réelles.
     * Les commandes sont groupées par client pour générer une seule facture par client par jour.
     */
    async convertBreadOrdersToSales(orderUuids: string[], breadPrice: number): Promise<void> {
        try {
            const orders = await breadOrderRepository.getOrdersByUuids(orderUuids);
            // Filtrer uniquement les commandes non facturées
            const ordersToProcess = orders.filter(o => !o.venteUuid);
            
            if (ordersToProcess.length === 0) return;

            // Grouper par UUID de client (ou par nom de commande si pas de client lié)
            const grouped = ordersToProcess.reduce((acc, order) => {
                const key = order.customerUuid || `NAME_${order.orderName}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(order);
                return acc;
            }, {} as Record<string, BreadOrder[]>);
            
            for (const [key, customerOrders] of Object.entries(grouped)) {
                const totalQuantity = customerOrders.reduce((sum, o) => sum + o.quantite, 0);
                if (totalQuantity <= 0) continue;

                const firstOrder = customerOrders[0];
                const customerUuid = key.startsWith('NAME_') ? null : key;

                // Création d'un article de panier virtuel pour la vente
                const breadCartItem: CartItem = {
                    uuid: 'BREAD_PRODUCT',
                    user_id: this.getUserId(),
                    name: `Distribution Pain (${firstOrder.orderName})`,
                    price: breadPrice,
                    purchasePrice: 0, 
                    quantity: Infinity,
                    cartQuantity: totalQuantity,
                    minStockLevel: 0,
                    category: 'Boulangerie'
                };

                // Enregistrement de la vente (par défaut à crédit pour les clients fidèles)
                const sale = await salesService.createSale({
                    items: [breadCartItem],
                    discountType: 'fixed',
                    discountValue: 0,
                    amountPaid: 0, // Ajouté à la dette par défaut
                    payments: [],
                    customerUuid: customerUuid,
                });

                // Mettre à jour les commandes pour les lier à cette vente
                await breadOrderRepository.bulkUpdateSaleRelation(
                    customerOrders.map(o => o.uuid),
                    sale.uuid
                );
            }
        } catch (error) {
            console.error("Error converting bread orders to sales:", error);
            throw error;
        }
    }
}

export const breadService = new BreadService();
