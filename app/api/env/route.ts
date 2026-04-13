/**
 * API Route to expose public environment variables to browser
 * This is needed because Next.js App Router doesn't support custom head injection
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY || ''
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    }
  });
}
