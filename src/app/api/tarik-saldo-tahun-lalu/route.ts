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

        await conn.request()
            .input('FilterNoTerima', filterNoTerima)
            .input('PeriodeAwal', periodeAwal)
            .input('PeriodeAkhir', periodeAkhir)
            .query(`
        DECLARE @PBSubkNoDot NVARCHAR(50) = LEFT(@FilterNoTerima, 16);
        DECLARE @LastSeqTemp INT;
        DECLARE @LastSeqKeluar INT;
        DECLARE @LastSeq INT;

        SELECT @LastSeqTemp = MAX(CAST(RIGHT(NoKel, 4) AS INT))
        FROM DBKOP.dbo.TempPersediaanStep1 WITH (NOLOCK)
        WHERE LEFT(NoKel, 16) = @PBSubkNoDot AND NoKel LIKE @PBSubkNoDot + '.25K%';

        IF @LastSeqTemp IS NULL
        BEGIN
            SELECT @LastSeqKeluar = MAX(CAST(RIGHT(NoKel, 4) AS INT))
            FROM AsetPersediaan90.dbo.KeluarBar WITH (NOLOCK)
            WHERE LEFT(NoKel, 16) = @PBSubkNoDot AND NoKel LIKE @PBSubkNoDot + '.25K%';
        END
        ELSE SET @LastSeqKeluar = NULL;

        SET @LastSeq = ISNULL(@LastSeqTemp, ISNULL(@LastSeqKeluar, 0));
        IF @LastSeq IS NULL SET @LastSeq = 0;

        ;WITH SO AS (
            SELECT Pengguna, Tglinput, PbSubK, NoTB, Tutup, Awal, Keterangan
            FROM AsetPersediaan90.dbo.tutupbuku  
            WHERE NoTB LIKE @FilterNoTerima + '%' AND Awal BETWEEN @PeriodeAwal AND @PeriodeAkhir
        ),
        SOdet AS (
            SELECT a.NoTB, a.Tglinput, b.ObjekPersediaan, b.FiFo, b.Expired, b.Jumlah, 
                   b.StaOpname, b.Opname, (b.Jumlah - b.Opname) AS JmlAkhir, a.Awal
            FROM SO a JOIN AsetPersediaan90.dbo.tutupbukudet b ON a.NoTB = b.NoTB
        ),
        PenerimaanData AS (
            SELECT d.NoTerima, d.ObjekPersediaan, d.MerkType, d.Jumlah, d.Harga, d.Kadaluwarsa, d.Keterangan,
                   p.TglBast AS BAST, p.TAG,
                   d.ObjekPersediaan + '_' + CONVERT(VARCHAR(8), p.TglBast, 112) + '_' +
                   RIGHT('0' + CAST(DATEPART(HOUR, p.TglBast) AS VARCHAR(2)), 2) + ':' +
                   RIGHT('0' + CAST(DATEPART(MINUTE, p.TglBast) AS VARCHAR(2)), 2) AS FIFO,
                   LEFT(d.NoTerima, 16) AS PBSubkNoDot,
                   CASE WHEN d.NoTerima LIKE '%SO%' THEN 1 WHEN d.NoTerima LIKE '%TL%' THEN 2
                        WHEN d.NoTerima LIKE '%T%' AND d.NoTerima NOT LIKE '%TL%' THEN 3 ELSE 4 END AS PriorityOrder
            FROM AsetPersediaan90.dbo.PenerimaanDetDPA d
            JOIN AsetPersediaan90.dbo.PenerimaanDPA p ON d.NoTerima = p.NoTerima
            WHERE d.NoTerima LIKE @FilterNoTerima + '%'
            UNION ALL
            SELECT d.NoTerima, d.ObjekPersediaan, d.MerkType, d.Jumlah, d.Harga, d.Kadaluwarsa, d.Keterangan,
                   p.TglBast AS TglTransaksi, p.TAG,
                   d.ObjekPersediaan + '_' + CONVERT(VARCHAR(8), p.TglBast, 112) + '_' +
                   RIGHT('0' + CAST(DATEPART(HOUR, p.TglBast) AS VARCHAR(2)), 2) + ':' +
                   RIGHT('0' + CAST(DATEPART(MINUTE, p.TglBast) AS VARCHAR(2)), 2) AS FIFO,
                   LEFT(d.NoTerima, 16) AS PBSubkNoDot,
                   CASE WHEN d.NoTerima LIKE '%SO%' THEN 1 WHEN d.NoTerima LIKE '%TL%' THEN 2
                        WHEN d.NoTerima LIKE '%T%' AND d.NoTerima NOT LIKE '%TL%' THEN 3 ELSE 4 END AS PriorityOrder
            FROM AsetPersediaan90.dbo.PenerimaanDetDPANon d
            JOIN AsetPersediaan90.dbo.PenerimaanDPANon p ON d.NoTerima = p.NoTerima
            WHERE d.NoTerima LIKE @FilterNoTerima + '%'
        ),
        YML AS (
            SELECT a.NoTB AS NoTerima, a.ObjekPersediaan, c.Keterangan AS NamaBarang, c.Satuan,
                   b.MerkType, a.JmlAkhir AS Jumlah, b.Harga, (b.Harga * a.JmlAkhir) AS TotalHarga,
                   a.Awal AS BAST, a.Expired AS Kadaluwarsa, a.Tglinput, a.NoTB AS NoBAST,
                   'Saldo Awal Tahun' AS Keterangan, 'Saldo Awal' AS TipeSaldo, a.FiFo, b.PBSubKNoDot, b.PriorityOrder
            FROM SOdet a
            JOIN PenerimaanData b ON a.FIFO = b.FIFO
            JOIN AsetMaster90.dbo.ObjekPersediaanPLU c ON a.ObjekPersediaan = c.IDPLU
        ),
        NoTerimaRank AS (
            SELECT b.PBSubkNoDot, b.NoTerima, MIN(b.PriorityOrder) AS MinPriority, MIN(b.BAST) AS MinTgl
            FROM YML b GROUP BY b.PBSubkNoDot, b.NoTerima
        ),
        NoTerimaSeq AS (
            SELECT n.PBSubkNoDot, n.NoTerima, ROW_NUMBER() OVER (ORDER BY n.MinPriority, n.MinTgl, n.NoTerima) AS rn
            FROM NoTerimaRank n
        ),
        DataFinal AS (
            SELECT b.NoTerima, b.ObjekPersediaan, b.NamaBarang, b.Satuan, b.MerkType, b.Jumlah, b.Harga,
                   b.TotalHarga, b.BAST, b.Tglinput, b.NoBAST, b.Kadaluwarsa, b.Keterangan, b.TipeSaldo, b.FIFO,
                   b.PBSubkNoDot + '.25K' + RIGHT('0000' + CAST(@LastSeq + s.rn AS VARCHAR(4)), 4) AS NoKel
            FROM YML b
            JOIN NoTerimaSeq s ON b.PBSubkNoDot = s.PBSubkNoDot AND b.NoTerima = s.NoTerima
        )
        INSERT INTO dbkop.dbo.temppersediaanstep1
            (NoTerima, ObjekPersediaan, NamaBarang, Satuan, MerkType, Jumlah, Harga, TotalHarga, BAST, Tglinput, NoBAST, Kadaluwarsa, Keterangan, TipeSaldo, FIFO, NoKel)
        SELECT NoTerima, ObjekPersediaan, NamaBarang, Satuan, MerkType, Jumlah, Harga, TotalHarga, BAST, Tglinput, NoBAST, Kadaluwarsa, Keterangan, TipeSaldo, FIFO, NoKel
        FROM DataFinal;
      `);

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
        console.error('Tarik saldo tahun lalu error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
