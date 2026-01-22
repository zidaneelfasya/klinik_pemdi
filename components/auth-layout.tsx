import Image from "next/image";

export function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted px-4">
            <div className="w-full max-w-6xl flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-lg bg-white">

                {/* KIRI */}
                <div className="relative w-full md:w-1/2 h-[260px] md:h-[600px]">
                    <Image
                        src="/images/form.png"
                        alt="Background"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/30" />

                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center space-y-4">
                        <h1 className="text-3xl font-bold">Klinik Pemerintah Digital</h1>
                        <p className="text-sm opacity-90">
                            Untuk mendapatkan akses Admin Instansi, hubungi:
                        </p>
                        <div className="bg-white text-black px-6 py-2 rounded-full font-medium">
                            +62 895-3645-23741
                        </div>
                    </div>
                </div>

                {/* KANAN */}
                <div className="w-full md:w-1/2 flex items-center justify-center p-6">
                    {children}
                </div>

            </div>
        </div>
    );
}
