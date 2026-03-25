// This is a placeholder for the Supabase repository.
// It's designed to throw errors if used before being implemented.
import type { StockIntake } from '@/lib/types';

const NOT_IMPLEMENTED = "Repository not implemented. Backend connection is required.";

class StockRepository {
    async filter(filters: { query?: string; from?: Date; to?: Date }): Promise<StockIntake[]> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async add(intake: StockIntake): Promise<StockIntake> {
        throw new Error(NOT_IMPLEMENTED);
    }
}

export const stockRepository = new StockRepository();
