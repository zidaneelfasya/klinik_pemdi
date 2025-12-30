import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    const response = await fetch(`${process.env.WHATSAPP_SERVICE_URL}/add-authorized-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber })
    });
    // console.log(process.env.WHATSAPP_SERVICE_URL)
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add authorized user" },
      { status: 500 }
    );
  }
}
