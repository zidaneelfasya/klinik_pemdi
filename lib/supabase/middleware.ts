import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Create a service role client for admin checks (bypasses RLS)
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // No need to set cookies for admin client
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (
    request.nextUrl.pathname !== "/" && request.nextUrl.pathname !== "/coba" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
    && !request.nextUrl.pathname.includes("/api")
    
    && !request.nextUrl.pathname.startsWith("/api")
    && !request.nextUrl.pathname.includes("/konsultasi-form")
  && !request.nextUrl.pathname.includes("/ticket")
    && !request.nextUrl.pathname.includes("/ticket-cek")
    && !request.nextUrl.pathname.includes("/ticket-sukses")
    && !request.nextUrl.pathname.includes("/ticket-status")


  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Check if user is trying to access admin routes
  if (user && request.nextUrl.pathname.startsWith("/admin")) {
    // Get user profile to check role using admin client (bypasses RLS)
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.sub)
      .single();
      

    
    if (error) {
      console.error('Error fetching profile:', error);
    }

    if (!profile || profile.role !== "admin") {
      // User is not admin, redirect to access-denied page
      const url = request.nextUrl.clone();
      url.pathname = "/access-denied";
      return NextResponse.redirect(url);
    }

    // Additional check for specific admin routes that require superadmin access
    const restrictedAdminPaths = ["/admin/users", "/admin/contexts"];
    const isRestrictedPath = restrictedAdminPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );

    if (isRestrictedPath) {
      // Get user's assigned units to check if they have superadmin access
      const { data: userUnits } = await supabaseAdmin
        .from("user_unit_penanggungjawab")
        .select("unit_id")
        .eq("user_id", user.sub);

      // Check if user has superadmin unit (unit_id = 1)
      const isSuperAdmin = userUnits?.some(unit => unit.unit_id === 1) || false;

      if (!isSuperAdmin) {
        // User is not superadmin, redirect to no-access page
        const url = request.nextUrl.clone();
        url.pathname = "/admin/no-access";
        return NextResponse.redirect(url);
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
