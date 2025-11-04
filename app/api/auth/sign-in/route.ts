import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: 'Email not found. Please check your email address and try again.' }, { status: 401 });
  }

  const isPasswordValid = await compare(password, user.password);

  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Incorrect password. Please check your password and try again.' }, { status: 401 });
  }

  return NextResponse.json({ message: 'Login successful', id: user.id,  email: user.email, role: user.role,}, { status: 200 });
}
