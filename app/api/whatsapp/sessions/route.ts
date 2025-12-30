import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${process.env.WHATSAPP_SERVICE_URL}/sessions`);
    const data = await response.json();
    
    return NextResponse.json({
      sessions: data
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
