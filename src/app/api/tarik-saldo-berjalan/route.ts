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
        DECLARE @PBSubkNoDot VARCHAR(16) = LEFT(@FilterNoTerima, 16);
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

        ;WITH FilteredData AS (
            SELECT 
                pd.NoTerima, pd.ObjekPersediaan, op.Keterangan AS NamaBarang,
                pd.Satuan, pd.MerkType, pd.Jumlah, pd.Harga,
                (pd.Jumlah * pd.Harga) AS TotalHarga, p.TglBAST AS BAST,
                p.NoBAST, pd.Kadaluwarsa, pd.Keterangan,
                'Saldo Berjalan' AS TipeSaldo, p.TglBAST AS TglTransaksi,
                LEFT(pd.NoTerima, 16) AS PBSubkNoDot,
                CASE 
                    WHEN pd.NoTerima LIKE '%SO%' THEN 1
                    WHEN pd.NoTerima LIKE '%TL%' THEN 2
                    WHEN pd.NoTerima LIKE '%T%' AND pd.NoTerima NOT LIKE '%TL%' THEN 3
                    ELSE 4
                END AS PriorityOrder,
                pd.ObjekPersediaan + '_' + CONVERT(VARCHAR(8), p.TglBAST, 112) + '_' +
                RIGHT('0' + CAST(DATEPART(HOUR, COALESCE(p.TglInput, p.TglBAST)) AS VARCHAR(2)), 2) + ':' +
                RIGHT('0' + CAST(DATEPART(MINUTE, COALESCE(p.TglInput, p.TglBAST)) AS VARCHAR(2)), 2) AS FIFO,
                p.TglInput AS TglInput
            FROM AsetPersediaan90.dbo.PenerimaanDetDPA pd WITH (NOLOCK)
            INNER JOIN AsetMaster90.dbo.ObjekpersediaanPLU op WITH (NOLOCK) ON pd.ObjekPersediaan = op.IDPLU
            INNER JOIN AsetPersediaan90.dbo.PenerimaanDPA p WITH (NOLOCK) ON pd.NoTerima = p.NoTerima
            WHERE pd.NoTerima LIKE '%' + @FilterNoTerima + '%'
                AND p.TglBAST BETWEEN @PeriodeAwal AND @PeriodeAkhir
        ),
        NoTerimaRank AS (
            SELECT f.PBSubkNoDot, f.NoTerima, MIN(f.PriorityOrder) AS MinPriority, MIN(f.TglTransaksi) AS MinTgl
            FROM FilteredData f GROUP BY f.PBSubkNoDot, f.NoTerima
        ),
        NoTerimaSeq AS (
            SELECT n.PBSubkNoDot, n.NoTerima, ROW_NUMBER() OVER (ORDER BY n.MinPriority, n.MinTgl, n.NoTerima) AS rn
            FROM NoTerimaRank n
        ),
        DataFinal AS (
            SELECT f.NoTerima, f.ObjekPersediaan, f.NamaBarang, f.Satuan, f.MerkType, f.Jumlah,
                f.Harga, f.TotalHarga, f.BAST, f.NoBAST, f.Kadaluwarsa, f.Keterangan, f.TipeSaldo, f.FIFO, f.TglInput,
                f.PBSubkNoDot + '.25K' + RIGHT('0000' + CAST(@LastSeq + s.rn AS VARCHAR(4)), 4) AS NoKel
            FROM FilteredData f
            JOIN NoTerimaSeq s ON f.PBSubkNoDot = s.PBSubkNoDot AND f.NoTerima = s.NoTerima
        )
        INSERT INTO DBKOP.dbo.TempPersediaanStep1
            (NoTerima, ObjekPersediaan, NamaBarang, Satuan, MerkType, Jumlah, Harga, TotalHarga, BAST, NoBAST, Kadaluwarsa, Keterangan, TipeSaldo, FIFO, NoKel, TglInput)
        SELECT NoTerima, ObjekPersediaan, NamaBarang, Satuan, MerkType, Jumlah, Harga, TotalHarga, BAST, NoBAST, Kadaluwarsa, Keterangan, TipeSaldo, FIFO, NoKel, TglInput
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
        console.error('Tarik saldo berjalan error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
