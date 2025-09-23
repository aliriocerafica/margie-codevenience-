import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";


export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // For security, always return the same message regardless of whether user exists
    if (!user) {
      return NextResponse.json(
        { message: "If an account with that email exists, we've sent you a password reset link." },
        { status: 200 }
      );
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update user with reset token (you may want to add these fields to your schema)
    // For now, we'll just log the token - in production, you'd save it to the database
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`);

    // TODO: Send email with reset link
    // In a real application, you would:
    // 1. Save the resetToken and resetTokenExpiry to the user record
    // 2. Send an email with the reset link using a service like SendGrid, Nodemailer, etc.
    
    // For now, we'll just return success
    return NextResponse.json(
      { message: "If an account with that email exists, we've sent you a password reset link." },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
