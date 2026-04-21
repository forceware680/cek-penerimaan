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
        // Updated to use the Satuan column name as provided by user
        const result = await conn.request().query(`
            SELECT Satuan 
            FROM AsetMaster90.dbo.Satuan 
            ORDER BY Satuan ASC
        `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Fetch Satuan error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
