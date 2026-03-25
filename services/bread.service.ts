'use client';

import { v4 as uuidv4 } from 'uuid';
import type { BreadClient, BreadOrder, CartItem } from '@/lib/types';
import { breadRepository } from '@/repositories';
import { salesService } from './sales.service';
import { BREAD_WEEK_DAYS } from '@/lib/constants';

class BreadService {

    // == Client Management ==
    async addBreadClient(clientData: Partial<BreadClient>): Promise<BreadClient> {
        const newClient: BreadClient = {
            ...clientData,
            uuid: uuidv4(),
            user_id: 'user_id_placeholder', // This will be set by the repository layer
            nom: clientData.nom!,
            actif: clientData.actif !== false,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as BreadClient;

        return await breadRepository.addClient(newClient);
    }
    
    async updateBreadClient(uuid: string, clientData: Partial<BreadClient>): Promise<BreadClient> {
        const data = { ...clientData, updatedAt: new Date() };
        return breadRepository.updateClient(uuid, data);
    }

    async deleteBreadClient(uuid: string): Promise<void> {
        // The repository should handle this atomicity.
        await breadRepository.deleteClientWithOrders(uuid);
    }
    
    async getBreadClients(): Promise<BreadClient[]> {
        return breadRepository.getAllClients();
    }
    
    async getManualClients(): Promise<BreadClient[]> {
        return breadRepository.getManualClients();
    }

    // == Order Management ==
    
    async generateAndGetOrdersForDate(date: string): Promise<any[]> {
        const ordersExist = await breadRepository.ordersExistForDate(date);
        if (!ordersExist) {
            await this.createDayOrders(date);
        }
        return breadRepository.getOrdersForDate(date);
    }
    
    async addManualBreadOrder(clientUuid: string, date: string, quantity: number): Promise<BreadOrder> {
        const existingOrder = await breadRepository.findClientOrderForDate(clientUuid, date);
        if (existingOrder) {
            throw new Error("Une commande existe déjà pour ce client à cette date.");
        }

        const newOrder: BreadOrder = {
            uuid: uuidv4(),
            user_id: 'user_id_placeholder',
            breadClientUuid: clientUuid,
            date,
            quantite: quantity,
            est_paye: false,
            est_livre: false,
            venteUuid: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        
        return await breadRepository.addOrder(newOrder);
    }

    async updateBreadOrderQuantity(uuid: string, quantity: number): Promise<void> {
        const order = await breadRepository.findOrderByUuid(uuid);
        if(!order) return;

        const updateData: Partial<BreadOrder> = { quantite: quantity, updatedAt: new Date() };
        if (order.quantite_origine === undefined) {
            updateData.quantite_origine = order.quantite;
        }
        await breadRepository.updateOrder(uuid, updateData);
    }
    
     async updateBreadOrderDeliveryStatus(uuid: string, delivered: boolean): Promise<void> {
        await breadRepository.updateOrder(uuid, { est_livre: delivered, updatedAt: new Date() });
    }
    
    async createDayOrders(date: string): Promise<void> {
        const dayOfWeek = BREAD_WEEK_DAYS[new Date(date.replace(/-/g, '/')).getDay()];
        const activeClients = await breadRepository.getActiveClients();
        
        const ordersToCreate: BreadOrder[] = [];
        
        for (const client of activeClients) {
            let quantity = 0;
            if (client.type_recurrence === 'quotidien') {
                quantity = client.quantite_defaut || 0;
            } else if (client.type_recurrence === 'jours_specifiques' && client.jours_semaine?.[dayOfWeek]?.actif) {
                quantity = client.jours_semaine[dayOfWeek].quantite || 0;
            }

            if (quantity > 0) {
                 ordersToCreate.push({
                    uuid: uuidv4(),
                    user_id: 'user_id_placeholder',
                    breadClientUuid: client.uuid,
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
            await breadRepository.bulkAddOrders(ordersToCreate);
        }
    }
    
    async convertBreadOrdersToSales(orderUuids: string[], breadPrice: number): Promise<void> {
        const orders = await breadRepository.getOrdersByUuids(orderUuids);
        const customerUuids = [...new Set(orders.map(o => o.breadClientUuid))];
        const customers = await breadRepository.getCustomersByUuids(customerUuids);
        const customerMap = new Map(customers.map(c => [c.uuid, c]));
        
        for (const order of orders) {
            if (order.venteUuid) continue; // Already converted

            const customer = customerMap.get(order.breadClientUuid);
            
            const cartItem: CartItem = {
                uuid: 'BREAD_PRODUCT', // Special ID for bread
                user_id: 'system',
                name: 'Pain',
                price: breadPrice,
                purchasePrice: 0,
                quantity: Infinity, // Unlimited stock for bread
                cartQuantity: order.quantite,
                minStockLevel: 0,
            };
            
            const sale = await salesService.createSale({
                items: [cartItem],
                discountType: 'fixed',
                discountValue: 0,
                amountPaid: 0, // All bread sales are credit by default
                payments: [],
                customerUuid: customer?.uuid,
                customerName: customer?.searchName,
            });
            
            await breadRepository.updateOrder(order.uuid, { 
                venteUuid: sale.uuid,
                est_paye: true,
                updatedAt: new Date()
            });
        }
    }
}

export const breadService = new BreadService();
