'use client';

import { db } from '@/lib/database';
import type { BreadClient, BreadOrder, BreadOrderWithClient } from '@/lib/types';
import { format } from 'date-fns';
import { processSaleTransaction } from '@/lib/sale-processor';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './sync.service';

export class BreadService {
    async getManualBreadClients(): Promise<BreadClient[]> {
        return await db.clients_pain.where({type_recurrence: 'aucun', actif: true})
            .and(c => c.sync_status !== 'pending_delete').toArray();
    }
    
    async addManualBreadOrder(clientUuid: string, date: string, quantity: number): Promise<BreadOrder> {
        return await db.transaction('rw', db.commandes_pain, db.sync_queue, async () => {
            const existingOrder = await db.commandes_pain.where({ clientPainUuid: clientUuid, date }).first();
            if (existingOrder) {
                throw new Error("Une commande manuelle existe déjà pour ce client aujourd'hui.");
            }
            
            const now = new Date();
            const uuid = uuidv4();
            const order: BreadOrder = {
                clientPainUuid: clientUuid,
                date,
                quantite: quantity,
                est_paye: false,
                est_livre: false,
                vente_id: null,
                uuid,
                createdAt: now,
                updatedAt: now,
                sync_status: 'pending_create',
                last_modified_by: syncService.getLocalDeviceId(),
            };
            const id = await db.commandes_pain.add(order);
            await syncService.queueSyncOperation('commandes_pain', uuid, 'create', { ...order, id: undefined });
            return { ...order, id };
        });
    }
    
    async updateBreadOrderQuantity(orderId: number, newQuantity: number): Promise<void> {
        const order = await db.commandes_pain.get(orderId);
        if (!order) return;

        const updateData = {
            quantite: newQuantity,
            quantite_origine: order.quantite_origine === undefined ? order.quantite : order.quantite_origine,
            updatedAt: new Date(),
            sync_status: order.sync_status === 'pending_create' ? 'pending_create' : 'pending_update' as const,
            last_modified_by: syncService.getLocalDeviceId(),
        };

        await db.commandes_pain.update(orderId, updateData);
        await syncService.queueSyncOperation('commandes_pain', order.uuid!, 'update', updateData);
    }

    async updateBreadOrderDeliveryStatus(orderId: number, delivered: boolean): Promise<void> {
        const order = await db.commandes_pain.get(orderId);
        if (!order) return;
        
        const updateData = {
            est_livre: delivered, 
            updatedAt: new Date(),
            sync_status: order.sync_status === 'pending_create' ? 'pending_create' : 'pending_update' as const,
            last_modified_by: syncService.getLocalDeviceId(),
        };

        await db.commandes_pain.update(orderId, updateData);
        await syncService.queueSyncOperation('commandes_pain', order.uuid!, 'update', updateData);
    }
    
    async getBreadClients(): Promise<BreadClient[]> {
        return await db.clients_pain.where('sync_status').notEqual('pending_delete').orderBy('nom').toArray();
    }
    
    async addBreadClient(client: Omit<BreadClient, 'id'>): Promise<BreadClient> {
        const now = new Date();
        const uuid = uuidv4();
        const newClient = { 
            ...client, 
            uuid,
            createdAt: now, 
            updatedAt: now,
            sync_status: 'pending_create' as const,
            last_modified_by: syncService.getLocalDeviceId(),
        };
        const id = await db.clients_pain.add(newClient as BreadClient);
        await syncService.queueSyncOperation('clients_pain', uuid, 'create', { ...newClient, id: undefined });
        return { ...newClient, id };
    }

    async updateBreadClient(id: number, data: Partial<BreadClient>): Promise<void> {
        const client = await db.clients_pain.get(id);
        if(!client) return;

        const updateData = {
            ...data, 
            updatedAt: new Date(),
            sync_status: client.sync_status === 'pending_create' ? 'pending_create' : 'pending_update' as const,
            last_modified_by: syncService.getLocalDeviceId(),
        };

        await db.clients_pain.update(id, updateData);
        await syncService.queueSyncOperation('clients_pain', client.uuid!, 'update', updateData);
    }

