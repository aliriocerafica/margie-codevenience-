// app\api\upload

import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = "edge"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Invalid or missing file' }, { status: 400 });
    }

    // Use file object directly for upload with random suffix to avoid conflicts
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error in upload API:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}