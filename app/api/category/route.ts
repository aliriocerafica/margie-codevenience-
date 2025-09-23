import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Map to include productCount and a default status for UI
  const payload = categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    productCount: c._count?.products ?? 0,
    status: "active",
  }));

  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const created = await prisma.category.create({ data: { name } });
    return NextResponse.json({ message: "Category created", category: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const updated = await prisma.category.update({ where: { id }, data: { name } });
    return NextResponse.json({ message: "Category updated", category: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}
