'use client';

import { v4 as uuidv4 } from 'uuid';
import type { BreadClient, BreadOrder, CartItem, Customer } from '@/lib/types';
import { breadRepository } from '@/repositories/bread.repository';
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

    async getCustomersByUuids(uuids: string[]): Promise<Customer[]> {
        return breadRepository.getCustomersByUuids(uuids);
    }
    
    // --- Orders ---
    
    async generateAndGetOrdersForDate(date: string): Promise<any[]> {
        const ordersExist = await breadRepository.ordersExistForDate(date);
        if (!ordersExist) {
            await this.createDayOrders(date);
        }
        return breadRepository.getOrdersForDate(date);
    }
    
    async addManualBreadOrder(breadClientUuid: string, date: string, quantity: number): Promise<BreadOrder> {
        const existingOrder = await breadRepository.findClientOrderForDate(breadClientUuid, date);
        if (existingOrder) {
            throw new Error("Une commande existe déjà pour ce client à cette date.");
        }

        const newOrder: BreadOrder = {
            uuid: uuidv4(),
            user_id: 'user_id_placeholder',
            breadClientUuid,
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
    
    async getOrdersByUuids(orderUuids: string[]): Promise<BreadOrder[]> {
        return breadRepository.getOrdersByUuids(orderUuids);
    }

    async updateOrder(uuid: string, data: Partial<BreadOrder>): Promise<void> {
        return breadRepository.updateOrder(uuid, data);
    }
}

export const breadService = new BreadService();
