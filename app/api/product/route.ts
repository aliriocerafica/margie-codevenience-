import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const product = await prisma.product.findMany({
      include: {
          category:
          {
              select:
              {
                  name: true
              }
          }
      },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(product);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, stock, status, imageUrl, barcode, categoryId } = body;

    if (!name || !price || !stock || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const created = await prisma.product.create({
      data: { name, price, stock, status, imageUrl, barcode, categoryId },
      include: { category: { select: { name: true } } },
    });

    return NextResponse.json({ message: "Product created", product: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...update } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const updated = await prisma.product.update({
      where: { id },
      data: update,
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json({ message: "Product updated", product: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product 123" }, { status: 500 });
  }
}
