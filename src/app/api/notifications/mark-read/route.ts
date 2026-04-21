import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { NotificationID } = body;

        const conn = await getConnection();
        
        if (NotificationID) {
            await conn.request()
                .input('NotificationID', NotificationID)
                .input('Username', user.username)
                .query(`UPDATE DBKOP.dbo.Sys_Notification SET IsRead = 1 WHERE NotificationID = @NotificationID AND Username = @Username`);
        } else {
            // Mark all as read
            await conn.request()
                .input('Username', user.username)
                .query(`UPDATE DBKOP.dbo.Sys_Notification SET IsRead = 1 WHERE Username = @Username`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
