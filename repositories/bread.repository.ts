// This is a placeholder for the Supabase repository.
// It's designed to throw errors if used before being implemented.
import type { BreadClient, BreadOrder, BreadOrderWithClient, Customer } from '@/lib/types';

const NOT_IMPLEMENTED = "Repository not implemented. Backend connection is required.";

class BreadRepository {
    async getAllClients(): Promise<BreadClient[]> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async getActiveClients(): Promise<BreadClient[]> {
         throw new Error(NOT_IMPLEMENTED);
    }
    
    async getManualClients(): Promise<BreadClient[]> {
         throw new Error(NOT_IMPLEMENTED);
    }

    async addClient(client: BreadClient): Promise<BreadClient> {
         throw new Error(NOT_IMPLEMENTED);
    }

    async updateClient(uuid: string, data: Partial<BreadClient>): Promise<BreadClient> {
         throw new Error(NOT_IMPLEMENTED);
    }
    
    async findClientByUuid(uuid: string): Promise<BreadClient | undefined> {
         throw new Error(NOT_IMPLEMENTED);
    }

    async deleteClient(uuid: string): Promise<void> {
         throw new Error(NOT_IMPLEMENTED);
    }
    
    async deleteClientWithOrders(clientUuid: string): Promise<void> {
         throw new Error(NOT_IMPLEMENTED);
    }

    async getCustomersByUuids(uuids: string[]): Promise<Customer[]> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    // --- Orders ---
    
    async getOrdersForDate(date: string): Promise<BreadOrderWithClient[]> {
         throw new Error(NOT_IMPLEMENTED);
    }
    
    async ordersExistForDate(date: string): Promise<boolean> {
         throw new Error(NOT_IMPLEMENTED);
    }
    
    async findClientOrderForDate(clientUuid: string, date: string): Promise<BreadOrder | undefined> {
         throw new Error(NOT_IMPLEMENTED);
    }
    
    async addOrder(order: BreadOrder): Promise<BreadOrder> {
         throw new Error(NOT_IMPLEMENTED);
    }
    
    async bulkAddOrders(orders: BreadOrder[]): Promise<void> {
         throw new Error(NOT_IMPLEMENTED);
    }
    
    async findOrderByUuid(uuid: string): Promise<BreadOrder | undefined> {
         throw new Error(NOT_IMPLEMENTED);
    }
    
    async getOrdersByUuids(uuids: string[]): Promise<BreadOrder[]> {
         throw new Error(NOT_IMPLEMENTED);
    }
    
    async updateOrder(uuid: string, data: Partial<BreadOrder>): Promise<void> {
         throw new Error(NOT_IMPLEMENTED);
    }
}

export const breadRepository = new BreadRepository();
