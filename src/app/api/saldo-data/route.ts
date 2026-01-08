import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getCurrentUser, guardParamsForPrefix } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const filterPrefix = user.role === 'ADMIN' ? null : user.filter;
        const { isNull, like } = guardParamsForPrefix(filterPrefix);

        const conn = await getConnection();

        // Calculating Saldo Awal
        const saldoAwalResult = await conn.request()
            .input('isNull', isNull)
            .input('like', like)
            .query(`
        SELECT COALESCE(SUM(TotalHarga), 0) AS SaldoAwal
        FROM dbkop.dbo.temppersediaanstep1
        WHERE TipeSaldo = 'Saldo Awal'
          AND ((@isNull IS NULL) OR (NoKel LIKE @like + '%'))
      `);
        const saldoAwal = saldoAwalResult.recordset[0].SaldoAwal;

        // Calculating Saldo Berjalan
        const saldoBerjalanResult = await conn.request()
            .input('isNull', isNull)
            .input('like', like)
            .query(`
        SELECT COALESCE(SUM(TotalHarga), 0) AS SaldoBerjalan
        FROM dbkop.dbo.temppersediaanstep1
        WHERE TipeSaldo = 'Saldo Berjalan'
          AND ((@isNull IS NULL) OR (NoKel LIKE @like + '%'))
      `);
        const saldoBerjalan = saldoBerjalanResult.recordset[0].SaldoBerjalan;

        // Calculating Saldo Lain-Lain
        const saldoLainLainResult = await conn.request()
            .input('isNull', isNull)
            .input('like', like)
            .query(`
        SELECT COALESCE(SUM(TotalHarga), 0) AS SaldoLainLain
        FROM dbkop.dbo.temppersediaanstep1
        WHERE TipeSaldo = 'Saldo Lain-Lain'
          AND ((@isNull IS NULL) OR (NoKel LIKE @like + '%'))
      `);
        const saldoLainLain = saldoLainLainResult.recordset[0].SaldoLainLain;

        // Calculating Saldo Awal Sem 2
        const saldoAwalSem2Result = await conn.request()
            .input('isNull', isNull)
            .input('like', like)
            .query(`
        SELECT COALESCE(SUM(TotalHarga), 0) AS SaldoAwalSem2
        FROM dbkop.dbo.temppersediaanstep1
        WHERE (Keterangan LIKE '%Saldo Awal Sem 2%' OR Keterangan LIKE '%Saldo Awal Triwulan 2%' OR Keterangan LIKE '%Saldo Awal Triwulan 3%')
          AND ((@isNull IS NULL) OR (NoKel LIKE @like + '%'))
      `);
        const saldoAwalSem2 = saldoAwalSem2Result.recordset[0].SaldoAwalSem2;

        // Calculating Total Quantity
        const totalJumlahResult = await conn.request()
            .input('isNull', isNull)
            .input('like', like)
            .query(`
        SELECT COALESCE(SUM(Jumlah), 0) AS TotalJumlah
        FROM dbkop.dbo.temppersediaanstep1
        WHERE ((@isNull IS NULL) OR (NoKel LIKE @like + '%'))
      `);
        const totalJumlah = totalJumlahResult.recordset[0].TotalJumlah;

        // Calculating Total Harga
        const totalHargaResult = await conn.request()
            .input('isNull', isNull)
            .input('like', like)
            .query(`
        SELECT COALESCE(SUM(TotalHarga), 0) AS TotalHarga
        FROM dbkop.dbo.temppersediaanstep1
        WHERE ((@isNull IS NULL) OR (NoKel LIKE @like + '%'))
      `);
        const totalHarga = totalHargaResult.recordset[0].TotalHarga;

        return NextResponse.json({
            initialBalance: saldoAwal,
            runningBalance: saldoBerjalan,
            saldoLainLain: saldoLainLain,
            SaldoAwalSem2: saldoAwalSem2,
            totalQuantity: totalJumlah,
            totalHarga: totalHarga,
        });
    } catch (error) {
        console.error('Saldo data error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
