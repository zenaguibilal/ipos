import { NextResponse } from 'next/server';
import { BackupRepository } from '@/repositories/backup.repository';

/**
 * @fileOverview API WALL: Backup Storage Gateway (Thin Proxy)
 */

export async function GET() {
    try {
        const repo = new BackupRepository();
        const data = await repo.list();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        const repo = new BackupRepository();
        const fileName = await repo.create();
        return NextResponse.json({ data: { success: true, fileName } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const name = searchParams.get('name');
        if (!name) throw new Error("NAME_REQUIRED");

        const repo = new BackupRepository();
        await repo.delete(name);

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}