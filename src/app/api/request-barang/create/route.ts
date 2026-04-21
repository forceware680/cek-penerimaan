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
        const { ObjekRSSub, StaID, IDPLU_Req, Keterangan, Satuan, opd_name } = body;

        if (!ObjekRSSub || !StaID || !Keterangan || !Satuan) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const conn = await getConnection();
        
        // 1. Insert into Req_KodeBarang
        await conn.request()
            .input('Username', user.username)
            .input('OPDName', opd_name || user.opd_name || '')
            .input('ObjekRSSub', ObjekRSSub)
            .input('StaID', StaID)
            .input('IDPLU_Req', IDPLU_Req || null)
            .input('Keterangan', Keterangan)
            .input('Satuan', Satuan)
            .query(`
                INSERT INTO DBKOP.dbo.Req_KodeBarang 
                (Username, OPDName, ObjekRSSub, StaID, IDPLU_Req, Keterangan, Satuan, Status, CreatedAt, UpdatedAt)
                VALUES 
                (@Username, @OPDName, @ObjekRSSub, @StaID, @IDPLU_Req, @Keterangan, @Satuan, 'PENDING', GETDATE(), GETDATE())
            `);

        // 2. Notify Admins
        const adminMessage = `Permintaan Kode Barang Baru dari ${user.username} (${opd_name || 'OPD Baru'})`;
        
        await conn.request()
            .input('Message', adminMessage)
            .query(`
                INSERT INTO DBKOP.dbo.Sys_Notification (Username, Message, IsRead, CreatedAt)
                SELECT username, @Message, 0, GETDATE()
                FROM DBKOP.dbo.login
                WHERE UPPER(role) = 'ADMIN'
            `);

        return NextResponse.json({ success: true, message: 'Request submitted successfully' });
    } catch (error) {
        console.error('Create request error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
