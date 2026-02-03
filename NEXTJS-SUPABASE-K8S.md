# Next.js App Router + Supabase + Kubernetes: Best Practices

Complete guide untuk setup Supabase dengan Next.js App Router di Kubernetes deployment.

---

## 🎯 Problem Statement

**Error**: `Uncaught ReferenceError: process is not defined` di browser

**Root Cause**: 
- `process.env` adalah Node.js API, TIDAK tersedia di browser
- Client components yang akses `process.env` akan error di browser runtime
- Meskipun image di-build dengan build args, jika code akses `process.env` saat runtime, tetap error

---

## ✅ Solution Architecture

### 1. Environment Variable Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Build Time (Docker)                                         │
│                                                              │
│ docker build --build-arg NEXT_PUBLIC_SUPABASE_URL=...      │
│              --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... │
│                                                              │
│ Next.js Build Process:                                      │
│ - Inlines NEXT_PUBLIC_* into JS bundle (if available)      │
│ - Server components: process.env available                  │
│ - Client components: process.env NOT available at runtime   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Runtime (Kubernetes Pod)                                    │
│                                                              │
│ Deployment env:                                             │
│ - NEXT_PUBLIC_SUPABASE_URL (from Secret)                   │
│ - SUPABASE_SERVICE_ROLE_KEY (from Secret)                  │
│                                                              │
│ Root Layout (Server Component):                             │
│ - Read process.env (server-side, OK)                       │
│ - Inject to window.__ENV__ via <script>                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Browser (Client)                                            │
│                                                              │
│ Client Components:                                          │
│ - Access window.__ENV__ (injected from server)             │
│ - Fallback to process.env (if built with build args)       │
│ - ❌ NEVER access process.env directly at runtime          │
└─────────────────────────────────────────────────────────────┘
```

### 2. File Structure

```
klinik_pemdi/
├── app/
│   ├── layout.tsx              # ✅ Root layout with env injection
│   ├── page.tsx                # Server Component (can use server.ts)
│   └── api/
│       └── route.ts            # API Route (use server.ts)
├── components/
│   ├── client-component.tsx    # 'use client' (use client.ts)
│   └── server-component.tsx    # Server Component (use server.ts)
└── lib/
    └── supabase/
        ├── client.ts           # ✅ Browser client (window.__ENV__)
        ├── server.ts           # ✅ Server client (process.env)
        └── middleware.ts       # Middleware client
```

---

## 📁 Implementation Files

### 1. Root Layout with Env Injection

**File**: `app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Klinik Pemerintah Digital",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ✅ CRITICAL: Inject env vars for browser access
  // This runs on SERVER, so process.env is available
  const envScript = `
    window.__ENV__ = {
      NEXT_PUBLIC_SUPABASE_URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: "${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY || ''}"
    };
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ Inject BEFORE any client script runs */}
        <script dangerouslySetInnerHTML={{ __html: envScript }} />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Key Points**:
- ✅ Root layout is Server Component - `process.env` available
- ✅ Inject env to `window.__ENV__` before client scripts run
- ✅ Client components can access `window.__ENV__` safely
- ✅ Works in Kubernetes (env from secrets) AND local dev

---

### 2. Browser Supabase Client

**File**: `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Client - MUST NOT access process.env at runtime
 * 
 * In Kubernetes: Env variables are injected via window.__ENV__ from root layout
 * In Next.js build: NEXT_PUBLIC_* vars are inlined during build
 * 
 * Priority:
 * 1. window.__ENV__ (Kubernetes runtime injection)
 * 2. process.env (Next.js build-time inlining) - only works if built with env
 */

// TypeScript declaration for window env
declare global {
  interface Window {
    __ENV__?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY?: string;
    };
  }
}

