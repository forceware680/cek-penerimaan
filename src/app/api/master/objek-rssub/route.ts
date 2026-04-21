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
        // Updated column name from NmRSSub to KetObjekRSSub based on user feedback
        const result = await conn.request().query(`
            SELECT ObjekRSSub, KetObjekRSSub 
            FROM AsetMaster90.dbo.ObjekRSSub 
            WHERE ObjekRSSub LIKE '1.1.7%'
            ORDER BY ObjekRSSub ASC
        `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Fetch ObjekRSSub error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
