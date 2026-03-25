'use client';
import { db } from '@/lib/database';
import type { Draft } from '@/lib/types';

class DraftRepository {
    async getAll(): Promise<Draft[]> {
        return db.drafts.orderBy('createdAt').reverse().toArray();
    }

    async add(draft: Draft): Promise<number> {
        return db.drafts.add(draft);
    }

    async delete(uuid: string): Promise<void> {
        await db.drafts.where('uuid').equals(uuid).delete();
    }
}

export const draftRepository = new DraftRepository();
