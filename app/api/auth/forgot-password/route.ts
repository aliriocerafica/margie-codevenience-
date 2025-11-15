import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/emailService";
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

    // Save reset token to database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Generate reset link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send email with reset link
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      resetLink,
      user.email
    );

    if (!emailSent) {
      console.error('Failed to send password reset email');
      // Still return success message for security (don't reveal if email failed)
    }

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
