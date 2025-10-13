import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get current date boundaries
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        
        // Get yesterday boundaries for comparison
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayEnd);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

        const [products, categories, users, todaySales, yesterdaySales] = await Promise.all([
            prisma.product.count(),
            prisma.category.count(),
            prisma.user.count(),
            // Today's sales (positive sales only)
            prisma.sale.findMany({
                where: {
                    createdAt: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
            }),
            // Yesterday's sales for comparison
            prisma.sale.findMany({
                where: {
                    createdAt: {
                        gte: yesterdayStart,
                        lte: yesterdayEnd,
                    },
                },
            }),
        ]);

        // Calculate today's net sales
        const todayGrossSales = todaySales
            .filter(sale => sale.quantity > 0)
            .reduce((sum, sale) => sum + sale.totalAmount, 0);
        const todayReturns = todaySales
            .filter(sale => sale.quantity < 0)
            .reduce((sum, sale) => sum + Math.abs(sale.totalAmount), 0);
        const todayNetSales = todayGrossSales - todayReturns;

        // Calculate yesterday's net sales
        const yesterdayGrossSales = yesterdaySales
            .filter(sale => sale.quantity > 0)
            .reduce((sum, sale) => sum + sale.totalAmount, 0);
        const yesterdayReturns = yesterdaySales
            .filter(sale => sale.quantity < 0)
            .reduce((sum, sale) => sum + Math.abs(sale.totalAmount), 0);
        const yesterdayNetSales = yesterdayGrossSales - yesterdayReturns;

        // Calculate growth percentage
        const salesGrowth = yesterdayNetSales > 0
            ? ((todayNetSales - yesterdayNetSales) / yesterdayNetSales) * 100
            : todayNetSales > 0 ? 100 : 0;

        return NextResponse.json({ 
            products, 
            categories, 
            users,
            todaySales: todayNetSales,
            salesGrowth: Math.round(salesGrowth * 10) / 10,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