export function createClient() {
  // ✅ CRITICAL: Check window first (Kubernetes), fallback to process.env (local dev)
  const supabaseUrl = 
    (typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_SUPABASE_URL) ||
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    '';
    
  const supabaseAnonKey = 
    (typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY) ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY || 
    '';
  
  // Debug logging (browser only)
  if (typeof window !== 'undefined') {
    const source = window.__ENV__ ? 'window.__ENV__' : 'process.env (build-time)';
    
    if (supabaseUrl && supabaseAnonKey && supabaseAnonKey.startsWith('eyJ')) {
      console.log('✅ Supabase Browser Client initialized:', {
        source,
        url: supabaseUrl,
        keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
      });
    } else {
      console.error('❌ Supabase credentials missing or invalid:', {
        source,
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlValue: supabaseUrl || '(empty)',
        keyValid: supabaseAnonKey.startsWith('eyJ'),
      });
    }
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
```

**Key Points**:
- ✅ Prioritize `window.__ENV__` (injected by server)
- ✅ Fallback to `process.env` (build-time inlining for local dev)
- ✅ Type-safe with TypeScript declarations
- ✅ Debug logging to verify which source is used
- ❌ NEVER directly access `process.env` without fallback

---

### 3. Server Supabase Client

**File**: `lib/supabase/server.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Client - For API Routes, Server Components, Server Actions
 * 
 * ✅ Can safely access process.env (runs on server)
 * ✅ Uses SERVICE_ROLE_KEY (full access)
 * ⚠️  NEVER expose service role key to client
 */

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // Simple log untuk debugging
  if (supabaseUrl && supabaseServiceKey && supabaseServiceKey.startsWith('eyJ')) {
    console.log('✅ Supabase Server Client initialized');
  } else {
    console.error('❌ Supabase server credentials missing');
  }

  return createServerClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
```

**Key Points**:
- ✅ Runs on server - `process.env` available
- ✅ Uses `SUPABASE_SERVICE_ROLE_KEY` (full database access)
- ⚠️ NEVER import this in client components
- ✅ For API routes, Server Components, Server Actions only

---

## 📖 Usage Examples

### Example 1: Client Component (React)

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function UserProfile() {
  const [user, setUser] = useState(null);
  const supabase = createClient(); // ✅ Uses window.__ENV__

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
  }, []);

  return <div>Welcome {user?.email}</div>;
}
```

**Key Points**:
- ✅ `'use client'` directive at top
- ✅ Use `lib/supabase/client.ts`
- ✅ Access `window.__ENV__` (injected from layout)
- ❌ NEVER import `lib/supabase/server.ts` in client components

---

### Example 2: Server Component

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient(); // ✅ Uses process.env
  
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .limit(10);

  return (
    <div>
      <h1>Users</h1>
      {users?.map(user => (
        <div key={user.id}>{user.email}</div>
      ))}
    </div>
  );
}
```

**Key Points**:
- ✅ No `'use client'` - Server Component by default
- ✅ Use `lib/supabase/server.ts`
- ✅ Can use `await` at top level
- ✅ Has full database access (service role key)

---

### Example 3: API Route Handler

```typescript
// app/api/users/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient(); // ✅ Uses process.env
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('users')
    .insert(body);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
```

**Key Points**:
- ✅ Use `lib/supabase/server.ts`
- ✅ Full CRUD operations with service role key
- ✅ Proper error handling
- ✅ Return NextResponse

---

### Example 4: Server Action

```typescript
// app/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const supabase = await createClient(); // ✅ Uses process.env
  
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  
  const { error } = await supabase
    .from('users')
    .insert({ email, name });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
```

**Key Points**:
- ✅ `'use server'` directive at top
- ✅ Use `lib/supabase/server.ts`
- ✅ Can revalidate cache
- ✅ Type-safe with FormData

---

## 🚫 Common Mistakes to Avoid

### ❌ Mistake 1: Accessing process.env in Client Component

```typescript
'use client';

export function BadComponent() {
  // ❌ ERROR: process is not defined
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  return <div>{url}</div>;
}
```

**Fix**: Use `window.__ENV__` or import from `lib/supabase/client.ts`

---

### ❌ Mistake 2: Using Server Client in Client Component

```typescript
'use client';

// ❌ WRONG: server.ts exports async function
import { createClient } from '@/lib/supabase/server';

export function BadComponent() {
  const supabase = await createClient(); // ❌ Can't await in client
  return <div>Bad</div>;
}
```

**Fix**: Use `lib/supabase/client.ts` for client components

---

### ❌ Mistake 3: Exposing Service Role Key to Client

```typescript
// ❌ DANGER: Never do this
const envScript = `
  window.__ENV__ = {
    SUPABASE_SERVICE_ROLE_KEY: "${process.env.SUPABASE_SERVICE_ROLE_KEY}"
  };
`;
```

**Fix**: Only inject `NEXT_PUBLIC_*` variables. Service role key ONLY for server.

---

### ❌ Mistake 4: Not Checking window Before Access

```typescript
// ❌ ERROR: window is not defined (during SSR)
const url = window.__ENV__.NEXT_PUBLIC_SUPABASE_URL;
```

**Fix**: Always check `typeof window !== 'undefined'`

```typescript
// ✅ CORRECT
const url = typeof window !== 'undefined' 
  ? window.__ENV__?.NEXT_PUBLIC_SUPABASE_URL 
  : '';
```

---

## 🔒 Security Best Practices

### 1. Environment Variable Separation

```yaml
# Kubernetes Secret
apiVersion: v1
kind: Secret
metadata:
  name: supabase-credentials
stringData:
  # ✅ Public - safe to expose to browser
  supabase-url: "https://xxx.supabase.co"
  supabase-anon-key: "eyJ..." # JWT with limited access
  
  # ⚠️ Private - NEVER expose to browser
  supabase-service-role-key: "eyJ..." # Full database access
```

### 2. Deployment Env Variables

```yaml
# deployment.yaml
env:
  # ✅ Safe for browser (via window.__ENV__)
  - name: NEXT_PUBLIC_SUPABASE_URL
    valueFrom:
      secretKeyRef:
        name: supabase-credentials
        key: supabase-url
  
  - name: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
    valueFrom:
      secretKeyRef:
        name: supabase-credentials
        key: supabase-anon-key
  
  # ⚠️ Server-only (NEVER inject to window)
  - name: SUPABASE_SERVICE_ROLE_KEY
    valueFrom:
      secretKeyRef:
        name: supabase-credentials
        key: supabase-service-role-key
```

### 3. Build-time vs Runtime

```dockerfile
# Dockerfile
# ✅ Build args for NEXT_PUBLIC_* (optional, for build-time inlining)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

# ⚠️ NEVER add service role key as build arg
# ARG SUPABASE_SERVICE_ROLE_KEY  # ❌ WRONG
```

---

## 🧪 Testing & Verification

### 1. Browser Console Test

```javascript
// Open browser console (F12)
console.log('Env source:', window.__ENV__ ? 'window.__ENV__' : 'build-time');
console.log('Supabase URL:', window.__ENV__?.NEXT_PUBLIC_SUPABASE_URL);
console.log('Has anon key:', !!window.__ENV__?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY);
```

**Expected Output**:
```
Env source: window.__ENV__
Supabase URL: https://zvoxkzzobibnqwlkfblq.supabase.co
Has anon key: true
```

### 2. Verify in Pod

```bash
POD=$(kubectl get pods -n klinik-pemdi -l app=klinik-pemdi --no-headers | head -1 | awk '{print $1}')

# Check env variables
kubectl exec $POD -n klinik-pemdi -- printenv | grep SUPABASE

# Expected output:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Test Supabase Connection

```typescript
// components/test-supabase.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function TestSupabase() {
  const [status, setStatus] = useState('testing...');
  
  useEffect(() => {
    async function test() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('users').select('count');
        
        if (error) {
          setStatus('❌ Error: ' + error.message);
        } else {
          setStatus('✅ Connected successfully');
        }
      } catch (err: any) {
        setStatus('❌ Exception: ' + err.message);
      }
    }
    test();
  }, []);

  return <div>{status}</div>;
}
```

---

## 📋 Checklist

Before deploying:

- [ ] ✅ Root layout injects env to `window.__ENV__`
- [ ] ✅ `lib/supabase/client.ts` checks `window.__ENV__` first
- [ ] ✅ Client components use `'use client'` directive
- [ ] ✅ Client components import from `lib/supabase/client.ts`
- [ ] ✅ Server components import from `lib/supabase/server.ts`
- [ ] ✅ API routes import from `lib/supabase/server.ts`
- [ ] ✅ Service role key NEVER exposed to client
- [ ] ✅ Kubernetes secrets configured correctly
- [ ] ✅ Deployment env variables mapped from secrets
- [ ] ✅ Browser console shows "✅ Supabase Browser Client initialized"
- [ ] ✅ No "process is not defined" errors

---

## 🚀 Deployment Steps

### 1. Rebuild Image with Updated Code

```bash
cd /home/zidaneelfasya/D/containeraze

# Rebuild with credentials (optional for build-time inlining)
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://zvoxkzzobibnqwlkfblq.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY="eyJ..." \
  -t zidaneelfasya/klinik-pemdi:latest \
  ./klinik_pemdi/

# Or build without args (window.__ENV__ injection will handle it)
docker build -t zidaneelfasya/klinik-pemdi:latest ./klinik_pemdi/
```

### 2. Load to Minikube

```bash
minikube image load zidaneelfasya/klinik-pemdi:latest
```

### 3. Restart Deployment

```bash
kubectl rollout restart deployment/klinik-pemdi -n klinik-pemdi
kubectl rollout status deployment/klinik-pemdi -n klinik-pemdi
```

### 4. Verify

```bash
# Check logs
kubectl logs -n klinik-pemdi -l app=klinik-pemdi --tail=50

# Open browser
# Navigate to: http://klinik.example.com
# Open console (F12)
# Should see: "✅ Supabase Browser Client initialized"
```

---

## 📚 References

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [@supabase/ssr Documentation](https://github.com/supabase/auth-helpers/tree/main/packages/ssr)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Last Updated**: February 3, 2026
