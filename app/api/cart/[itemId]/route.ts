import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// PUT - Update cart item quantity
export async function PUT(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
    try {
        const session = await auth();
        const sessionId = session?.user?.id || 'anonymous';
        const { quantity } = await req.json();
        const { itemId } = await params;

        if (quantity < 1) {
            return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
        }

        // Find cart item
        const cartItem = await prisma.cartItem.findFirst({
            where: {
                id: itemId,
                cart: {
                    OR: [
                        { userId: session?.user?.id },
                        { sessionId: sessionId }
                    ]
                }
            }
        });

        if (!cartItem) {
            return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
        }

        // Update quantity
        const updatedItem = await prisma.cartItem.update({
            where: {
                id: itemId
            },
            data: {
                quantity: quantity
            },
            include: {
                product: {
                    include: {
                        category: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error('Update cart item error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Remove cart item
export async function DELETE(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
    try {
        const session = await auth();
        const sessionId = session?.user?.id || 'anonymous';
        const { itemId } = await params;

        // Find cart item
        const cartItem = await prisma.cartItem.findFirst({
            where: {
                id: itemId,
                cart: {
                    OR: [
                        { userId: session?.user?.id },
                        { sessionId: sessionId }
                    ]
                }
            }
        });

        if (!cartItem) {
            return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
        }

        // Delete item
        await prisma.cartItem.delete({
            where: {
                id: itemId
            }
        });

        return NextResponse.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Remove cart item error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
