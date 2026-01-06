import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-dev-secret';

export interface UserPayload {
    id: number;
    username: string;
    role: string;
    filter: string | null;
}

export function createJWT(payload: UserPayload, expiresIn: string = '8h'): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function decodeJWT(token: string): UserPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch {
        return null;
    }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) return null;
    return decodeJWT(token);
}

export function guardParamsForPrefix(prefix: string | null): { isNull: string | null; like: string | null } {
    if (prefix === null) {
        return { isNull: null, like: null };
    }
    return { isNull: prefix, like: prefix };
}

export function ensureNokelAllowed(nokelValue: string, prefix: string | null): boolean {
    if (prefix === null) return true;
    return typeof nokelValue === 'string' && nokelValue.startsWith(prefix);
}
