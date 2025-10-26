import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// GET - Get cart items
export async function GET() {
    try {
        const session = await auth();
        const sessionId = session?.user?.id || 'anonymous';
        
        // Find or create cart
        let cart = await prisma.cart.findFirst({
            where: {
                OR: [
                    { userId: session?.user?.id },
                    { sessionId: sessionId }
                ]
            },
            include: {
                items: {
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
                }
            }
        });

        if (!cart) {
            // Create new cart
            cart = await prisma.cart.create({
                data: {
                    sessionId: sessionId,
                    userId: session?.user?.id || null
                },
                include: {
                    items: {
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
                    }
                }
            });
        }

        return NextResponse.json(cart.items);
    } catch (error) {
        console.error('Cart API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Add item to cart
export async function POST(req: Request) {
    try {
        const session = await auth();
        const sessionId = session?.user?.id || 'anonymous';
        const { productId, quantity = 1 } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        // Find or create cart
        let cart = await prisma.cart.findFirst({
            where: {
                OR: [
                    { userId: session?.user?.id },
                    { sessionId: sessionId }
                ]
            }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    sessionId: sessionId,
                    userId: session?.user?.id || null
                }
            });
        }

        // Check if product already exists in cart
        const existingItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: productId
                }
            }
        });

        if (existingItem) {
            // Update quantity
            const updatedItem = await prisma.cartItem.update({
                where: {
                    id: existingItem.id
                },
                data: {
                    quantity: existingItem.quantity + quantity
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
        } else {
            // Add new item
            const newItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: productId,
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
            return NextResponse.json(newItem);
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Clear cart
export async function DELETE() {
    try {
        const session = await auth();
        const sessionId = session?.user?.id || 'anonymous';
        
        const cart = await prisma.cart.findFirst({
            where: {
                OR: [
                    { userId: session?.user?.id },
                    { sessionId: sessionId }
                ]
            }
        });

        if (cart) {
            await prisma.cartItem.deleteMany({
                where: {
                    cartId: cart.id
                }
            });
        }

        return NextResponse.json({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear cart error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
