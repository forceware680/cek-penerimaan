import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getCurrentUser, guardParamsForPrefix } from '@/lib/auth';

function formatDate(date: Date | null): string {
    if (!date) return '-';
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const filterPrefix = user.role === 'ADMIN' ? null : user.filter;
        const { isNull, like } = guardParamsForPrefix(filterPrefix);

        const conn = await getConnection();
        const result = await conn.request()
            .input('isNull', isNull)
            .input('like', like)
            .query(`
        SELECT *
        FROM TempPersediaanStep1
        WHERE ((@isNull IS NULL) OR (NoKel LIKE @like + '%'))
      `);

        const data = result.recordset.map((row: any) => ({
            NoTerima: row.NoTerima || '',
            ObjekPersediaan: row.ObjekPersediaan || '',
            NamaBarang: row.NamaBarang || '',
            Satuan: row.Satuan || '',
            MerkType: row.MerkType || '-',
            Jumlah: row.Jumlah ?? 0,
            Harga: parseFloat(row.Harga || 0).toFixed(2),
            TotalHarga: parseFloat(row.TotalHarga || 0).toFixed(2),
            BAST: row.BAST ? formatDate(row.BAST) : '-',
            TglInput: row.TglInput ? formatDate(row.TglInput) : '-',
            Kadaluwarsa: row.Kadaluwarsa ? formatDate(row.Kadaluwarsa) : '-',
            NoBAST: row.NoBAST || '',
            Keterangan: row.Keterangan || '-',
            TipeSaldo: row.TipeSaldo || '',
            FIFO: row.FIFO || '',
            NoKel: row.NoKel || '',
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error('Temp persediaan step1 error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
