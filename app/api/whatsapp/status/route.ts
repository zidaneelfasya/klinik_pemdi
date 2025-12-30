import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Forward request ke WhatsApp service backend
    const response = await fetch(`${process.env.WHATSAPP_SERVICE_URL}/health`);
    const data = await response.json();
    
    // Transform data untuk frontend
    let status = "DISCONNECTED";
    if (data.whatsapp === "connected") {
      status = "CONNECTED";
    } else if (data.whatsapp === "connecting") {
      status = "CONNECTING";
    } else if (data.whatsapp === "qr_ready") {
      status = "QR_READY";
    } else if (data.whatsapp === "authenticating") {
      status = "AUTHENTICATING";
    } else if (data.error) {
      status = "ERROR";
    }

    return NextResponse.json({
      status,
      info: data.info,
      loadingPercent: data.loadingPercent,
      loadingMessage: data.loadingMessage,
      qrCode: data.qrCode,
      error: data.error
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: "ERROR", 
        error: "Failed to connect to WhatsApp service" 
      },
      { status: 500 }
    );
  }
}
