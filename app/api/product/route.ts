import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
