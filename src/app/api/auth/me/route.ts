import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: 'unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                filter: user.filter,
            }
        });
    } catch (error) {
        console.error('Me error:', error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}
