import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = String(body?.code ?? "");
    const meta = body?.meta ?? {};

    // Server-side log visible in dev terminal
    console.log("[SCAN-LOG] code=", code, "meta=", meta);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[SCAN-LOG] error:", e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export const runtime = "nodejs";




