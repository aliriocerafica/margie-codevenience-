import { NextRequest, NextResponse } from "next/server";
import { normalizeToEan13 } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

// Note: UPCitemdb and Datakick removed per requirement to use only local DB then Open Food Facts.

async function fetchFromOpenFoodFacts(ean13: string) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${ean13}.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status !== 1) return null;
    const p = data.product;
    return {
      source: "openfoodfacts",
      gtin: ean13,
      name: p.product_name || p.generic_name || "",
      brand: Array.isArray(p.brands_tags) && p.brands_tags.length ? p.brands_tags[0] : p.brands || "",
      product: p.generic_name || p.product_name || "",
      quantity: "", // Don't fill quantity - this should be for stock count like "1 pc"
      size: p.quantity || "", // Use OpenFoodFacts quantity for size/weight
      imageUrl: p.image_front_small_url || p.image_url || "",
      categories: p.categories_hierarchy || [],
      nutriments: p.nutriments || {},
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  const norm = normalizeToEan13(code);
  if (!norm.ean13) {
    return NextResponse.json({ found: false, error: "invalid_barcode" }, { status: 400 });
  }

  const ean13 = norm.ean13;

  // 1) Try local DB first (authoritative)
  try {
    const local = await prisma.product.findFirst({ where: { barcode: code } });
    if (local) {
      return NextResponse.json({
        found: true,
        source: "local",
        normalizedGtin: ean13,
        product: local,
      });
    }
  } catch {}

// 2) Try Open Food Facts (foods)
  const off = await fetchFromOpenFoodFacts(ean13);
  if (off) {
    try {
      console.log("[OPENFOODFACTS]", {
        gtin: off.gtin,
        name: off.name,
        brand: off.brand,
        imageUrl: off.imageUrl,
        categories: Array.isArray(off.categories) ? off.categories.slice(0, 5) : off.categories,
      });
    } catch {}
    return NextResponse.json({ found: true, source: "openfoodfacts", normalizedGtin: ean13, product: off });
  }

  return NextResponse.json({ found: false, normalizedGtin: ean13 });
}

export const runtime = "nodejs";

