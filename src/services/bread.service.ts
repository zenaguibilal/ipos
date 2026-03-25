'use client';

import { v4 as uuidv4 } from 'uuid';
import type { BreadOrder, Customer, CartItem } from '@/lib/types';
import { customerRepository } from '@/repositories/customer.repository';
import { breadOrderRepository } from '@/repositories/breadOrder.repository';
import { salesService } from './sales.service';
import { customerService } from './customer.service';
import { useAppStore } from '@/stores/appStore';
import { BREAD_WEEK_DAYS } from '@/lib/constants';

class BreadService {
    
    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }
    
    async generateAndGetOrdersForDate(date: string) {
        try {
            const ordersExist = await breadOrderRepository.ordersExistForDate(date);
            if (!ordersExist) {
                await this.createDayOrders(date);
            }
            return await breadOrderRepository.getOrdersForDate(date);
        } catch (error) {
            throw error;
        }
    }
    
    async createDayOrders(date: string): Promise<void> {
        try {
            const dayOfWeek = BREAD_WEEK_DAYS[new Date(date.replace(/-/g, '/')).getDay()];
            const activeBreadClients = await customerRepository.filter({ status: 'is_bread_client' });
            
            const ordersToCreate: BreadOrder[] = [];
            
            for (const client of activeBreadClients) {
                if (client.bread_type_recurrence === 'aucun') continue;

                let quantity = 0;
                if (client.bread_type_recurrence === 'quotidien') {
                    quantity = client.bread_quantite_defaut || 0;
                } else if (client.bread_type_recurrence === 'jours_specifiques' && client.bread_jours_semaine?.[dayOfWeek]?.actif) {
                    quantity = client.bread_jours_semaine[dayOfWeek].quantite || 0;
                }

                if (quantity > 0) {
                     ordersToCreate.push({
                        uuid: uuidv4(),
                        user_id: this.getUserId(),
                        customerUuid: client.uuid,
                        date: date,
                        quantite: quantity,
                        est_paye: false,
                        est_livre: false,
                        venteUuid: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }

            if (ordersToCreate.length > 0) {
                await breadOrderRepository.bulkAddOrders(ordersToCreate);
            }
        } catch (error) {
            throw error;
        }
    }
    
    async addManualBreadOrder(customerUuid: string, date: string, quantity: number): Promise<BreadOrder> {
        try {
            const existingOrder = await breadOrderRepository.findClientOrderForDate(customerUuid, date);
            if (existingOrder) {
                throw new Error("Une commande existe déjà pour ce client à cette date.");
            }

            const newOrder: BreadOrder = {
                uuid: uuidv4(),
                user_id: this.getUserId(),
                customerUuid,
                date,
                quantite: quantity,
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

    async updateBreadOrderQuantity(uuid: string, quantity: number): Promise<void> {
        try {
            const order = await breadOrderRepository.findOrderByUuid(uuid);
            if(!order) return;

            const updateData: Partial<BreadOrder> = { quantite: quantity, updatedAt: new Date() };
            if (order.quantite_origine === undefined) {
                updateData.quantite_origine = order.quantite;
            }
            await breadOrderRepository.updateOrder(uuid, updateData);
        } catch (error) {
            throw error;
        }
    }
    
     async updateBreadOrderDeliveryStatus(uuid: string, delivered: boolean): Promise<void> {
        try {
            await breadOrderRepository.updateOrder(uuid, { est_livre: delivered, updatedAt: new Date() });
        } catch (error) {
            throw error;
        }
    }

    async convertBreadOrdersToSales(orderUuids: string[], breadPrice: number): Promise<void> {
        try {
            const orders = await breadOrderRepository.getOrdersByUuids(orderUuids);
            const customerUuids = [...new Set(orders.map(o => o.customerUuid))];
            
            for (const customerUuid of customerUuids) {
                const customerOrders = orders.filter(o => o.customerUuid === customerUuid);
                const totalQuantity = customerOrders.reduce((sum, o) => sum + o.quantite, 0);

                if (totalQuantity <= 0) continue;

                const breadCartItem: CartItem = {
                    uuid: 'BREAD_PRODUCT',
                    user_id: this.getUserId(),
                    name: 'Pain',
                    price: breadPrice,
                    purchasePrice: 0, 
                    quantity: Infinity,
                    cartQuantity: totalQuantity,
                    minStockLevel: 0,
                };

                const sale = await salesService.createSale({
                    items: [breadCartItem],
                    discountType: 'fixed',
                    discountValue: 0,
                    amountPaid: 0,
                    payments: [],
                    customerUuid: customerUuid,
                });

                await breadOrderRepository.bulkUpdateSaleRelation(
                    customerOrders.map(o => o.uuid),
                    sale.uuid
                );
                
                await customerService.recalculateCustomerStatus(customerUuid);
            }
        } catch (error) {
            throw error;
        }
    }
}

export const breadService = new BreadService();
