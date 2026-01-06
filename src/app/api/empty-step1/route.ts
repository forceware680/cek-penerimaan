import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getCurrentUser, guardParamsForPrefix } from '@/lib/auth';

export async function POST() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const filterPrefix = user.role === 'ADMIN' ? null : user.filter;
        const { isNull, like } = guardParamsForPrefix(filterPrefix);

        const conn = await getConnection();
        await conn.request()
            .input('isNull', isNull)
            .input('like', like)
            .query(`
        DELETE FROM TempPersediaanStep1 
        WHERE ((@isNull IS NULL) OR (NoKel LIKE @like + '%'))
      `);

        return NextResponse.json({ message: 'TempPersediaanStep1 table emptied successfully.' });
    } catch (error) {
        console.error('Empty step1 error:', error);
        return NextResponse.json(
            { message: 'Failed to empty table.', error: String(error) },
            { status: 500 }
        );
    }
}
