import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const filterPrefix = user.role === 'ADMIN' ? null : user.filter;

        const rawPbsubk = filterPrefix || searchParams.get('filter_no_terima') || searchParams.get('pbsubk') || '0501010000000000';
        const onlyDigits = rawPbsubk.replace(/\D/g, '');
        const filterNoTerima = (onlyDigits || '0501010000000000').slice(0, 16);

        const pa = (searchParams.get('periode_awal') || searchParams.get('start_date') || '2025-01-01').slice(0, 10);
        const pk = (searchParams.get('periode_akhir') || searchParams.get('end_date') || '2025-06-30').slice(0, 10);

        const conn = await getConnection();

        await conn.request()
            .input('FilterNoTerima', filterNoTerima)
            .input('StartDate', pa)
            .input('EndDate', pk)
            .query(`
        SET NOCOUNT ON;

        DECLARE @PBSubkDot VARCHAR(20) =
            LEFT(@FilterNoTerima,6)+'.'+SUBSTRING(@FilterNoTerima,7,5)+'.'+SUBSTRING(@FilterNoTerima,12,5);

        DECLARE @LastSeqTemp INT, @LastSeqKeluar INT, @LastSeq INT;
        SELECT @LastSeqTemp = MAX(CAST(RIGHT(NoKel,4) AS INT))
        FROM DBKOP.dbo.TempPersediaanStep1 WITH (NOLOCK)
        WHERE LEFT(NoKel,16)=LEFT(@FilterNoTerima,16)
          AND NoKel LIKE LEFT(@FilterNoTerima,16)+'.25K%';

        IF @LastSeqTemp IS NULL
        BEGIN
          SELECT @LastSeqKeluar = MAX(CAST(RIGHT(NoKel,4) AS INT))
          FROM AsetPersediaan90.dbo.KeluarBar WITH (NOLOCK)
          WHERE LEFT(NoKel,16)=LEFT(@FilterNoTerima,16)
            AND NoKel LIKE LEFT(@FilterNoTerima,16)+'.25K%';
        END
        SET @LastSeq = ISNULL(@LastSeqTemp, ISNULL(@LastSeqKeluar,0));
        IF @LastSeq IS NULL SET @LastSeq=0;

        IF OBJECT_ID('tempdb..#G0') IS NOT NULL DROP TABLE #G0;
        SELECT g.ObjekPersediaan, g.NoTrans, g.Tanggal, g.FIFO,
               CAST(g.Masuk AS DECIMAL(18,2)) AS Masuk, CAST(g.Keluar AS DECIMAL(18,2)) AS Keluar
        INTO #G0
        FROM AsetPersediaan90.dbo.Gudang g WITH (NOLOCK)
        WHERE g.PbSubK = @PBSubkDot AND g.Tanggal >= @StartDate AND g.Tanggal < DATEADD(DAY,1,@EndDate);

        CREATE NONCLUSTERED INDEX IX_G0_Obj_Tgl ON #G0(ObjekPersediaan,Tanggal) INCLUDE(FIFO,NoTrans,Masuk,Keluar);
        CREATE NONCLUSTERED INDEX IX_G0_FIFO ON #G0(FIFO);

        IF OBJECT_ID('tempdb..#InboundFIFO') IS NOT NULL DROP TABLE #InboundFIFO;
        ;WITH C AS (
          SELECT g.FIFO, g.ObjekPersediaan, g.NoTrans, g.Tanggal,
            Pri = CASE 
                    WHEN CHARINDEX('.',g.NoTrans)>0 AND SUBSTRING(g.NoTrans,CHARINDEX('.',g.NoTrans)+1,2) IN ('TL','SO') THEN 0
                    WHEN CHARINDEX('.',g.NoTrans)>0 AND SUBSTRING(g.NoTrans,CHARINDEX('.',g.NoTrans)+1,1) = 'T' THEN 0
                    WHEN g.Masuk>0 AND g.NoTrans LIKE '%.SO %' THEN 1
                    ELSE 2
                  END
          FROM #G0 g WHERE g.Masuk > 0
        )
        SELECT FIFO, ObjekPersediaan, NoTrans AS NoTransIn, Tanggal AS TglIn
        INTO #InboundFIFO
        FROM (SELECT C.*, ROW_NUMBER() OVER (PARTITION BY C.FIFO ORDER BY C.Pri ASC, C.Tanggal ASC, C.NoTrans ASC) rn FROM C) X WHERE X.rn=1;

        CREATE UNIQUE CLUSTERED INDEX PK_InF ON #InboundFIFO(FIFO);

        IF OBJECT_ID('tempdb..#HargaFIFO') IS NOT NULL DROP TABLE #HargaFIFO;
        SELECT i.FIFO, Harga = COALESCE(hFix.Harga, hSal.Harga, hNbm.Harga, 0),
               Kadaluwarsa = COALESCE(hFix.Kadaluwarsa, hSal.Kadaluwarsa, hNbm.Kadaluwarsa, NULL)
        INTO #HargaFIFO
        FROM #InboundFIFO i
        OUTER APPLY (SELECT TOP(1) gh.Harga, gh.Kadaluwarsa FROM AsetPersediaan90.dbo.GudHarga gh WITH (NOLOCK) WHERE gh.FIFO = i.FIFO AND gh.NoTrans = i.NoTransIn) hFix
        OUTER APPLY (SELECT TOP(1) gh.Harga, gh.Kadaluwarsa FROM AsetPersediaan90.dbo.GudHarga gh WITH (NOLOCK) WHERE gh.FIFO = i.FIFO AND gh.TAG = 'SAL' ORDER BY gh.Tanggal DESC) hSal
        OUTER APPLY (SELECT TOP(1) gh.Harga, gh.Kadaluwarsa FROM AsetPersediaan90.dbo.GudHarga gh WITH (NOLOCK) WHERE gh.FIFO = i.FIFO AND gh.TAG = 'NBM' ORDER BY gh.Tanggal DESC) hNbm;

        CREATE UNIQUE CLUSTERED INDEX PK_HargaF ON #HargaFIFO(FIFO);

        IF OBJECT_ID('tempdb..#PerFIFO') IS NOT NULL DROP TABLE #PerFIFO;
        SELECT g.ObjekPersediaan, g.FIFO, SUM(g.Masuk) AS Masuk, SUM(g.Keluar) AS Keluar
        INTO #PerFIFO FROM #G0 g GROUP BY g.ObjekPersediaan, g.FIFO;

        CREATE NONCLUSTERED INDEX IX_PerFIFO ON #PerFIFO(ObjekPersediaan,FIFO);

        IF OBJECT_ID('tempdb..#Final') IS NOT NULL DROP TABLE #Final;
        SELECT NoTerima = i.NoTransIn, p.ObjekPersediaan, op.Keterangan AS NamaBarang, op.Satuan, op.Keterangan AS MerkType,
               Jumlah = CAST(p.Masuk - p.Keluar AS DECIMAL(18,2)), Harga = CAST(h.Harga AS DECIMAL(18,2)),
               TotalHarga = CAST((p.Masuk - p.Keluar) * h.Harga AS DECIMAL(18,2)), BAST = i.TglIn, NoBAST = i.NoTransIn,
               Kadaluwarsa = h.Kadaluwarsa, Keterangan = 'Saldo Awal Sem 1', TipeSaldo = 'Saldo Awal', FIFO = p.FIFO, TglInput = i.TglIn
        INTO #Final
        FROM #PerFIFO p
        JOIN #InboundFIFO i ON i.FIFO = p.FIFO
        LEFT JOIN #HargaFIFO h ON h.FIFO = p.FIFO
        JOIN AsetMaster90.dbo.ObjekPersediaanPLU op WITH (NOLOCK) ON op.IDPLU = p.ObjekPersediaan
        WHERE (p.Masuk - p.Keluar) > 0;

        IF OBJECT_ID('tempdb..#NoKelPerNoTerima') IS NOT NULL DROP TABLE #NoKelPerNoTerima;
        ;WITH R AS (SELECT NoTerima, MinBAST = MIN(BAST) FROM #Final GROUP BY NoTerima),
        RN AS (SELECT NoTerima, rn = ROW_NUMBER() OVER (ORDER BY MinBAST, NoTerima) FROM R)
        SELECT NoTerima, NoKel = LEFT(@FilterNoTerima,16) + '.25K' + RIGHT('0000' + CAST(@LastSeq + rn AS VARCHAR(4)), 4)
        INTO #NoKelPerNoTerima FROM RN;

        INSERT INTO DBKOP.dbo.TempPersediaanStep1
         (NoTerima, ObjekPersediaan, NamaBarang, Satuan, MerkType, Jumlah, Harga, TotalHarga, BAST, NoBAST, Kadaluwarsa, Keterangan, TipeSaldo, FIFO, NoKel, TglInput)
        SELECT f.NoTerima, f.ObjekPersediaan, f.NamaBarang, f.Satuan, f.MerkType, f.Jumlah, f.Harga, f.TotalHarga,
               f.BAST, f.NoBAST, f.Kadaluwarsa, f.Keterangan, f.TipeSaldo, f.FIFO, nk.NoKel, f.TglInput
        FROM #Final f
        JOIN #NoKelPerNoTerima nk ON nk.NoTerima = f.NoTerima
        ORDER BY f.BAST ASC;
      `);

        return NextResponse.json({
            ok: true,
            echo_params: {
                filter_no_terima: filterNoTerima,
                periode_awal: pa,
                periode_akhir: pk
            }
        });
    } catch (error) {
        console.error('Stockopname insert error:', error);
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
}
