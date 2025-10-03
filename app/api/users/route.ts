import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("API: Fetching users...");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`API: Found ${users.length} users`);
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: { 
          id: newUser.id, 
          email: newUser.email, 
          role: newUser.role,
          createdAt: newUser.createdAt 
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, email, role, password } = body as {
      id?: string;
      email?: string;
      role?: string;
      password?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: "Missing user id" },
        { status: 400 }
      );
    }

    // Ensure user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};

    if (email && email !== existingUser.email) {
      // Check uniqueness of email
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken && emailTaken.id !== id) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 400 }
        );
      }
      dataToUpdate.email = email;
    }

    if (role && role !== existingUser.role) {
      dataToUpdate.role = role;
    }

    if (password && password.length > 0) {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdate.password = hashedPassword;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: "No changes provided", user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          createdAt: existingUser.createdAt,
          updatedAt: existingUser.updatedAt,
        } },
        { status: 200 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(
      { message: "User updated successfully", user: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}