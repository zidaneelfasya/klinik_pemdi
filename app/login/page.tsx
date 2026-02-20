"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
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
			router.push("/protected");
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat masuk";
			setError(translateError(errorMessage));
		} finally {
			setIsLoading(false);
		}
	};
	return (
		<div className="min-h-screen bg-black flex items-center justify-center p-4">
			{/* Main Card Container */}
			<Card className="w-full max-w-6xl border-none rounded-2xl overflow-hidden p-4 bg-[#080808]">
				<div className="flex flex-col lg:flex-row min-h-[700px]">
					{/* Increased height */}

					<div className="flex-1 relative">
						<div className="absolute inset-0">
							<Image
								src="/images/form.png"
								alt="Background Gradient"
								fill
								className="object-cover rounded-2xl"
								priority
							/>
						</div>

						{/* Overlay untuk meningkatkan keterbacaan teks */}
						<div className="absolute inset-0 bg-black/20"></div>

						{/* Konten di atas gambar */}
						<div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center text-white space-y-6">
							<h1 className="text-2xl font-bold text-balance">
								Klinik Pemerintah Digital
							</h1>
							<p className="text-sm opacity-90 text-balance max-w-md">
								Ikuti langkah-langkah mudah berikut untuk mulai menggunakan
								layanan digital kami:
							</p>

							<div className="space-y-4 mt-8 w-full max-w-xs">
								<div className="bg-white backdrop-blur-md rounded-lg py-3 px-6 border border-white/20">
									<span className="text-black font-medium">
										1. Daftar akun dengan email
									</span>
								</div>
								<div className="bg-white backdrop-blur-md rounded-lg py-3 px-6 border border-white/20">
									<span className="text-black font-medium">
										2. Verifikasi akun Anda
									</span>
								</div>
								<div className="bg-white backdrop-blur-md rounded-lg py-3 px-6 border border-white/20">
									<span className="text-black font-medium">
										3. Masuk dan mulai menggunakan layanan
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Right Panel - Login Form */}
					<div className="flex-1 flex items-center justify-center p-8">
						<div className="w-full max-w-xs space-y-6">
							<div className="text-center space-y-2">
								<h2 className="text-2xl font-bold text-white text-balance">
									Selamat Datang Kembali
								</h2>
								<p className="text-gray-400 text-sm">
									Belum Punya Akun?{" "}
									<button className="text-white hover:underline">Daftar</button>
								</p>
							</div>

							<form className="space-y-4" onSubmit={handleLogin}>
								<div>
									<Label className="text-white" htmlFor="email">
										Email
									</Label>
									<Input
										id="email"
										type="email"
										placeholder="m@example.com"
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
										className=" bg-[#3b3b3b] border-gray-700 text-white placeholder:text-gray-500 h-10 rounded-lg mb-4 "
									/>
									{/* <Input
										type="email"
										placeholder="Email address"
										
									/> */}
								</div>
								<div>
									<div className="flex items-center text-white">
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
										className="bg-[#3b3b3b] border-gray-700 text-white placeholder:text-gray-500 h-10 rounded-lg mb-4"

									/>
									{/* <Input
										type="password"
										placeholder="Password"
										className="bg-[#3b3b3b] border-gray-700 text-white placeholder:text-gray-500 h-12 rounded-lg"
									/> */}
								</div>
								{error && (
									<p className="text-sm text-red-400 text-center">{error}</p>
								)}
								<Button
									type="submit"
									className="w-full h-10 bg-white text-black hover:bg-gray-100 rounded-lg font-medium"
									disabled={isLoading}
								>
									{isLoading ? "Sedang masuk..." : "Masuk"}
								</Button>
							</form>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
