"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Semua kolom harus diisi.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
        data: { is_first_login: false },
      });

      if (error) throw error;

      toast.success("Kata sandi berhasil disimpan! Silakan login.");

      // Sign out pengguna agar dipaksa login ulang menggunakan password baru
      await supabase.auth.signOut();

      // Arahkan masuk ke halaman login
      router.replace("/auth/login");


    } catch (err: any) {
      console.error(err);
      toast.error("Gagal menyimpan sandi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-amber-500">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-amber-100 rounded-full">
              <ShieldCheck className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Buat Kata Sandi</CardTitle>
          <CardDescription>
            Silakan buat kata sandi pribadi untuk mengaktifkan akun dan mengakses dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password"> Buat Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Ulang</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password di atas..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengamankan Data...
                </>
              ) : (
                "Simpan & Login Ulang"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
