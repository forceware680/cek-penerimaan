import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const conn = await getConnection();
        // Updated join to use KetObjekRSSub
        const result = await conn.request()
            .query(`
                SELECT r.*, s.KetObjekRSSub
                FROM DBKOP.dbo.Req_KodeBarang r
                LEFT JOIN AsetMaster90.dbo.ObjekRSSub s ON r.ObjekRSSub = s.ObjekRSSub
                ORDER BY r.CreatedAt DESC
            `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Fetch all requests error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
