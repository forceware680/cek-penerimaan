import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { RequestID, CatatanAdmin } = body;

        if (!RequestID) {
            return NextResponse.json({ error: 'RequestID is required' }, { status: 400 });
        }

        const conn = await getConnection();
        
        // 1. Fetch Request Details
        const reqResult = await conn.request()
            .input('RequestID', RequestID)
            .query(`SELECT * FROM DBKOP.dbo.Req_KodeBarang WHERE RequestID = @RequestID`);
        
        if (reqResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const reqData = reqResult.recordset[0];
        if (reqData.Status !== 'PENDING') {
            return NextResponse.json({ error: 'Request is already processed' }, { status: 400 });
        }

        // 2. Update status to REJECTED
        await conn.request()
            .input('RequestID', RequestID)
            .input('CatatanAdmin', CatatanAdmin || '')
            .query(`
                UPDATE DBKOP.dbo.Req_KodeBarang 
                SET Status = 'REJECTED', 
                    CatatanAdmin = @CatatanAdmin,
                    UpdatedAt = GETDATE()
                WHERE RequestID = @RequestID
            `);

        // 3. Notify User
        const userMsg = `Permintaan Kode Barang "${reqData.Keterangan}" telah DITOLAK. Catatan: ${CatatanAdmin || '-'}`;
        await conn.request()
            .input('TargetUser', reqData.Username)
            .input('Msg', userMsg)
            .query(`
                INSERT INTO DBKOP.dbo.Sys_Notification (Username, Message, IsRead, CreatedAt)
                VALUES (@TargetUser, @Msg, 0, GETDATE())
            `);

        return NextResponse.json({ success: true, message: 'Request rejected successfully' });
    } catch (error) {
        console.error('Reject request error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
