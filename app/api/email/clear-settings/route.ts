import { NextResponse } from 'next/server';
import { emailSettings } from '@/lib/emailSettings';

export async function POST() {
  try {
    emailSettings.clear();
    
    return NextResponse.json({
      success: true,
      message: 'Email settings cleared successfully'
    });
  } catch (error) {
    console.error('Failed to clear email settings:', error);
    return NextResponse.json(
      { error: 'Failed to clear email settings' },
      { status: 500 }
    );
  }
}
