import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Client - Uses runtime env from API route
 * 
 * Priority:
 * 1. window.__ENV__ (if injected by server)
 * 2. process.env (Next.js build-time inlining)
 * 3. Fetch from /api/env (fallback for Kubernetes)
 */

// TypeScript declaration for window env
declare global {
  interface Window {
    __ENV__?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY?: string;
    };
    __SUPABASE_ENV_LOADED__?: boolean;
  }
}

// Cache env vars after first load
let cachedEnv: { url: string; key: string } | null = null;

async function getEnvVars(): Promise<{ url: string; key: string }> {
  // Return cached if available
  if (cachedEnv) {
    return cachedEnv;
  }

  // Try window.__ENV__ first
  if (typeof window !== 'undefined' && window.__ENV__) {
    const url = window.__ENV__.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = window.__ENV__.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY || '';
    
    if (url && key) {
      console.log('[Supabase] Using window.__ENV__');
      cachedEnv = { url, key };
      return cachedEnv;
    }
  }

  // Try process.env (build-time inlining)
  const processUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const processKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
  
  if (processUrl && processKey) {
    console.log('[Supabase] Using process.env (build-time)');
    cachedEnv = { url: processUrl, key: processKey };
    return cachedEnv;
  }

  // Fallback: Fetch from API route
  console.log('[Supabase] Fetching env from /api/env...');
  try {
    const response = await fetch('/api/env');
    if (!response.ok) {
      throw new Error(`Failed to fetch env: ${response.status}`);
    }
    
    const data = await response.json();
    const url = data.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY || '';
    
    if (url && key) {
      console.log('[Supabase] Using env from API route');
      cachedEnv = { url, key };
      return cachedEnv;
    }
  } catch (error) {
    console.error('[Supabase] Failed to fetch env from API:', error);
  }

  // If all else fails, return empty
  console.error('[Supabase] ❌ No env vars available');
  return { url: '', key: '' };
}

export function createClient() {
  // For SSR/initial render, use process.env if available
  const initialUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const initialKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY || '';
  
  const client = createBrowserClient(initialUrl, initialKey);
  
  // In browser, update credentials asynchronously
  if (typeof window !== 'undefined' && !window.__SUPABASE_ENV_LOADED__) {
    getEnvVars().then(({ url, key }) => {
      if (url && key && url.startsWith('http')) {
        window.__SUPABASE_ENV_LOADED__ = true;
        console.log('✅ Supabase credentials loaded:', {
          url,
          keyPrefix: key.substring(0, 20) + '...'
        });
      }
    });
  }

  return client;
}
