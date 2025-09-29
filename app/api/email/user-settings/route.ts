import { NextRequest, NextResponse } from 'next/server';
import { emailSettings } from '@/lib/emailSettings';

export async function GET(request: NextRequest) {
  try {
    const currentSettings = emailSettings.get();
    
    return NextResponse.json({
      success: true,
      settings: currentSettings || {
        emailAddress: '',
        emailAlerts: false,
        pushNotifications: true,
        useDefaultEmail: true,
        lowStockThreshold: 10
      }
    });
  } catch (error) {
    console.error('Failed to get user email settings:', error);
    return NextResponse.json(
      { error: 'Failed to get user email settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailAddress, emailAlerts, pushNotifications, useDefaultEmail, lowStockThreshold } = body;

    // Validate email format only if not using default email and email is provided
    if (!useDefaultEmail && emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Store settings using our email settings utility
    const settings = {
      emailAddress: useDefaultEmail ? '' : emailAddress,
      emailAlerts,
      pushNotifications,
      useDefaultEmail,
      lowStockThreshold,
      updatedAt: new Date().toISOString()
    };

    emailSettings.set(settings);

    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully',
      settings
    });
  } catch (error) {
    console.error('Failed to save user email settings:', error);
    return NextResponse.json(
      { error: 'Failed to save user email settings' },
      { status: 500 }
    );
  }
}
