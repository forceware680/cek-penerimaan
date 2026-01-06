import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

export function formatCurrency(value: number): string {
    return value.toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
    });
}

export function formatDate(date: Date | string): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(0, 19).replace('T', ' ');
}

export function toDottedPB(prefix16: string = ''): string {
    const p = (prefix16 || '').slice(0, 16);
    if (p.length !== 16) return '';
    return `${p.slice(0, 6)}.${p.slice(6, 11)}.${p.slice(11, 16)}`;
}
