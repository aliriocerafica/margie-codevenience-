import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Clone the request to check if body exists
    const text = await req.text();
    if (!text || text.trim() === '') {
      console.log("[OPENFOODFACTS] Empty request body received, ignoring");
      return NextResponse.json({ ok: false, error: "Empty body" }, { status: 400 });
    }
    
    const body = JSON.parse(text);
    const { code, data } = body;
    
    if (!code) {
      console.log("[OPENFOODFACTS] No barcode code provided");
      return NextResponse.json({ ok: false, error: "No code" }, { status: 400 });
    }
    
    // Log to server terminal
    console.log("[OPENFOODFACTS] Product found:", {
      gtin: code,
      name: data?.name || "",
      brand: data?.brand || "",
      imageUrl: data?.imageUrl || "",
      categories: data?.categories || [],
    });
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[OPENFOODFACTS] Log error:", e);
    return NextResponse.json({ ok: false, error: "Parse error" }, { status: 400 });
  }
}

export const runtime = "nodejs";
