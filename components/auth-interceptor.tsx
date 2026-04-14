"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

export default function AuthInterceptor() {
  const router = useRouter();
  const pathname = usePathname();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };

  useEffect(() => {
    const supabase = getSupabase();

    // Mengecek langsung sesi secara asinkron saat mount pertama kali
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.is_first_login === true) {
        if (pathname !== '/update-password' && !pathname.startsWith('/api')) {
          router.replace('/update-password');
        }
      }
    };

    checkSession();

    // Memasang pendengar (listerner) jika sesi berubah atau baru didapatkan
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          const isFirstLogin = session.user.user_metadata?.is_first_login === true;
          if (isFirstLogin && pathname !== '/update-password') {
            router.replace('/update-password');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
