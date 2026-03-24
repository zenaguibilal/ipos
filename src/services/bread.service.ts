'use client';

import { db } from '@/lib/database';
import type { BreadClient, BreadOrder, BreadOrderWithClient } from '@/lib/types';
import { format } from 'date-fns';
import { salesService } from './sales.service';

export class BreadService {
    async getManualBreadClients(): Promise<BreadClient[]> {
        return await db.clients_pain.where('type_recurrence').equals('aucun').and(c => c.actif === true).toArray();
    }
    
    async addManualBreadOrder(clientId: number, date: string, quantity: number): Promise<BreadOrder> {
        return await db.transaction('rw', db.commandes_pain, async () => {
            const existingOrder = await db.commandes_pain.where({ client_pain_id: clientId, date }).first();
            if (existingOrder) {
                throw new Error("Une commande manuelle existe déjà pour ce client aujourd'hui.");
            }
            
            const order: BreadOrder = {
                client_pain_id: clientId,
                date,
                quantite: quantity,
                est_paye: false,
                est_livre: false,
                vente_id: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const id = await db.commandes_pain.add(order);
            return { ...order, id };
        });
    }
    
    async updateBreadOrderQuantity(orderId: number, newQuantity: number): Promise<void> {
        await db.commandes_pain.where('id').equals(orderId).modify(order => {
            if (order.quantite_origine === undefined) {
                order.quantite_origine = order.quantite;
            }
            order.quantite = newQuantity;
            order.updatedAt = new Date();
        });
    }

    async updateBreadOrderDeliveryStatus(orderId: number, delivered: boolean): Promise<void> {
        await db.commandes_pain.update(orderId, { est_livre: delivered, updatedAt: new Date() });
    }
    
    async getBreadClients(): Promise<BreadClient[]> {
        return await db.clients_pain.orderBy('nom').toArray();
    }
    
    async addBreadClient(client: Omit<BreadClient, 'id'>): Promise<BreadClient> {
        const now = new Date();
        const newClient = { ...client, createdAt: now, updatedAt: now };
        const id = await db.clients_pain.add(newClient as BreadClient);
        return { ...newClient, id };
    }

    async updateBreadClient(id: number, data: Partial<BreadClient>): Promise<void> {
        await db.clients_pain.update(id, { ...data, updatedAt: new Date() });
    }

    async deleteBreadClient(id: number): Promise<void> {
        await db.transaction('rw', db.clients_pain, db.commandes_pain, async () => {
            await db.commandes_pain.where('client_pain_id').equals(id).delete();
            await db.clients_pain.delete(id);
        });
    }
    
    async checkIfBreadOrdersExist(date: string): Promise<boolean> {
        const count = await db.commandes_pain.where('date').equals(date).count();
        return count > 0;
    }
    
    async createDayOrders(date: string): Promise<void> {
        const weekDay = format(new Date(date.replace(/-/g, '/')), 'eeee').toLowerCase() as keyof NonNullable<BreadClient['jours_semaine']>;

        const dailyClients = await db.clients_pain
            .where('type_recurrence').equals('quotidien')
            .and(c => c.actif === true)
            .toArray();

        const specificDayClients = await db.clients_pain
            .where('type_recurrence').equals('jours_specifiques')
            .and(c => c.actif === true && c.jours_semaine?.[weekDay]?.actif === true)
            .toArray();

        const orders: Omit<BreadOrder, 'id'>[] = [];
        
        dailyClients.forEach(c => {
            if (c.quantite_defaut && c.quantite_defaut > 0) {
                orders.push({
                    client_pain_id: c.id!,
                    date,
                    quantite: c.quantite_defaut,
                    est_paye: false, est_livre: false, vente_id: null,
                    createdAt: new Date(), updatedAt: new Date(),
                });
            }
        });

        specificDayClients.forEach(c => {
            if (c.jours_semaine?.[weekDay].quantite && c.jours_semaine[weekDay].quantite > 0) {
                orders.push({
                    client_pain_id: c.id!,
                    date,
                    quantite: c.jours_semaine[weekDay].quantite,
                    est_paye: false, est_livre: false, vente_id: null,
                    createdAt: new Date(), updatedAt: new Date(),
                });
            }
        });

        if (orders.length > 0) {
            await db.commandes_pain.bulkAdd(orders as BreadOrder[]);
        }
    }
    
    async getBreadOrdersForDate(date: string): Promise<BreadOrderWithClient[]> {
        const orders = await db.commandes_pain.where('date').equals(date).toArray();
        const clientIds = [...new Set(orders.map(o => o.client_pain_id))];
        const clients = await db.clients_pain.bulkGet(clientIds);
        const clientMap = new Map(clients.map(c => c && [c.id, c]).filter(Boolean) as [number, BreadClient][]);

        return orders
            .map(order => ({
                ...order,
                client: clientMap.get(order.client_pain_id),
            }))
            .filter((order): order is BreadOrderWithClient => !!order.client)
            .sort((a,b) => a.client.nom.localeCompare(b.client.nom));
    }
    
    async convertBreadOrdersToSales(orderIds: number[], breadPrice: number): Promise<void> {
        const breadProduct = await db.products.where('name').equalsIgnoreCase('pain').first();
        if (!breadProduct) {
            throw new Error("Produit 'Pain' non trouvé. Veuillez le créer avant de continuer.");
        }
        if (!breadProduct.id || typeof breadProduct.id !== 'number') {
             throw new Error("L'ID du produit 'Pain' est invalide.");
        }

        await db.transaction('rw', db.commandes_pain, db.sales, db.customers, db.products, async () => {
            const orders = await db.commandes_pain.bulkGet(orderIds);
            
            for (const order of orders) {
                if (!order || order.vente_id) continue;
                
                const client = await db.clients_pain.get(order.client_pain_id);
                const customer = client ? await db.customers.where('searchName').equals(client.nom.toLowerCase()).first() : undefined;
                
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
                    clientPainId: order.client_pain_id,
                    customerId: customer?.id,
                    customerName: customer?.searchName || client?.nom,
                    dueDate: customer?.settlementDay ? new Date(new Date().getTime() + customer.settlementDay * 86400000) : undefined,
                };
                
                const { saleId } = await salesService._processSale(saleData);
                await db.commandes_pain.update(order.id!, { vente_id: saleId, est_paye: true });
            }
        });
    }
}
