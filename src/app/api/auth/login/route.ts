import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { createJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: 'username and password are required' },
                { status: 400 }
            );
        }

        const conn = await getConnection();
        const result = await conn.request()
            .input('username', username.trim())
            .input('password', password)
            .query(`
        SELECT id, username, password, role, filter
        FROM dbkop.dbo.login
        WHERE username = @username AND password = @password
      `);

        if (result.recordset.length === 0) {
            return NextResponse.json(
                { error: 'invalid credentials' },
                { status: 401 }
            );
        }

        const row = result.recordset[0];
        const profile = {
            id: row.id,
            username: row.username,
            role: (row.role || '').toUpperCase(),
            filter: row.filter,
        };

        const token = createJWT(profile);

        const response = NextResponse.json({ user: profile });
        response.cookies.set('access_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 8 * 60 * 60, // 8 hours
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}
