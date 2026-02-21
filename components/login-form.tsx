"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const translateError = (errorMessage: string): string => {
    const errorLower = errorMessage.toLowerCase();
    
    if (errorLower.includes("invalid login credentials") || 
        errorLower.includes("invalid credentials") ||
        errorLower.includes("email not confirmed") ||
        errorLower.includes("incorrect email or password")) {
      return "Email atau kata sandi tidak valid";
    }
    
    if (errorLower.includes("email rate limit exceeded") ||
        errorLower.includes("too many requests")) {
      return "Terlalu banyak percobaan. Silakan coba lagi nanti";
    }
    
    if (errorLower.includes("network") || errorLower.includes("fetch")) {
      return "Terjadi kesalahan jaringan. Silakan coba lagi";
    }
    
    if (errorLower.includes("user not found")) {
      return "Pengguna tidak ditemukan";
    }
    
    if (errorLower.includes("password")) {
      return "Kata sandi salah";
    }
    
    // Default fallback
    return "Terjadi kesalahan saat masuk. Silakan coba lagi";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/admin");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat masuk";
      setError(translateError(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Masuk</CardTitle>
          <CardDescription>
            Silakan masukkan email dan kata sandi untuk masuk ke akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Reset custom validity
                    e.target.setCustomValidity("");
                  }}
                  onInvalid={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.validity.valueMissing) {
                      target.setCustomValidity("Email harus diisi");
                    } else if (target.validity.typeMismatch) {
                      target.setCustomValidity("Format email tidak valid. Contoh: nama@email.com");
                    } else {
                      target.setCustomValidity("Email tidak valid");
                    }
                  }}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Kata Sandi</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Lupa kata sandi?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Reset custom validity
                    e.target.setCustomValidity("");
                  }}
                  onInvalid={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.validity.valueMissing) {
                      target.setCustomValidity("Kata sandi harus diisi");
                    } else {
                      target.setCustomValidity("Kata sandi tidak valid");
                    }
                  }}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sedang masuk..." : "Masuk"}
              </Button>
            </div>

            {/* <div className="mt-4 text-center text-sm">
              Belum memiliki akun?{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                Daftar
              </Link>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );

}
