import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") || "").trim();
  if (!code) {
    return NextResponse.json({ found: false, error: "missing_code" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findFirst({ 
      where: { barcode: code },
      include: {
        category: true
      }
    });
    if (!product) {
      return NextResponse.json({ found: false });
    }
    return NextResponse.json({ found: true, product });
  } catch (e) {
    console.error("[by-barcode] lookup error", e);
    return NextResponse.json({ found: false, error: "server_error" }, { status: 500 });
  }
}

export const runtime = "nodejs";


