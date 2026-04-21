import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const conn = await getConnection();
        // Updated join to use KetObjekRSSub
        const result = await conn.request()
            .input('Username', user.username)
            .query(`
                SELECT r.*, s.KetObjekRSSub
                FROM DBKOP.dbo.Req_KodeBarang r
                LEFT JOIN AsetMaster90.dbo.ObjekRSSub s ON r.ObjekRSSub = s.ObjekRSSub
                WHERE r.Username = @Username
                ORDER BY r.CreatedAt DESC
            `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Fetch history error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
