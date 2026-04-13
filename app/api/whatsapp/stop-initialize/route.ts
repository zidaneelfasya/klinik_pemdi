import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${process.env.WHATSAPP_SERVICE_URL}/stop-initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to stop WhatsApp initialization" },
      { status: 500 }
    );
  }
}
