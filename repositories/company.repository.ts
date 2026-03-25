// This is a placeholder for the Supabase repository.
// It's designed to throw errors if used before being implemented.
import type { CompanyProfile } from '@/lib/types';

const NOT_IMPLEMENTED = "Repository not implemented. Backend connection is required.";

class CompanyRepository {
    async get(): Promise<CompanyProfile | null> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async add(profile: CompanyProfile): Promise<CompanyProfile> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async update(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
        throw new Error(NOT_IMPLEMENTED);
    }
}

export const companyRepository = new CompanyRepository();
