import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET - List void requests (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can view void requests
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const voidRequests = await prisma.voidRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(voidRequests);
  } catch (error) {
    console.error("Error fetching void requests:", error);
    return NextResponse.json({ error: "Failed to fetch void requests" }, { status: 500 });
  }
}

// POST - Create a new void request (staff only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { transactionNo, reason, transactionData } = body;

    if (!transactionNo || !transactionData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const voidRequest = await prisma.voidRequest.create({
      data: {
        transactionNo,
        requestedBy: user.id,
        requestedByEmail: user.email,
        reason: reason || null,
        transactionData: JSON.stringify(transactionData),
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, voidRequest });
  } catch (error) {
    console.error("Error creating void request:", error);
    return NextResponse.json({ error: "Failed to create void request" }, { status: 500 });
  }
}

