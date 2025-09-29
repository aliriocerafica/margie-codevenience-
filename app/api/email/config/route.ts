import { NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';

export async function GET() {
  try {
    const config = emailService.getConfigurationStatus();
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to get email configuration:', error);
    return NextResponse.json(
      { error: 'Failed to get email configuration' },
      { status: 500 }
    );
  }
}
