import { NextResponse } from 'next/server';
import { BackupRepository } from '@/repositories/backup.repository';

/**
 * @fileOverview API WALL: Backup Restoration Gateway (Thin Proxy)
 */

export async function POST(req: Request) {
    try {
        const { name } = await req.json();
        if (!name) throw new Error("NAME_REQUIRED");

        const repo = new BackupRepository();
        await repo.restore(name);

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}