    async deleteBreadClient(id: number): Promise<void> {
        await db.transaction('rw', db.clients_pain, db.commandes_pain, db.sync_queue, async () => {
            const client = await db.clients_pain.get(id);
            if (!client || !client.uuid) return;
            
            const orders = await db.commandes_pain.where('clientPainUuid').equals(client.uuid).toArray();
            for(const order of orders) {
                if (order.uuid) {
                    await db.commandes_pain.update(order.id!, { sync_status: 'pending_delete', updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
                    await syncService.queueSyncOperation('commandes_pain', order.uuid, 'delete', {});
                }
            }

            await db.clients_pain.update(id, { sync_status: 'pending_delete', updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
            await syncService.queueSyncOperation('clients_pain', client.uuid!, 'delete', {});
        });
    }
    
    async checkIfBreadOrdersExist(date: string): Promise<boolean> {
        const count = await db.commandes_pain.where({date}).and(o => o.sync_status !== 'pending_delete').count();
        return count > 0;
    }
    
    async createDayOrders(date: string): Promise<void> {
        const weekDay = format(new Date(date.replace(/-/g, '/')), 'eeee').toLowerCase() as keyof NonNullable<BreadClient['jours_semaine']>;

        const dailyClients = await db.clients_pain
            .where({type_recurrence: 'quotidien', actif: true})
            .and(c => c.sync_status !== 'pending_delete')
            .toArray();

        const specificDayClients = await db.clients_pain
            .where({type_recurrence: 'jours_specifiques', actif: true})
            .and(c => c.sync_status !== 'pending_delete' && c.jours_semaine?.[weekDay]?.actif === true)
            .toArray();

        const now = new Date();
        const deviceId = syncService.getLocalDeviceId();
        const orders: Omit<BreadOrder, 'id'>[] = [];
        
        dailyClients.forEach(c => {
            if (c.quantite_defaut && c.quantite_defaut > 0 && c.uuid) {
                orders.push({
                    clientPainUuid: c.uuid,
                    date,
                    quantite: c.quantite_defaut,
                    est_paye: false, est_livre: false, vente_id: null,
                    uuid: uuidv4(),
                    createdAt: now, updatedAt: now,
                    sync_status: 'pending_create',
                    last_modified_by: deviceId,
                });
            }
        });

        specificDayClients.forEach(c => {
            if (c.jours_semaine?.[weekDay].quantite && c.jours_semaine[weekDay].quantite > 0 && c.uuid) {
                orders.push({
                    clientPainUuid: c.uuid,
                    date,
                    quantite: c.jours_semaine[weekDay].quantite,
                    est_paye: false, est_livre: false, vente_id: null,
                    uuid: uuidv4(),
                    createdAt: now, updatedAt: now,
                    sync_status: 'pending_create',
                    last_modified_by: deviceId,
                });
            }
        });

        if (orders.length > 0) {
            await db.commandes_pain.bulkAdd(orders as BreadOrder[]);
            for (const order of orders) {
                 await syncService.queueSyncOperation('commandes_pain', order.uuid!, 'create', order);
            }
        }
    }
    
    async getBreadOrdersForDate(date: string): Promise<BreadOrderWithClient[]> {
        const orders = await db.commandes_pain.where({date}).and(o => o.sync_status !== 'pending_delete').toArray();
        const clientUuids = [...new Set(orders.map(o => o.clientPainUuid))];
        const clients = await db.clients_pain.where('uuid').anyOf(clientUuids).toArray();
        const clientMap = new Map(clients.map(c => [c.uuid, c]));

        return orders
            .map(order => ({
                ...order,
                client: clientMap.get(order.clientPainUuid),
            }))
            .filter((order): order is BreadOrderWithClient => !!order.client)
            .sort((a,b) => a.client.nom.localeCompare(b.client.nom));
    }
    
    async convertBreadOrdersToSales(orderIds: number[], breadPrice: number): Promise<void> {
        const breadProduct = await db.products.where('name').equalsIgnoreCase('pain').and(p => p.sync_status !== 'pending_delete').first();
        if (!breadProduct) {
            throw new Error("Produit 'Pain' non trouvé. Veuillez le créer avant de continuer.");
        }
        if (!breadProduct.id || typeof breadProduct.id !== 'number') {
             throw new Error("L'ID du produit 'Pain' est invalide.");
        }

        await db.transaction('rw', db.commandes_pain, db.sales, db.customers, db.products, db.sync_queue, async () => {
            const orders = await db.commandes_pain.bulkGet(orderIds);
            
            for (const order of orders) {
                if (!order || order.vente_id) continue;
                
                const client = await db.clients_pain.where({ uuid: order.clientPainUuid }).first();
                const customer = client ? await db.customers.where('searchName').equals(client.nom.toLowerCase()).and(c => c.sync_status !== 'pending_delete').first() : undefined;
                
                const saleItem = {
                    id: breadProduct.id!,
                    name: breadProduct.name,
                    price: breadPrice,
                    purchasePrice: breadProduct.purchasePrice,
                    quantity: order.quantite,
                };
                
                const total = saleItem.price * saleItem.quantity;
                
                const saleData: any = {
                    items: [saleItem],
                    subtotal: total,
                    total: total,
                    amountPaid: 0,
                    payments: [],
                    clientPainUuid: order.clientPainUuid,
                    customerUuid: customer?.uuid,
                    customerName: customer?.searchName || client?.nom,
                };
                
                const { saleId } = await processSaleTransaction(saleData);
                const updateData = { 
                    vente_id: saleId, 
                    est_paye: true, 
                    updatedAt: new Date(),
                    sync_status: order.sync_status === 'pending_create' ? 'pending_create' : 'pending_update' as const,
                    last_modified_by: syncService.getLocalDeviceId(),
                };
                await db.commandes_pain.update(order.id!, updateData);
                await syncService.queueSyncOperation('commandes_pain', order.uuid!, 'update', updateData);
            }
        });
    }
}
