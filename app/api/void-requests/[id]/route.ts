import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Approve or reject a void request (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!admin || admin.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, adminPassword } = body; // action: "approve" | "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Verify admin password if provided (for on-site approval)
    if (adminPassword) {
      const bcrypt = require("bcryptjs");
      const isValid = await bcrypt.compare(adminPassword, admin.password);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
      }
    }

    // Get the void request
    const voidRequest = await prisma.voidRequest.findUnique({
      where: { id },
    });

    if (!voidRequest) {
      return NextResponse.json({ error: "Void request not found" }, { status: 404 });
    }

    if (voidRequest.status !== "pending") {
      return NextResponse.json({ error: "Void request already processed" }, { status: 400 });
    }

    // Update void request status
    const updatedRequest = await prisma.voidRequest.update({
      where: { id },
      data: {
        status: action === "approve" ? "approved" : "rejected",
        approvedBy: admin.id,
        approvedByEmail: admin.email,
        approvedAt: new Date(),
      },
    });

    // If approved, process the void transaction
    if (action === "approve") {
      const transactionData = JSON.parse(voidRequest.transactionData);
      
      // Call the checkout API to void the transaction
      // Use requestedBy (staff who requested) as userId, not the admin who approved
      // This ensures "handled by" shows the staff member who requested the void
      const voidResult = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: transactionData.items,
          action: 'void',
          originalTransactionNo: voidRequest.transactionNo,
          requestedByUserId: voidRequest.requestedBy, // Use the staff member who requested, not admin
          approvedBy: admin.id, // Log who approved this void (for audit purposes)
        }),
      });

      if (!voidResult.ok) {
        return NextResponse.json({ error: "Failed to process void" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, voidRequest: updatedRequest });
  } catch (error) {
    console.error("Error updating void request:", error);
    return NextResponse.json({ error: "Failed to update void request" }, { status: 500 });
  }
}

