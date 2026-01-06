import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getCurrentUser, guardParamsForPrefix } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const filterPrefix = user.role === 'ADMIN' ? null : user.filter;
        const filterNoTerima = filterPrefix || searchParams.get('filter_no_terima') || '0213010000000000';
        const periodeAwal = searchParams.get('periode_awal') || '2024-01-01';
        const periodeAkhir = searchParams.get('periode_akhir') || '2024-06-30 23:59:59';

        const conn = await getConnection();

        // Execute the complex insert query
        await conn.request()
            .input('FilterNoTerima', filterNoTerima)
            .input('PeriodeAwal', periodeAwal)
            .input('PeriodeAkhir', periodeAkhir)
            .query(`
        /* ===================== TURUNAN ======================= */
        DECLARE @PBSubkNoDot VARCHAR(16) = LEFT(@FilterNoTerima, 16);
        DECLARE @LastSeqTemp INT;
        DECLARE @LastSeqKeluar INT;
        DECLARE @LastSeq INT;

        /* 1) CEK LAST SEQ DI TEMP TERLEBIH DULU (PER PBSubk) */
        SELECT 
            @LastSeqTemp = MAX(CAST(RIGHT(NoKel, 4) AS INT))
        FROM DBKOP.dbo.TempPersediaanStep1 WITH (NOLOCK)
        WHERE LEFT(NoKel, 16) = @PBSubkNoDot
          AND NoKel LIKE @PBSubkNoDot + '.25K%';

        /* 2) JIKA TEMP KOSONG, FALLBACK KE AsetPersediaan90.dbo.KeluarBar */
        IF @LastSeqTemp IS NULL
        BEGIN
            SELECT 
                @LastSeqKeluar = MAX(CAST(RIGHT(NoKel, 4) AS INT))
            FROM AsetPersediaan90.dbo.KeluarBar WITH (NOLOCK)
            WHERE LEFT(NoKel, 16) = @PBSubkNoDot
              AND NoKel LIKE @PBSubkNoDot + '.25K%';
        END
        ELSE
        BEGIN
            SET @LastSeqKeluar = NULL;
        END

        SET @LastSeq = ISNULL(@LastSeqTemp, ISNULL(@LastSeqKeluar, 0));
        IF @LastSeq IS NULL SET @LastSeq = 0;

        /* ===================== DATA & PENOMORAN ===================== */
        ;WITH FilteredData AS (
            SELECT 
                d.NoTerima,
                d.ObjekPersediaan,
                op.Keterangan AS NamaBarang,
                d.Satuan,
                d.MerkType,
                d.Jumlah,
                d.Harga,
                (d.Jumlah * d.Harga) AS TotalHarga,
                h.TglBast AS BAST,
                h.NoBAST,
                d.Kadaluwarsa,
                d.Keterangan,
                'Saldo Awal' AS TipeSaldo,
                h.TglBast AS TglTransaksi,
                LEFT(d.NoTerima, 16) AS PBSubkNoDot,
                CASE 
                    WHEN d.NoTerima LIKE '%SO%' THEN 1
                    WHEN d.NoTerima LIKE '%TL%' THEN 2
                    WHEN d.NoTerima LIKE '%T%' AND d.NoTerima NOT LIKE '%TL%' THEN 3
                    ELSE 4
                END AS PriorityOrder,
                d.ObjekPersediaan + '_'+
                CONVERT(VARCHAR(8), h.TglBast, 112) + '_' +
                RIGHT('0' + CAST(DATEPART(HOUR, COALESCE(h.TglInput, h.TglBAST)) AS VARCHAR(2)), 2) + ':' +
                RIGHT('0' + CAST(DATEPART(MINUTE, COALESCE(h.TglInput, h.TglBast)) AS VARCHAR(2)), 2) AS FIFO,
                h.TglInput AS TglInput
            FROM AsetPersediaan90.dbo.PenerimaanDetDPANon d WITH (NOLOCK)
            JOIN AsetPersediaan90.dbo.PenerimaanDPANon h WITH (NOLOCK)
              ON d.NoTerima = h.NoTerima
            JOIN AsetMaster90.dbo.ObjekPersediaanPLU op WITH (NOLOCK)
              ON d.ObjekPersediaan = op.IDPLU
            WHERE 
                d.NoTerima LIKE @PBSubkNoDot + '%'
                AND h.AsalUsul = 'AWAL'
                AND h.TglBast >= @PeriodeAwal
                AND h.TglBast < DATEADD(DAY, 1, @PeriodeAkhir)
        ),
        NoTerimaRank AS (
            SELECT
                f.PBSubkNoDot,
                f.NoTerima,
                MIN(f.PriorityOrder) AS MinPriority,
                MIN(f.TglTransaksi) AS MinTgl
            FROM FilteredData f
            GROUP BY f.PBSubkNoDot, f.NoTerima
        ),
        NoTerimaSeq AS (
            SELECT
                n.PBSubkNoDot,
                n.NoTerima,
                ROW_NUMBER() OVER (ORDER BY n.MinPriority, n.MinTgl, n.NoTerima) AS rn
            FROM NoTerimaRank n
        ),
        DataFinal AS (
            SELECT
                f.NoTerima,
                f.ObjekPersediaan,
                f.NamaBarang,
                f.Satuan,
                f.MerkType,
                f.Jumlah,
                f.Harga,
                f.TotalHarga,
                f.BAST,
                f.NoBAST,
                f.Kadaluwarsa,
                f.Keterangan,
                f.TipeSaldo,
                f.FIFO,
                f.TglInput,
                f.PBSubkNoDot + '.25K' + RIGHT('0000' + CAST(@LastSeq + s.rn AS VARCHAR(4)), 4) AS NoKel
            FROM FilteredData f
            JOIN NoTerimaSeq s
              ON f.PBSubkNoDot = s.PBSubkNoDot
             AND f.NoTerima = s.NoTerima
        )
        INSERT INTO DBKOP.dbo.TempPersediaanStep1
            (NoTerima, ObjekPersediaan, NamaBarang, Satuan, MerkType, Jumlah, Harga, TotalHarga, BAST, NoBAST, Kadaluwarsa, Keterangan, TipeSaldo, FIFO, NoKel, TglInput)
        SELECT 
            NoTerima, ObjekPersediaan, NamaBarang, Satuan, MerkType, Jumlah, Harga, TotalHarga, BAST, NoBAST, Kadaluwarsa, Keterangan, TipeSaldo, FIFO, NoKel, TglInput
        FROM DataFinal;
      `);

        // Fetch the results
        const { isNull, like } = guardParamsForPrefix(filterPrefix);
        const result = await conn.request()
            .input('isNull', isNull)
            .input('like', like)
            .query(`
        SELECT * FROM DBKOP.dbo.TempPersediaanStep1
        WHERE ((@isNull IS NULL) OR (NoKel LIKE @like + '%'))
        ORDER BY BAST ASC
      `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Tarik saldo awal error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
