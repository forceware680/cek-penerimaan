import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { RequestID, IDPLU_Req } = body;

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

        let targetIDPLU = IDPLU_Req || reqData.IDPLU_Req;

        // 2. Handle IDPLU Generation if NON
        if (reqData.StaID === 'NON') {
            try {
                // Generate new IDPLU (e.g., NP + sequence)
                // Use ISNUMERIC and clearer sequence logic
                const maxSeqResult = await conn.request().query(`
                    SELECT MAX(CAST(SUBSTRING(IDPLU, 3, 13) AS INT)) as MaxSeq 
                    FROM AsetMaster90.dbo.ObjekPersediaanPLU 
                    WHERE IDPLU LIKE 'NP%' AND ISNUMERIC(SUBSTRING(IDPLU, 3, 13)) = 1
                `);
                const nextSeq = (maxSeqResult.recordset[0].MaxSeq || 0) + 1;
                targetIDPLU = 'NP' + String(nextSeq).padStart(6, '0');
            } catch (seqErr) {
                console.error('IDPLU Generation error:', seqErr);
                // Fallback to timestamp-based if sequence fails
                targetIDPLU = 'NP' + String(Date.now()).slice(-8);
            }
        }

        // 3. Validate Uniqueness
        const checkResult = await conn.request()
            .input('IDPLU', targetIDPLU)
            .query(`SELECT COUNT(*) as count FROM AsetMaster90.dbo.ObjekPersediaanPLU WHERE IDPLU = @IDPLU`);
        
        if (checkResult.recordset[0].count > 0) {
            return NextResponse.json({ error: `IDPLU ${targetIDPLU} already exists in Master Data` }, { status: 400 });
        }

        // 4. Transactional Update
        const transaction = new sql.Transaction(conn);
        await transaction.begin();
        try {
            const requestObj = new sql.Request(transaction);
            
            // Insert to AsetMaster90
            console.log('Inserting into AsetMaster90.dbo.ObjekPersediaanPLU...', {
                ObjekRSSub: reqData.ObjekRSSub,
                IDPLU: targetIDPLU,
                StaID: reqData.StaID,
                Keterangan: reqData.Keterangan,
                Satuan: reqData.Satuan
            });
            
            await requestObj
                .input('IDPLU', targetIDPLU)
                .input('Keterangan', reqData.Keterangan)
                .input('Satuan', reqData.Satuan)
                .input('ObjekRSSub', reqData.ObjekRSSub)
                .input('StaID', reqData.StaID)
                .query(`
                    INSERT INTO AsetMaster90.dbo.ObjekPersediaanPLU (ObjekRSSub, IDPLU, StaID, Keterangan, Satuan)
                    VALUES (@ObjekRSSub, @IDPLU, @StaID, @Keterangan, @Satuan)
                `);

            // Update Status in DBKOP
            console.log('Updating DBKOP.dbo.Req_KodeBarang...');
            const updateReq = new sql.Request(transaction);
            await updateReq
                .input('RequestID', RequestID)
                .input('ApprovedBy', user.username)
                .input('IDPLU', targetIDPLU)
                .query(`
                    UPDATE DBKOP.dbo.Req_KodeBarang 
                    SET Status = 'APPROVED', 
                        IDPLU_Req = @IDPLU,
                        CatatanAdmin = 'OK',
                        ApprovedAt = GETDATE(), 
                        ApprovedBy = @ApprovedBy,
                        UpdatedAt = GETDATE()
                    WHERE RequestID = @RequestID
                `);

            // Create Notification for User
            console.log('Creating notification for user...');
            const notifyReq = new sql.Request(transaction);
            const userMsg = `Permintaan Kode Barang "${reqData.Keterangan}" telah DISETUJUI dengan kode: ${targetIDPLU}`;
            await notifyReq
                .input('TargetUser', reqData.Username)
                .input('Msg', userMsg)
                .query(`
                    INSERT INTO DBKOP.dbo.Sys_Notification (Username, Message, IsRead, CreatedAt)
                    VALUES (@TargetUser, @Msg, 0, GETDATE())
                `);

            await transaction.commit();
            console.log('Transaction committed successfully');
        } catch (err) {
            console.error('Inner transaction error:', err);
            // Only rollback if the transaction is still active and not aborted
            // In mssql, if a query fails, the transaction might already be closed/aborted
            if (transaction && (transaction as any)._aborted === false) {
                try {
                    await transaction.rollback();
                } catch (rollbackErr) {
                    console.error('Secondary Rollback error:', rollbackErr);
                }
            }
            throw err;
        }

        return NextResponse.json({ success: true, message: 'Request approved successfully', IDPLU: targetIDPLU });
    } catch (error) {
        console.error('Approve request main error:', error);
        // Extract the original database error message if possible
        const errorMessage = (error as any).message || String(error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
