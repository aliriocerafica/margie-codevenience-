import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [products, orders, users] = await Promise.all([
            prisma.product.count(),
            prisma.category.count(),
            prisma.user.count(),
        ]);

        return NextResponse.json({ products, orders, users });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
