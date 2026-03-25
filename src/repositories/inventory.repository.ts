// This is a placeholder for the Supabase repository.
// It's designed to throw errors if used before being implemented.
import type { InventoryLog } from '@/lib/types';

const NOT_IMPLEMENTED = "Repository not implemented. Backend connection is required.";

class InventoryRepository {
    async add(log: InventoryLog): Promise<InventoryLog> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async hasLogs(productUuid: string): Promise<boolean> {
        throw new Error(NOT_IMPLEMENTED);
    }
}

export const inventoryRepository = new InventoryRepository();
