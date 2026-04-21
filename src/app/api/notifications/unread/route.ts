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
        const result = await conn.request()
            .input('Username', user.username)
            .query(`
                SELECT * FROM DBKOP.dbo.Sys_Notification 
                WHERE Username = @Username AND IsRead = 0
                ORDER BY CreatedAt DESC
            `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Fetch unread notifications error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
