import { NextResponse } from 'next/server';
import { BackupRepository } from '@/repositories/backup.repository';

/**
 * @fileOverview API WALL: Backup Inspection Gateway
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const name = searchParams.get('name');
        if (!name) throw new Error("NAME_REQUIRED");

        const repo = new BackupRepository();
        const data = await repo.getDetails(name);
        
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
