import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailAddress, emailAlerts, pushNotifications, lowStockThreshold } = body;

    // Validate required fields
    if (emailAlerts && !emailAddress) {
      return NextResponse.json(
        { error: 'Email address is required when email alerts are enabled' },
        { status: 400 }
      );
    }

    // Validate email format
    if (emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // For now, we'll store settings in a simple way
    // In a real application, you might want to store this in a database
    const settings = {
      emailAddress,
      emailAlerts,
      pushNotifications,
      lowStockThreshold,
      updatedAt: new Date().toISOString()
    };

    // Store in localStorage equivalent (you might want to use a database instead)
    // This is a simplified approach - in production, store in database
    console.log('Email settings saved:', settings);

    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully',
      settings
    });
  } catch (error) {
    console.error('Failed to save email settings:', error);
    return NextResponse.json(
      { error: 'Failed to save email settings' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return current email settings
    // In a real application, fetch from database
    return NextResponse.json({
      success: true,
      settings: {
        emailAddress: '',
        emailAlerts: false,
        pushNotifications: true,
        lowStockThreshold: 10
      }
    });
  } catch (error) {
    console.error('Failed to get email settings:', error);
    return NextResponse.json(
      { error: 'Failed to get email settings' },
      { status: 500 }
    );
  }
}
